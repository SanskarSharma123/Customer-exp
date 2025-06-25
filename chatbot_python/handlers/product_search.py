from db import engine
from langchain_ollama import OllamaLLM
from prompt import entity_extraction_prompt
from sqlalchemy import text

model = OllamaLLM(model="gemma3:latest")

def handle_product_search(user_message):
    prompt = entity_extraction_prompt(user_message)
    response = model.invoke(prompt)

    try:
        entities = eval(response)  # Ensure response is valid JSON dict
    except:
        return "Sorry, couldn't understand your request."

    category = entities.get("category")
    max_price = entities.get("max_price")
    min_price = entities.get("min_price")
    keywords = entities.get("keywords")

    sql = """
        SELECT p.name, p.price, p.discount_price, p.image_url, c.name as category
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE 1=1
    """
    params = {}

    if category:
        sql += " AND LOWER(c.name) LIKE :category"
        params["category"] = f"%{category.lower()}%"

    if max_price:
        sql += " AND p.price <= :max_price"
        params["max_price"] = float(max_price)

    if min_price:
        sql += " AND p.price >= :min_price"
        params["min_price"] = float(min_price)

    if keywords:
        sql += " AND (LOWER(p.name) LIKE :keywords OR LOWER(p.description) LIKE :keywords)"
        params["keywords"] = f"%{keywords.lower()}%"

    with engine.connect() as conn:
        result = conn.execute(text(sql), params)
        products = result.fetchall()

    if not products:
        return "No products found matching your criteria."

    return [{"name": r[0], "price": r[1], "discount_price": r[2], "image_url": r[3], "category": r[4]} for r in products]
