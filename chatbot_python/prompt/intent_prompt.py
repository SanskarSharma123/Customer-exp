def get_intent_prompt(user_query):
    return f"""
You are an intent classifier for an eCommerce chatbot. Classify the user message into one of these intents:

- category_listing -> User is asking to list, show, or mention all available product categories on the website.
- category_browsing → "User wants to explore, navigate to, or view, see products under a specific category available on the website. If the user wants to visually explore a category page " 
- specific_product_details → "User wants  specifications, features, or descriptions of a particular product by its  name or identifier/id."
- category_min_max_browsing -> "User is searching,list for products within a specific category, filtered by price range or other attributes. if the user wants the chatbot to list/fetch/retrive/return/provide/output products"
- cart_management → "User wants to add, remove, update, or view items in their shopping cart."
- switch_mode -> "User requests to switch the website appearance between dark mode and light mode."

Now classify this message:  
"{user_query}"  

Only reply with the intent name.
"""
