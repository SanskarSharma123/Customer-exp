def get_category_min_max(user_query):
    return f"""
You are an extraction expert for an eCommerce chatbot.

From the user's message, extract:

- Category name from this list:  
  Fruits & Vegetables, Dairy & Eggs, Bakery, Snacks & Beverages, Household, Meat & Seafood, Frozen Foods, Personal Care, Baby Products, Pet Supplies, Breakfast & Cereal, Condiments & Sauces, Canned & Packaged Foods, Health Foods & Supplements, Home & Kitchen, Electronics, Computer Accessories, Smart Devices, Gaming, Home Appliances, Clothing & Fashion, TV & Entertainment, Books & Media, Sports & Fitness, Beauty & Personal Care, Automotive  

- Minimum Price (min_price)  
- Maximum Price (max_price)  

If category or price is not mentioned, set them to null.

⚠️ VERY IMPORTANT: Reply strictly with **ONLY JSON**, no explanations, no extra text.

Example format:

{{
  "category": "Electronics",
  "min_price": 1000,
  "max_price": 5000
}}

User message:
\"{user_query}\"
"""
