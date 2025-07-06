def get_order_id_prompt(user_query):
    return f"""
You are an extraction expert for an eCommerce chatbot.

From the user's message, extract:

- "order_id" → The order the user is referring to for tracking or details

⚠️ VERY IMPORTANT:
- If order_id is not mentioned, set to null.
- Reply strictly with **ONLY JSON**, no extra text, no explanation.
- order_id should be stored as int

Example:

{{
  "order_id": 66 
}}

OR

{{
  "order_id": null
}}

User message:
\"{user_query}\"
"""