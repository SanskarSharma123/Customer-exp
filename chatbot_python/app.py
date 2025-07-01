from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from intent_service import classify_intent
from prompt.get_category import get_category_prompt
from prompt.get_category_min_max import get_category_min_max
from prompt.get_product_id_prompt import get_productid_quantity
from langchain_ollama import OllamaLLM
import requests
import json


# Import intent handlers
from handlers.category_min_max_browsing import handle_category_min_max_browsing
from handlers.category_browsing import handle_category_browsing
from handlers.product_search import handle_product_search
from handlers.product_details import handle_product_details
from handlers.price_filter import handle_price_filter
from handlers.offers_discounts import handle_offers_discounts
from handlers.cart_management import handle_cart_management
from handlers.order_placement import handle_order_placement
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


model = OllamaLLM(model="gemma3:latest")

class Query(BaseModel):
    message: str


@app.post("/api/intent")
def detect_intent(query: Query, request: Request):
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


    elif intent == "product_details":
        result = handle_product_details(query.message)
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