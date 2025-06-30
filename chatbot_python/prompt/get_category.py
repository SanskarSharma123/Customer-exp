def get_category_prompt(user_query):
    return f"""
You are a category extraction expert for an eCommerce chatbot.Classify the user message into one of these category:

Here is the list of valid categories:

- Fruits & Vegetables  
- Dairy & Eggs  
- Bakery  
- Snacks & Beverages  
- Household  
- Meat & Seafood  
- Frozen Foods  
- Personal Care  
- Baby Products  
- Pet Supplies  
- Breakfast & Cereal  
- Condiments & Sauces  
- Canned & Packaged Foods  
- Health Foods & Supplements  
- Home & Kitchen  
- Electronics  
- Computer Accessories  
- Smart Devices  
- Gaming  
- Home Appliances  
- Clothing & Fashion  
- TV & Entertainment  
- Books & Media  
- Sports & Fitness  
- Beauty & Personal Care  
- Automotive  

Your task is to extract the most relevant category name from the user's message.  
Only reply with the exact category name as listed above.  
If no category is found, reply with: None  

User message:  
\"{user_query}\"
"""
