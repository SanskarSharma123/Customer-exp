def get_entity_extraction_prompt(user_query):
    return f"""
You are an assistant that extracts filters from product search queries for an eCommerce chatbot.

Extract the following:
- category → product category mentioned
- max_price → maximum price mentioned
- min_price → minimum price mentioned (if present)
- keywords → other keywords to search

Reply strictly in JSON. If not present, set values as null.

Example:
User: Show me smartphones under 30000
Response: {{"category": "smartphones", "max_price": 30000, "min_price": null, "keywords": null}}

Now extract for:
User: {user_query}
Response:
"""
