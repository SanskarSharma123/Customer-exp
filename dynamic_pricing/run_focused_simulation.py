#!/usr/bin/env python3
"""
Focused Data Simulation Runner
Generates data for 2 specific categories: Fruits & Vegetables, Dairy & Eggs
"""

import json
import sys
from focused_simulation import FocusedDataSimulator

def load_config():
    """Load database configuration"""
    try:
        with open('db_config.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ db_config.json not found. Please create it with your database credentials.")
        return None
    except json.JSONDecodeError:
        print("❌ Invalid JSON in db_config.json")
        return None

def main():
    """Main function"""
    print("🎯 Focused Dynamic Pricing Data Simulation")
    print("=" * 60)
    print("Target Categories:")
    print("   - Fruits & Vegetables")
    print("   - Dairy & Eggs")
    print()
    
    # Load configuration
    db_config = load_config()
    if not db_config:
        sys.exit(1)
    
    # Update password if needed
    if db_config['password'] == 'your_password':
        print("⚠️  Please update the password in db_config.json")
        password = input("Enter your PostgreSQL password: ")
        db_config['password'] = password
    
    # Create simulator
    simulator = FocusedDataSimulator(db_config)
    
    try:
        print("🔌 Connecting to database...")
        simulator.connect()
        
        print("\n📊 Generating focused training data...")
        print("This will create:")
        print("  - 70 additional users (total: 75 users)")
        print("  - 60 days of historical orders")
        print("  - ~30 orders per day (focused on 2 categories)")
        print("  - Category-specific product reviews")
        print("  - Realistic pricing patterns for each category")
        
        # Generate users
        print("\n👥 Step 1: Generating users...")
        users_created = simulator.generate_users(num_users=70)
        print(f"✅ Created {users_created} new users")
        
        # Generate orders
        print("\n🛒 Step 2: Generating orders...")
        simulator.generate_category_orders(days_back=60, orders_per_day=30)
        
        # Generate reviews
        print("\n⭐ Step 3: Generating reviews...")
        simulator.generate_category_reviews(reviews_per_product=20)
        
        # Verify data
        print("\n🔍 Step 4: Verifying data...")
        stats = simulator.verify_category_data()
        
        print("\n🎉 Focused simulation completed successfully!")
        print(f"✅ Generated {stats['category_orders']} category-specific orders")
        print(f"✅ Generated {stats['category_reviews']} category-specific reviews")
        print(f"✅ {stats['products_with_orders']} products have order history")
        
        print("\n🚀 Ready for PPO training!")
        print("Next: Run 'python train_ppo.py' to train the model")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        simulator.disconnect()

if __name__ == "__main__":
    main() 