import requests
import json
from langchain_ollama import OllamaLLM
from sqlalchemy import text
from db import engine  # Replace with your actual filename
from prompt.order_details import get_order_details_prompt

model = OllamaLLM(model="gemma3:latest")
backend_url = "http://localhost:5000/api/orders"

# Function to fetch default address from SQL database
def get_default_address(user_id):
    try:
        with engine.connect() as connection:
            query = text("""
                SELECT address_id 
                FROM addresses
                WHERE user_id = :user_id AND is_default = TRUE
                LIMIT 1
            """)
            result = connection.execute(query, {"user_id": user_id}).fetchone()
            if result:
                return int(result[0])  # Return as integer
            else:
                return None
    except Exception as e:
        print(f"❌ DB Error (fetch default address): {e}")
        return None

# Main order placement handler
def handle_order_placement(user_message, token, user_id):
    try:
        print(f"🔍 ==> Starting order placement for user: {user_id}")
        print(f"🔍 Token: {token[:20]}..." if token else "🔍 No token provided")
        
        # Step 1: Get details from LLM
        prompt = get_order_details_prompt(user_message)
        print(f"🔍 Sending prompt to LLM...")
        
        response = model.invoke(prompt).strip()
        print(f"🔍 Raw LLM Response: '{response}'")
        
        response = response.replace("```json", "").replace("```", "").strip()
        print(f"🔍 Cleaned Response: '{response}'")
        
        try:
            data = json.loads(response)
            print(f"🔍 Parsed JSON: {data}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            return {
                "action": "order_failed",
                "message": "Failed to parse order details from AI response."
            }

        address_id = data.get("addressId")
        payment_method = data.get("paymentMethod", "upi")
        
        print(f"🔍 Extracted - Address ID: {address_id}, Payment Method: {payment_method}")

        # Step 2: If no address ID, fetch from DB
        if not address_id or str(address_id).lower() in ["null", "none", ""]:
            print("🔍 No address ID provided, fetching default...")
            address_id = get_default_address(user_id)
            if not address_id:
                print("❌ No default address found")
                return {
                    "action": "order_failed",
                    "message": "Default address not found. Please set your address first."
                }

        # Ensure address_id is integer
        try:
            address_id = int(address_id)
        except (ValueError, TypeError):
            print(f"❌ Invalid address ID: {address_id}")
            return {
                "action": "order_failed",
                "message": "Invalid address ID format."
            }

        print(f"✅ Final Address ID: {address_id}, Payment Method: {payment_method}")

        # Step 3: Send request to Node backend
        payload = {"addressId": address_id, "paymentMethod": payment_method}
        print(f"🔍 Sending payload to {backend_url}: {payload}")
        print(f"🔍 Cookie token: {token}")
        
        try:
            res = requests.post(
                backend_url,
                json=payload,
                cookies={"token": token},
                timeout=15,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"🔍 Response Status: {res.status_code}")
            print(f"🔍 Response Headers: {dict(res.headers)}")
            print(f"🔍 Response Text: {res.text}")
            
        except requests.exceptions.ConnectionError as e:
            print(f"❌ Connection Error: Cannot connect to {backend_url}")
            print(f"❌ Error details: {e}")
            return {
                "action": "order_failed",
                "message": "Cannot connect to order service. Please check if the server is running."
            }
        except requests.exceptions.Timeout as e:
            print(f"❌ Timeout Error: {e}")
            return {
                "action": "order_failed",
                "message": "Order service is taking too long to respond."
            }
        except requests.exceptions.RequestException as e:
            print(f"❌ Request Error: {e}")
            return {
                "action": "order_failed",
                "message": f"Failed to communicate with order service: {str(e)}"
            }

        if res.status_code == 201:
            try:
                order_data = res.json()
                print(f"✅ Order placed successfully: {order_data}")
                return {
                    "action": "order_placed",
                    "orderId": order_data.get("orderId"),
                    "message": "Your order has been placed successfully!"
                }
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response: {res.text}")
                return {
                    "action": "order_failed",
                    "message": "Invalid response from order service."
                }
        else:
            print(f"❌ Order failed with status {res.status_code}")
            try:
                error_data = res.json()
                error_message = error_data.get("message", "Unknown error")
            except:
                error_message = res.text
            
            return {
                "action": "order_failed",
                "message": f"Order failed: {error_message}"
            }

    except Exception as e:
        print(f"❌ Unexpected Order Placement Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "action": "order_failed",
            "message": "An unexpected error occurred while placing your order."
        }