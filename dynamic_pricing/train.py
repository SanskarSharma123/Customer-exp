"""
Training script for Dynamic Pricing PPO models
"""

import argparse
import logging
import os
import sys
from typing import List, Optional, Dict
import pandas as pd
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import DynamicPricingDB
from ppo_agent import DynamicPricingPPO
from config import DynamicPricingConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def get_products_for_training(db: DynamicPricingDB, 
                            min_sales: int = 10,
                            categories: Optional[List[int]] = None) -> List[int]:
    """Get list of product IDs suitable for training"""
    try:
        # Get products with sufficient sales history
        query = """
        SELECT 
            p.product_id,
            p.name,
            p.category_id,
            COUNT(oi.order_item_id) as total_sales,
            AVG(oi.quantity) as avg_quantity,
            AVG(oi.price) as avg_price
        FROM products p
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status = 'delivered'
        GROUP BY p.product_id, p.name, p.category_id
        HAVING COUNT(oi.order_item_id) >= %s
        ORDER BY total_sales DESC
        """
        
        df = pd.read_sql_query(query, db.connection, params=(min_sales,))
        
        # Filter by categories if specified
        if categories:
            df = df[df['category_id'].isin(categories)]
        
        product_ids = df['product_id'].tolist()
        
        logger.info(f"Found {len(product_ids)} products suitable for training")
        return product_ids
        
    except Exception as e:
        logger.error(f"Error getting products for training: {e}")
        return []

def train_single_product(product_id: int, 
                        db: DynamicPricingDB,
                        total_timesteps: int = 100000,
                        save_model: bool = True) -> bool:
    """Train PPO model for a single product"""
    try:
        logger.info(f"Starting training for product {product_id}")
        
        # Create and train agent
        agent = DynamicPricingPPO(product_id, db)
        agent.train(total_timesteps)
        
        # Evaluate model
        evaluation = agent.evaluate_model(n_episodes=5)
        logger.info(f"Evaluation results for product {product_id}: {evaluation}")
        
        # Save model
        if save_model:
            agent.save_model()
        
        logger.info(f"Training completed for product {product_id}")
        return True
        
    except Exception as e:
        logger.error(f"Training failed for product {product_id}: {e}")
        return False

def train_multiple_products(product_ids: List[int],
                          db: DynamicPricingDB,
                          total_timesteps: int = 100000,
                          parallel: bool = False) -> Dict:
    """Train PPO models for multiple products"""
    results = {
        'successful': [],
        'failed': [],
        'total': len(product_ids)
    }
    
    if parallel:
        # Parallel training (simplified - in practice, use multiprocessing)
        import concurrent.futures
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_product = {
                executor.submit(train_single_product, pid, db, total_timesteps): pid 
                for pid in product_ids
            }
            
            for future in concurrent.futures.as_completed(future_to_product):
                product_id = future_to_product[future]
                try:
                    success = future.result()
                    if success:
                        results['successful'].append(product_id)
                    else:
                        results['failed'].append(product_id)
                except Exception as e:
                    logger.error(f"Training failed for product {product_id}: {e}")
                    results['failed'].append(product_id)
    else:
        # Sequential training
        for product_id in product_ids:
            success = train_single_product(product_id, db, total_timesteps)
            if success:
                results['successful'].append(product_id)
            else:
                results['failed'].append(product_id)
    
    return results

def main():
    parser = argparse.ArgumentParser(description='Train Dynamic Pricing PPO models')
    parser.add_argument('--product-id', type=int, help='Train specific product ID')
    parser.add_argument('--min-sales', type=int, default=10, 
                       help='Minimum sales required for training')
    parser.add_argument('--categories', type=int, nargs='+',
                       help='Filter by category IDs')
    parser.add_argument('--timesteps', type=int, default=100000,
                       help='Total timesteps for training')
    parser.add_argument('--parallel', action='store_true',
                       help='Use parallel training')
    parser.add_argument('--top-n', type=int, help='Train top N products by sales')
    
    args = parser.parse_args()
    
    # Initialize database
    logger.info("Initializing database connection")
    db = DynamicPricingDB()
    db.connect()
    
    try:
        if args.product_id:
            # Train single product
            logger.info(f"Training single product: {args.product_id}")
            success = train_single_product(args.product_id, db, args.timesteps)
            
            if success:
                logger.info("Training completed successfully")
            else:
                logger.error("Training failed")
                sys.exit(1)
                
        else:
            # Train multiple products
            logger.info("Getting products for training")
            product_ids = get_products_for_training(
                db, 
                min_sales=args.min_sales,
                categories=args.categories
            )
            
            if not product_ids:
                logger.error("No products found for training")
                sys.exit(1)
            
            # Limit to top N products if specified
            if args.top_n:
                product_ids = product_ids[:args.top_n]
            
            logger.info(f"Training {len(product_ids)} products")
            results = train_multiple_products(
                product_ids, 
                db, 
                args.timesteps,
                parallel=args.parallel
            )
            
            # Print results
            logger.info("Training Results:")
            logger.info(f"Total products: {results['total']}")
            logger.info(f"Successful: {len(results['successful'])}")
            logger.info(f"Failed: {len(results['failed'])}")
            
            if results['failed']:
                logger.warning(f"Failed products: {results['failed']}")
    
    finally:
        db.disconnect()
        logger.info("Database connection closed")

if __name__ == '__main__':
    main() 