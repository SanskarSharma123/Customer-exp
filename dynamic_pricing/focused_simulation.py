#!/usr/bin/env python3
"""
Focused Data Simulation for Dynamic Pricing
Generates data for 2 specific categories: Fruits & Vegetables, Dairy & Eggs
"""

import psycopg2
import random
import datetime
import json
from typing import List, Dict, Tuple
import numpy as np
from faker import Faker

class FocusedDataSimulator:
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.fake = Faker()
        self.conn = None
        self.cursor = None
        
        # Target categories - exact names from database
        self.target_categories = [
            'Fruits & Vegetables',
            'Dairy & Eggs'
        ]
        
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor()
            print("✅ Connected to database successfully")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✅ Database connection closed")
    
    def get_target_products(self) -> List[Tuple]:
        """Get products from target categories"""
        print("🔍 Finding products in target categories...")
        
        # Get category IDs for target categories
        category_ids = []
        for category_name in self.target_categories:
            self.cursor.execute("""
                SELECT category_id, name 
                FROM categories 
                WHERE name = %s
            """, (category_name,))
            
            result = self.cursor.fetchone()
            if result:
                category_ids.append(result[0])
                print(f"✅ Found category: {result[1]} (ID: {result[0]})")
            else:
                print(f"⚠️  Category not found: {category_name}")
        
        if not category_ids:
            print("❌ No target categories found!")
            return []
        
        # Get products from target categories
        self.cursor.execute("""
            SELECT p.product_id, p.name, p.price, p.stock_quantity, p.category_id, c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            WHERE p.category_id = ANY(%s)
            ORDER BY p.category_id, p.name
        """, (category_ids,))
        
        products = self.cursor.fetchall()
        print(f"✅ Found {len(products)} products in target categories")
        
        # Show product distribution
        category_counts = {}
        for product_id, name, price, stock, category_id, category_name in products:
            if category_name not in category_counts:
                category_counts[category_name] = 0
            category_counts[category_name] += 1
        
        print("📊 Product distribution:")
        for category, count in category_counts.items():
            print(f"   - {category}: {count} products")
        
        return products
    
    def generate_users(self, num_users: int = 70):
        """Generate additional users for training"""
        print(f"👥 Generating {num_users} additional users...")
        
        # Get existing users to avoid duplicates
        self.cursor.execute("SELECT email FROM users")
        existing_emails = {row[0] for row in self.cursor.fetchall()}
        
        users_created = 0
        for i in range(num_users):
            try:
                # Generate unique email
                while True:
                    email = self.fake.email()
                    if email not in existing_emails:
                        existing_emails.add(email)
                        break
                
                # Generate user data with shorter phone number
                name = self.fake.name()
                phone = self.fake.phone_number()[:15]  # Limit to 15 characters
                password = "hashed_password_123"  # In real app, this would be properly hashed
                
                self.cursor.execute("""
                    INSERT INTO users (name, email, password, phone, is_admin)
                    VALUES (%s, %s, %s, %s, FALSE)
                    RETURNING user_id
                """, (name, email, password, phone))
                
                user_id = self.cursor.fetchone()[0]
                
                # Generate address for this user
                self.generate_user_address(user_id)
                users_created += 1
                
                # Commit every 10 users to avoid long transactions
                if users_created % 10 == 0:
                    self.conn.commit()
                    print(f"   ✅ Created {users_created} users so far...")
                
            except Exception as e:
                print(f"⚠️  Error creating user {i+1}: {e}")
                self.conn.rollback()  # Rollback on error
                continue
        
        self.conn.commit()
        print(f"✅ Created {users_created} new users with addresses")
        return users_created
    
    def generate_user_address(self, user_id: int):
        """Generate address for a user"""
        # Bangalore addresses for realistic delivery
        bangalore_areas = [
            ("Koramangala", 12.9349, 77.6050),
            ("Indiranagar", 12.9789, 77.6408),
            ("Whitefield", 12.9692, 77.7499),
            ("Electronic City", 12.8458, 77.6655),
            ("Marathahalli", 12.9500, 77.7000),
            ("HSR Layout", 12.9141, 77.6413),
            ("JP Nagar", 12.9067, 77.5851),
            ("Bannerghatta Road", 12.8876, 77.6090)
        ]
        
        area, lat, lng = random.choice(bangalore_areas)
        address_line1 = f"{random.randint(1, 999)} {self.fake.street_name()}"
        address_line2 = f"{area}, Bangalore"
        city = "Bangalore"
        state = "Karnataka"
        postal_code = f"560{random.randint(10, 99)}"
        
        # Add some random offset to coordinates
        lat_offset = random.uniform(-0.01, 0.01)
        lng_offset = random.uniform(-0.01, 0.01)
        
        self.cursor.execute("""
            INSERT INTO addresses (user_id, address_line1, address_line2, city, state, 
                                 postal_code, latitude, longitude, is_default)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        """, (user_id, address_line1, address_line2, city, state, 
              postal_code, lat + lat_offset, lng + lng_offset))
    
    def generate_category_orders(self, days_back: int = 60, orders_per_day: int = 30):
        """Generate orders specifically for target category products"""
        print(f"🔄 Generating {days_back * orders_per_day} category-specific orders...")
        
        target_products = self.get_target_products()
        if not target_products:
            print("❌ No products found in target categories")
            return
        
        # Get all users (existing + new)
        self.cursor.execute("SELECT user_id FROM users WHERE is_admin = FALSE")
        all_users = self.cursor.fetchall()
        
        # Get all addresses
        self.cursor.execute("SELECT address_id, user_id FROM addresses")
        all_addresses = self.cursor.fetchall()
        
        print(f"📊 Using {len(all_users)} users and {len(all_addresses)} addresses")
        
        # Generate orders for each day
        for day in range(days_back):
            current_date = datetime.datetime.now() - datetime.timedelta(days=day)
            
            # Generate orders for this day
            daily_orders = random.randint(orders_per_day - 5, orders_per_day + 5)
            
            for _ in range(daily_orders):
                try:
                    # Select random user and address
                    user_id = random.choice(all_users)[0]
                    user_addresses = [addr for addr in all_addresses if addr[1] == user_id]
                    
                    if not user_addresses:
                        continue
                        
                    address_id = random.choice(user_addresses)[0]
                    
                    # Generate order time (random time during the day)
                    order_time = current_date.replace(
                        hour=random.randint(8, 22),
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59)
                    )
                    
                    # Generate order items from target categories only
                    order_items = self._generate_category_order_items(target_products)
                    if not order_items:
                        continue
                    
                    # Calculate total amount (ensure float conversion)
                    total_amount = sum(float(item['price']) * item['quantity'] for item in order_items)
                    delivery_fee = random.choice([0.0, 5.0, 10.0, 15.0])
                    
                    # Insert order
                    order_id = self._insert_order(
                        user_id, address_id, total_amount, delivery_fee, order_time
                    )
                    
                    # Insert order items
                    for item in order_items:
                        self._insert_order_item(order_id, item)
                    
                    # Update product stock
                    self._update_product_stock(item['product_id'], item['quantity'])
                    
                except Exception as e:
                    print(f"⚠️  Error creating order: {e}")
                    self.conn.rollback()
                    continue
            
            # Commit every day to avoid long transactions
            if day % 10 == 0:
                self.conn.commit()
                print(f"   ✅ Generated orders for {day + 1} days...")
        
        self.conn.commit()
        print(f"✅ Generated {days_back * orders_per_day} category-specific orders")
    
    def _generate_category_order_items(self, products: List[Tuple]) -> List[Dict]:
        """Generate order items from target category products only"""
        items = []
        num_items = random.randint(1, 3)  # 1-3 items per order (focused categories)
        
        selected_products = random.sample(products, min(num_items, len(products)))
        
        for product_id, name, price, stock, category_id, category_name in selected_products:
            # Convert Decimal to float for calculations
            price_float = float(price) if hasattr(price, '__float__') else price
            
            # Category-specific quantity logic
            if 'Fruits & Vegetables' in category_name:
                quantity = random.randint(1, 5)  # 1-5 kg/pieces
            elif 'Dairy & Eggs' in category_name:
                quantity = random.randint(1, 3)  # 1-3 packs/cartons
            else:
                quantity = random.randint(1, 3)
            
            # Apply category-specific price variations
            if 'Fruits & Vegetables' in category_name:
                price_variation = random.uniform(0.85, 1.15)  # ±15% (more volatile)
            elif 'Dairy & Eggs' in category_name:
                price_variation = random.uniform(0.9, 1.1)   # ±10% (moderate)
            else:
                price_variation = random.uniform(0.9, 1.1)
            
            adjusted_price = round(price_float * price_variation, 2)
            
            items.append({
                'product_id': product_id,
                'quantity': quantity,
                'price': adjusted_price,
                'category_name': category_name
            })
        
        return items
    
    def _insert_order(self, user_id: int, address_id: int, total_amount: float, 
                     delivery_fee: float, order_time: datetime.datetime) -> int:
        """Insert order and return order_id"""
        status = random.choices(
            ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
            weights=[0.05, 0.1, 0.15, 0.2, 0.45, 0.05]
        )[0]
        
        payment_method = random.choice(['card', 'upi', 'cash_on_delivery'])
        payment_status = 'completed' if status != 'cancelled' else 'failed'
        
        estimated_delivery = order_time + datetime.timedelta(hours=random.randint(2, 6))
        actual_delivery = None
        if status == 'delivered':
            actual_delivery = estimated_delivery + datetime.timedelta(minutes=random.randint(-30, 60))
        
        self.cursor.execute("""
            INSERT INTO orders (user_id, address_id, total_amount, delivery_fee, status, 
                              payment_method, payment_status, created_at, estimated_delivery_time, actual_delivery_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING order_id
        """, (user_id, address_id, total_amount, delivery_fee, status, payment_method, 
              payment_status, order_time, estimated_delivery, actual_delivery))
        
        return self.cursor.fetchone()[0]
    
    def _insert_order_item(self, order_id: int, item: Dict):
        """Insert order item"""
        self.cursor.execute("""
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (%s, %s, %s, %s)
        """, (order_id, item['product_id'], item['quantity'], item['price']))
    
    def _update_product_stock(self, product_id: int, quantity: int):
        """Update product stock quantity"""
        self.cursor.execute("""
            UPDATE products 
            SET stock_quantity = GREATEST(0, stock_quantity - %s)
            WHERE product_id = %s
        """, (quantity, product_id))
    
    def generate_category_reviews(self, reviews_per_product: int = 20):
        """Generate reviews for target category products"""
        print(f"🔄 Generating reviews for target categories...")
        
        target_products = self.get_target_products()
        
        for product_id, name, price, stock, category_id, category_name in target_products:
            # Get users who ordered this product
            self.cursor.execute("""
                SELECT DISTINCT o.user_id 
                FROM orders o 
                JOIN order_items oi ON o.order_id = oi.order_id 
                WHERE oi.product_id = %s AND o.status = 'delivered'
            """, (product_id,))
            
            users_who_ordered = self.cursor.fetchall()
            
            if not users_who_ordered:
                continue
            
            # Generate reviews
            num_reviews = min(reviews_per_product, len(users_who_ordered))
            selected_users = random.sample(users_who_ordered, num_reviews)
            
            for user_id, in selected_users:
                # Category-specific rating patterns
                if 'Fruits & Vegetables' in category_name:
                    rating = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.1, 0.2, 0.35, 0.3])[0]
                elif 'Dairy & Eggs' in category_name:
                    rating = random.choices([1, 2, 3, 4, 5], weights=[0.03, 0.07, 0.15, 0.4, 0.35])[0]
                else:
                    rating = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.1, 0.15, 0.3, 0.4])[0]
                
                # Generate category-specific comments
                comment = self._generate_category_comment(name, category_name, rating)
                
                # Random review date (within last 30 days)
                review_date = datetime.datetime.now() - datetime.timedelta(
                    days=random.randint(1, 30)
                )
                
                self.cursor.execute("""
                    INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (product_id, user_id, rating, comment, review_date))
        
        self.conn.commit()
        print("✅ Generated category-specific reviews")
    
    def _generate_category_comment(self, product_name: str, category_name: str, rating: int) -> str:
        """Generate category-specific review comments"""
        if 'Fruits & Vegetables' in category_name:
            if rating >= 4:
                return random.choice([
                    f"Fresh and delicious {product_name.lower()}! Great quality.",
                    f"Perfect ripeness, very tasty {product_name.lower()}.",
                    f"Excellent organic {product_name.lower()}, highly recommend.",
                    f"Fresh from farm, amazing taste!"
                ])
            elif rating == 3:
                return random.choice([
                    f"Good {product_name.lower()}, but could be fresher.",
                    f"Decent quality, acceptable taste.",
                    f"Average freshness, okay for the price."
                ])
            else:
                return random.choice([
                    f"Not fresh, disappointing quality.",
                    f"Overripe and not worth the price.",
                    f"Poor freshness, would not recommend."
                ])
        
        elif 'Dairy & Eggs' in category_name:
            if rating >= 4:
                return random.choice([
                    f"Fresh {product_name.lower()}, great taste!",
                    f"High quality dairy product, very satisfied.",
                    f"Perfect freshness, excellent packaging.",
                    f"Best {product_name.lower()} I've had!"
                ])
            elif rating == 3:
                return random.choice([
                    f"Good {product_name.lower()}, standard quality.",
                    f"Decent dairy product, meets expectations.",
                    f"Average taste, acceptable quality."
                ])
            else:
                return random.choice([
                    f"Not fresh, poor quality.",
                    f"Expired or near expiry, very disappointed.",
                    f"Low quality dairy, avoid this."
                ])
        
        else:
            return f"Rating {rating}/5 for {product_name}"
    
    def verify_category_data(self):
        """Verify the generated data for target categories"""
        print("🔍 Verifying category-specific data...")
        
        # Get target category IDs
        category_ids = []
        for category_name in self.target_categories:
            self.cursor.execute("""
                SELECT category_id FROM categories 
                WHERE name = %s
            """, (category_name,))
            result = self.cursor.fetchone()
            if result:
                category_ids.append(result[0])
        
        if not category_ids:
            print("❌ No target categories found")
            return {
                'category_orders': 0,
                'category_items': 0,
                'category_reviews': 0,
                'products_with_orders': 0
            }
        
        # Check orders for target categories
        self.cursor.execute("""
            SELECT COUNT(DISTINCT o.order_id) 
            FROM orders o 
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE p.category_id = ANY(%s)
        """, (category_ids,))
        category_orders = self.cursor.fetchone()[0]
        
        # Check order items for target categories
        self.cursor.execute("""
            SELECT COUNT(*) 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE p.category_id = ANY(%s)
        """, (category_ids,))
        category_items = self.cursor.fetchone()[0]
        
        # Check reviews for target categories
        self.cursor.execute("""
            SELECT COUNT(*) 
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            WHERE p.category_id = ANY(%s)
        """, (category_ids,))
        category_reviews = self.cursor.fetchone()[0]
        
        # Check products with orders
        self.cursor.execute("""
            SELECT COUNT(DISTINCT p.product_id) 
            FROM products p 
            JOIN order_items oi ON p.product_id = oi.product_id
            WHERE p.category_id = ANY(%s)
        """, (category_ids,))
        products_with_orders = self.cursor.fetchone()[0]
        
        # Category breakdown
        print("\n📊 Category-Specific Data Summary:")
        for category_id in category_ids:
            self.cursor.execute("""
                SELECT c.name, COUNT(DISTINCT p.product_id) as product_count,
                       COUNT(DISTINCT o.order_id) as order_count,
                       COUNT(r.review_id) as review_count
                FROM categories c
                LEFT JOIN products p ON c.category_id = p.category_id
                LEFT JOIN order_items oi ON p.product_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.order_id
                LEFT JOIN reviews r ON p.product_id = r.product_id
                WHERE c.category_id = %s
                GROUP BY c.category_id, c.name
            """, (category_id,))
            
            result = self.cursor.fetchone()
            if result:
                category_name, product_count, order_count, review_count = result
                print(f"   - {category_name}:")
                print(f"     • Products: {product_count}")
                print(f"     • Orders: {order_count}")
                print(f"     • Reviews: {review_count}")
        
        print(f"\n📈 Overall Summary:")
        print(f"   - Total Category Orders: {category_orders}")
        print(f"   - Total Category Items: {category_items}")
        print(f"   - Total Category Reviews: {category_reviews}")
        print(f"   - Products with Orders: {products_with_orders}")
        
        return {
            'category_orders': category_orders,
            'category_items': category_items,
            'category_reviews': category_reviews,
            'products_with_orders': products_with_orders
        }

def main():
    """Main function to run focused data simulation"""
    
    # Database configuration
    db_config = {
        'host': 'localhost',
        'database': 'commerce_database',
        'user': 'vidya',
        'password': 'commerceproject'
    }
    
    # Create simulator
    simulator = FocusedDataSimulator(db_config)
    
    try:
        # Connect to database
        simulator.connect()
        
        print("🎯 Focused Data Simulation for Dynamic Pricing")
        print("=" * 60)
        print("Target Categories:")
        for category in simulator.target_categories:
            print(f"   - {category}")
        print()
        
        # Generate users
        simulator.generate_users(num_users=70)
        
        # Generate category-specific orders
        simulator.generate_category_orders(days_back=60, orders_per_day=30)
        
        # Generate reviews
        simulator.generate_category_reviews(reviews_per_product=20)
        
        # Verify the data
        stats = simulator.verify_category_data()
        
        print("\n🎉 Focused simulation completed successfully!")
        print(f"✅ Generated {stats['category_orders']} category-specific orders")
        print(f"✅ Generated {stats['category_reviews']} category-specific reviews")
        print(f"✅ {stats['products_with_orders']} products have order history")
        
        print("\n🚀 Ready for PPO model training!")
        print("💡 Next step: Run the PPO training script")
        
    except Exception as e:
        print(f"❌ Error during focused simulation: {e}")
        raise
    finally:
        simulator.disconnect()

if __name__ == "__main__":
    main() 