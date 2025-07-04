def get_intent_prompt(user_query):
    return f"""
You are an intent classifier for an eCommerce chatbot. Classify the user message into one of these intents:


- greet → "User initiates a conversation with a greeting or salutation."
- category_listing -> User is asking to list, show, or mention all available product categories on the website.
- category_browsing → "User wants to explore, navigate to, or view, see products under a specific category available on the website. If the user wants to visually explore a category page " 
- specific_product_details → "User wants  specifications, features, or descriptions of a particular product by its  name or identifier/id."
- cart_navigate → "User wants to go to, open/see/navigate to the  cart page/section to view cart contents, view items in cart "
- category_min_max_browsing -> "User is searching,list for products within a specific category, filtered by price range or other attributes. if the user wants the chatbot to list/fetch/retrive/return/provide/output products"
- cart_management → "User wants to add, remove, update their shopping cart."
- place_order → "User expresses intent to complete a purchase, proceed to checkout, or confirm an order for one or more items in the cart. Phrases like 'place the order', 'checkout', 'buy now', or 'confirm my purchase' are relevant."
- show_my_orders → "User wants to view their order history or list of past orders."
- show_my_profile → "User wants to see their profile information."
- track_order → "User wants to track the status of an order, provided the user has send a orderID"
- track_home -> "User wants to navigate to home/dashboard section"
- switch_mode -> "User requests to switch the website appearance between dark mode and light mode."

Now classify this message:  
"{user_query}"  

Only reply with the intent name.
"""
