from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from intent_service import classify_intent
from prompt.get_category import get_category_prompt
from prompt.get_category_min_max import get_category_min_max
from prompt.get_product_id_prompt import get_productid_quantity
from langchain_ollama import OllamaLLM
import requests
import json
import asyncio
import logging

model = OllamaLLM(model="gemma3:latest")

# Import intent handlers
from handlers.category_min_max_browsing import handle_category_min_max_browsing
from handlers.category_browsing import handle_category_browsing
from handlers.product_search import handle_product_search
from handlers.product_details import handle_product_details
from handlers.price_filter import handle_price_filter
from handlers.offers_discounts import handle_offers_discounts
from handlers.cart_management import handle_cart_management
from handlers.order_tracking import handle_order_tracking
from handlers.return_refund import handle_return_refund
from handlers.payment_queries import handle_payment_queries
from handlers.account_management import handle_account_management
from handlers.login_signup import handle_login_signup
from handlers.customer_support import handle_customer_support
from handlers.store_location import handle_store_location
from handlers.order_cancellation import handle_order_cancellation
from handlers.wishlist_management import handle_wishlist_management
from handlers.product_recommendation import handle_product_recommendation
from handlers.review_ratings import handle_review_ratings
from handlers.faqs import handle_faqs
from handlers.greet import handle_greet
from handlers.goodbye import handle_goodbye


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

categories = [
                    'Fruits & Vegetables', 'Dairy & Eggs', 'Bakery', 'Snacks & Beverages', 'Household',
                    'Meat & Seafood', 'Frozen Foods', 'Personal Care', 'Baby Products', 'Pet Supplies',
                    'Breakfast & Cereal', 'Condiments & Sauces', 'Canned & Packaged Foods', 'Health Foods & Supplements',
                    'Home & Kitchen', 'Electronics', 'Computer Accessories', 'Smart Devices', 'Gaming',
                    'Home Appliances', 'Clothing & Fashion', 'TV & Entertainment', 'Books & Media',
                    'Sports & Fitness', 'Beauty & Personal Care', 'Automotive'
                ]
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Only allow your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    message: str
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.user_connections: dict[str, WebSocket] = {}  # Map user tokens to websockets

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from user connections if it exists
        user_token_to_remove = None
        for token, ws in self.user_connections.items():
            if ws == websocket:
                user_token_to_remove = token
                break
        
        if user_token_to_remove:
            del self.user_connections[user_token_to_remove]
            logger.info(f"Removed authenticated user: {user_token_to_remove[:20]}...")
        
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, user_token: str):
        """Send message to a specific user"""
        logger.info(f"Attempting to send message to user: {user_token[:20]}...")
        logger.info(f"Available authenticated connections: {len(self.user_connections)}")
        
        if user_token in self.user_connections:
            try:
                websocket = self.user_connections[user_token]
                await websocket.send_json(message)
                logger.info(f"✅ Message sent successfully to user: {user_token[:20]}...")
                return True
            except Exception as e:
                logger.error(f"❌ Failed to send message to user {user_token[:20]}...: {e}")
                # Remove the broken connection
                del self.user_connections[user_token]
                return False
        else:
            logger.warning(f"❌ User {user_token[:20]}... not found in authenticated connections")
            logger.info(f"Available tokens: {[token[:20] + '...' for token in self.user_connections.keys()]}")
            return False

    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        logger.info(f"Broadcasting message to {len(self.active_connections)} connections")
        disconnected = []
        successful_sends = 0
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
                successful_sends += 1
            except Exception as e:
                logger.error(f"Failed to send broadcast message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.active_connections.remove(connection)
        
        logger.info(f"Broadcast completed: {successful_sends} successful, {len(disconnected)} failed")

manager = ConnectionManager()
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info("New WebSocket connection established")
    
    try:
        while True:
            # Listen for messages from the client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message_type = message.get("type")
                logger.info(f"Received WebSocket message: {message_type}")
                
                if message_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_json({"type": "pong"})
                elif message_type == "auth":
                    # Handle authentication
                    user_token = message.get("token")
                    if user_token:
                        # Store the authenticated connection
                        manager.user_connections[user_token] = websocket
                        await websocket.send_json({"type": "auth_success", "message": "Authentication successful"})
                        logger.info(f"✅ User authenticated via WebSocket: {user_token[:20]}...")
                        logger.info(f"Total authenticated connections: {len(manager.user_connections)}")
                    else:
                        await websocket.send_json({"type": "auth_failed", "message": "Token missing"})
                        logger.warning("❌ WebSocket authentication failed - no token provided")
                else:
                    logger.info(f"Received unknown message type: {message_type}")
                    
            except json.JSONDecodeError:
                logger.error("Invalid JSON received from client")
                await websocket.send_json({"type": "error", "message": "Invalid JSON format"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def notify_place_order(user_token: str = None):
    """Notify specific user or all users about order placement"""
    message = {
        "action": "place_order",
        "payment": "cod",
        "message": "Please proceed to place your order",
        "timestamp": asyncio.get_event_loop().time()
    }
    
    if user_token:
        logger.info(f"🚀 Sending place order notification to specific user: {user_token[:20]}...")
        logger.info(f"Available authenticated connections: {len(manager.user_connections)}")
        logger.info(f"Available tokens: {[token[:20] + '...' for token in manager.user_connections.keys()]}")
        
        success = await manager.send_personal_message(message, user_token)
        if success:
            logger.info(f"✅ Order notification sent successfully to user: {user_token[:20]}...")
            return True
        else:
            logger.warning(f"❌ Failed to send order notification to user: {user_token[:20]}...")
            logger.info("🔄 Attempting broadcast as fallback...")
            await manager.broadcast(message)
            logger.info("📢 Order notification broadcasted as fallback")
            return False
    else:
        logger.info("📢 Broadcasting order notification to all users...")
        await manager.broadcast(message)
        logger.info("📢 Order notification broadcasted to all users")
        return True
    
@app.post("/api/intent")
async def detect_intent(query: Query, request: Request):
    token = request.cookies.get("token")

    if not token:
        return {"error": "Authentication token missing"}
    intent = classify_intent(query.message)

    if intent == "category_listing":
                category_string = ", ".join(categories)
                response_text = f"Here are the available categories: \n\n{category_string}\n\nCan you please tell me more specifically which category you're interested in?"
                return {
                    "categories": categories,
                    "response": response_text,
                    "action": "category_listing"
                }
    
    elif intent == "switch_mode":
        return {
            "action": "switch_mode",
            "response": "Switching the website theme for you."
        }

    elif intent == "category_browsing":
        try:
            prompt = get_category_prompt(query.message)
            category_name = model.invoke(prompt).strip()

            if not category_name or category_name.strip().title() not in categories:
                return {"response": "Unable to extract category from your message. Please try again or ask to list available categories."}
            
            result = handle_category_browsing(category_name)

            if isinstance(result, dict) and "error" in result:
                return result

            return {"action": "open_tab", "url": result}

        except Exception as e:
            return {"error": str(e)}

    elif intent == "category_min_max_browsing":
        try:
            prompt = get_category_min_max(query.message)
            result = model.invoke(prompt).strip()
            result = result.replace("```json", "").replace("```", "").strip()

            extracted = json.loads(result)
            category_name = extracted.get("category")
            min_price = extracted.get("min_price")
            max_price = extracted.get("max_price")

            if not category_name or category_name.strip().title() not in categories:
                return {"response": "Unable to extract category from your message. Please try again or ask to list available categories."}

            min_price = None if min_price in [None, "None", "null"] else min_price
            max_price = None if max_price in [None, "None", "null"] else max_price

            # Apply defaults
            min_price = min_price if min_price is not None else 0
            max_price = max_price if max_price is not None else 100000

            products = handle_category_min_max_browsing(category_name, min_price, max_price)

            if isinstance(products, dict) and "error" in products:
                return products

            return {"action": "show_products", "products": products}

        except Exception as e:
            return {"error": str(e)}

    elif intent == "cart_management":
        try:
            prompt = get_productid_quantity(query.message)
            result = model.invoke(prompt).strip()
            result = result.replace("```json", "").replace("```", "").strip()

            data = json.loads(result)

            product_id = data.get("product_id")
            quantity = data.get("quantity")  # Default to 1 if not provided
            action = data.get("action")


            if not product_id:
                return {"response": "Please specify the product ID to add to cart."}
            
            if action == "positive":

                if quantity is None:
                    quantity = 1  
                cart_res = requests.post(
                    "http://localhost:5000/api/cart/items",
                    json={"productId": product_id, "quantity": quantity},
                    cookies={"token": token}  
                )




                if cart_res.status_code == 201:
                    return {"action": "add_to_cart_success"}
                else:
                    return {"action": "add_to_cart_failed"}

            elif action == "negative":
                # Fetch cart to get item_id and current quantity
                cart_res = requests.get(
                    "http://localhost:5000/api/cart",
                    cookies={"token": token}
                )

                if cart_res.status_code != 200:
                    return {"action": "cart_update_failed"}

                cart_data = cart_res.json()
                item_id = None
                current_quantity = None

                for item in cart_data.get("items", []):
                    if item.get("product_id") == product_id:
                        item_id = item.get("cart_item_id")
                        current_quantity = item.get("quantity")
                        break

                if not item_id:
                    return {"response": "Item not found in cart."}

                # Remove Item Completely if quantity missing
                if quantity is None:
                    del_res = requests.delete(
                        f"http://localhost:5000/api/cart/items/{item_id}",
                        cookies={"token": token}
                    )
                    if del_res.status_code == 200:
                        return {"action": "cart_item_removed"}
                    else:
                        return {"action": "cart_remove_failed"}

                # Decrease Quantity (put request)
                else:
                    if current_quantity is None:
                        return {"response": "Unable to fetch current quantity."}

                    new_quantity = current_quantity - quantity

                    if new_quantity <= 0:
                        # Remove item if new quantity is 0 or less
                        del_res = requests.delete(
                            f"http://localhost:5000/api/cart/items/{item_id}",
                            cookies={"token": token}
                        )
                        if del_res.status_code == 200:
                            return {"action": "cart_item_removed"}
                        else:
                            return {"action": "cart_remove_failed"}

                    else:
                        # Update with decreased quantity
                        update_res = requests.put(
                            f"http://localhost:5000/api/cart/items/{item_id}",
                            json={"quantity": new_quantity},
                            cookies={"token": token}
                        )
                        if update_res.status_code == 200:
                            return {"action": "cart_item_updated"}
                        else:
                            return {"action": "cart_update_failed"}


        except Exception as e:
            return {"error": str(e)}
    

    elif intent == "specific_product_details":
            prompt = get_productid_quantity(query.message)
            result = model.invoke(prompt).strip()
            result = result.replace("```json", "").replace("```", "").strip()

            data = json.loads(result)

            product_id = data.get("product_id")
            if not product_id:
                return {"action": "product_details_failed", "message": "Product ID not found"}

            try:
                response = requests.get(
                    f"http://localhost:5000/api/products/{product_id}"
                )

                if response.status_code == 200:
                    product_data = response.json()
                    return {
                        "action": "open_product_page",
                        "product": product_data
                    }
                elif response.status_code == 404:
                    return {"action": "product_not_found", "message": "Product not found"}
                else:
                    return {"action": "product_details_failed", "message": "Error fetching product"}

            except Exception as e:
                print("Product details fetch error:", e)
                return {"action": "product_details_failed", "message": "Server error"}
            
    elif intent == "cart_navigate":
        return {"action": "cart_navigate", "response": "Navigating to your cart..."}


    elif intent == "place_order":
        try:
            # logger.info(f"Processing place_order intent for token: {token[:20]}...")
            
            # Send WebSocket notification
            notification_success = await notify_place_order(token)
            
            # Always return success response, even if WebSocket fails
            return {
                "action": "order_initiated",
                "payment": "cod",
                "response": "Order process initiated.",
                "message": "Your order placement has been triggered. Please complete the process in your cart.",
                "websocket_success": notification_success
            }
                
        except Exception as e:
            logger.error(f"Error in place_order intent: {e}")
            return {
                "action": "order_initiated",
                "response": "Order process initiated. .",
                "message": "Please complete the order process in your cart.",
                "error": str(e)
            }
 
    elif intent == "price_filter":
        result = handle_price_filter(query.message)
    elif intent == "offers_discounts":
        result = handle_offers_discounts(query.message)
    elif intent == "order_placement":
        result = handle_order_placement(query.message)
    elif intent == "order_tracking":
        result = handle_order_tracking(query.message)
    elif intent == "return_refund":
        result = handle_return_refund(query.message)
    elif intent == "payment_queries":
        result = handle_payment_queries(query.message)
    elif intent == "account_management":
        result = handle_account_management(query.message)
    elif intent == "login_signup":
        result = handle_login_signup(query.message)
    elif intent == "customer_support":
        result = handle_customer_support(query.message)
    elif intent == "store_location":
        result = handle_store_location(query.message)
    elif intent == "order_cancellation":
        result = handle_order_cancellation(query.message)
    elif intent == "wishlist_management":
        result = handle_wishlist_management(query.message)
    elif intent == "product_recommendation":
        result = handle_product_recommendation(query.message)
    elif intent == "review_ratings":
        result = handle_review_ratings(query.message)
    elif intent == "faqs":
        result = handle_faqs(query.message)
    elif intent == "greet":
        result = handle_greet()
    elif intent == "goodbye":
        result = handle_goodbye()
    else:
        result = {"intent": intent, "message": "No action handler for this intent."}

    return result
