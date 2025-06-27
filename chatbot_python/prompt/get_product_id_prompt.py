def get_productid_quantity(user_query):
    return f"""
You are an extraction expert for an eCommerce chatbot.

From the user's message, extract:

product_id and quantity of the product that the user wants to add to cart

If product_id is not mentioned set it to null.
If price is not mentioned, set to value 1

⚠️ VERY IMPORTANT: Reply strictly with **ONLY JSON**, no explanations, no extra text.

Example format:

{{
  "product_id": 106,
  "quantity": 2,
}}

User message:
\"{user_query}\"
"""
