def get_order_details_prompt(user_message):
    return f"""
You are an assistant extracting order details from user input.

Message:
\"\"\"{user_message}\"\"\"

Extract:
- addressId (set to "1" if missing)
- paymentMethod (set to "upi" if missing)

Respond strictly as:
{{
    "addressId": "123",
    "paymentMethod": "upi"
}}
"""
