def get_productid_quantity(user_query):
    return f"""
You are an extraction expert for an eCommerce chatbot.

From the user's message, extract:

- "product_id" → The product the user refers to.
- "quantity" → If mentioned, extract the quantity (always a positive number). If not mentioned, set to null.
- "action" → Detect if user wants to "positive" (add/increase) or "negative" (remove/decrease).

⚠️ VERY IMPORTANT:
- If product_id is not mentioned, set to null.
- If action is not clearly mentioned, set to "positive" by default.
- If quantity is not mentioned, set to null.
- Reply strictly with **ONLY JSON**, no extra text, no explanation.

Example:

{{
  "product_id": 106,
  "quantity": 2,
  "action": "positive"
}}

OR

{{
  "product_id": 34,
  "quantity": null,
  "action": "negative"
}}

User message:
\"{user_query}\"
"""
