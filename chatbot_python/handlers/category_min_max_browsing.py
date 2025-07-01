from sqlalchemy import text
from db import engine

def handle_category_min_max_browsing(category, min_price, max_price):
    try:
        query = text("""
            SELECT 
                p.product_id AS id,
                p.name,
                p.price,
                p.description,
                p.image_url,
                c.name AS category
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            WHERE c.name = :category
              AND p.price BETWEEN :min_price AND :max_price
            ORDER BY p.price ASC;
        """)

        with engine.connect() as connection:
            result = connection.execute(query, {
                "category": category,
                "min_price": min_price,
                "max_price": max_price
            })

            rows = result.fetchall()

            if not rows:
                return {"response": "No products found for this category and price range."}

            products = []
            for row in rows:
                product = {
                    "id": row.id,
                    "name": row.name,
                    "price": row.price,
                    "description": row.description,
                    "image_url": row.image_url,
                    "category": row.category
                }
                products.append(product)

            return products

    except Exception as e:
        return {"error": str(e)}
