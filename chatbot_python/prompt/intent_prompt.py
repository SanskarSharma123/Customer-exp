def get_intent_prompt(user_query):
    return f"""
You are an intent classifier for an eCommerce chatbot. Classify the user message into one of these intents:

- category_listing -> User is asking to list, show, or mention all available product categories on the website.
- category_browsing → "User wants to explore, navigate to, or view products under a specific category available on the website."
- product_details → "User wants to know specifications, details, features, or descriptions of a specific product listed on the website."
- cart_management → "User wants to add, remove, update, or view items in their shopping cart."
- switch_mode -> "User requests to switch the website appearance between dark mode and light mode."

Now classify this message:  
"{user_query}"  

Only reply with the intent name.
"""
