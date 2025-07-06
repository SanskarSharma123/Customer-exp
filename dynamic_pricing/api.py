"""
REST API server for Dynamic Pricing System
Provides price recommendations and handles price updates using PPO models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd
import joblib

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import DynamicPricingConfig
from database import DynamicPricingDB
from ppo_agent import DynamicPricingPPO
from environment import DynamicPricingEnvironment

# Configure logging
logging.basicConfig(
    level=getattr(logging, DynamicPricingConfig.MONITORING_CONFIG['log_level']),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=DynamicPricingConfig.API_CONFIG['cors_origins'], supports_credentials=True)

# Global database connection
db = None
ppo_agents = {}  # Cache for PPO agents

def initialize_database():
    """Initialize database connection"""
    global db
    try:
        db = DynamicPricingDB()
        db.connect()
        db.create_price_change_log_table()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # Don't raise the exception, just log it and continue
        # This allows the API to start even if database is not available
        logger.warning("API will start without database connection. Some endpoints may not work.")
        db = None

def get_ppo_agent(product_id: int) -> Optional[DynamicPricingPPO]:
    """Get or create PPO agent for a product"""
    if product_id not in ppo_agents:
        try:
            agent = DynamicPricingPPO(product_id, db)
            # Try to load existing model
            model_path = f"{DynamicPricingConfig.TRAINING_CONFIG['model_save_path']}/product_{product_id}"
            if os.path.exists(f"{model_path}/best_model.zip"):
                agent.load_model(f"{model_path}/best_model.zip")
                logger.info(f"Loaded existing model for product {product_id}")
            else:
                logger.warning(f"No existing model found for product {product_id}")
                return None
            
            ppo_agents[product_id] = agent
        except Exception as e:
            logger.error(f"Failed to create PPO agent for product {product_id}: {e}")
            return None
    
    return ppo_agents[product_id]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        if db and db.connection:
            try:
                cursor = db.connection.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
                db_status = "connected"
            except Exception as db_error:
                logger.warning(f"Database connection check failed: {db_error}")
                db_status = "disconnected"
        else:
            db_status = "disconnected"
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database': db_status,
            'active_agents': len(ppo_agents),
            'api_version': '1.0.0'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/dynamic-pricing/predict/<int:product_id>', methods=['GET'])
def get_price_recommendation(product_id: int):
    """Get price recommendation for a product"""
    try:
        if db is None:
            return jsonify({'error': 'Database connection not available'}), 503
        
        # Get product data
        product_data = db.get_product_data(product_id)
        if product_data.empty:
            return jsonify({'error': 'Product not found'}), 404
        
        current_price = float(product_data['base_price'].iloc[0])
        
        # Get PPO agent
        agent = get_ppo_agent(product_id)
        if agent is None:
            return jsonify({
                'product_id': product_id,
                'current_price': current_price,
                'recommended_price': None,
                'price_change_percent': 0,
                'error': 'No trained model available'
            }), 200
        
        # Get market conditions
        market_data = db.get_market_conditions()
        
        # Get optimal price recommendation
        optimal_price = agent.get_optimal_price(current_price, market_data)
        
        # Calculate price change
        price_change_percent = ((optimal_price - current_price) / current_price) * 100
        
        # Prepare response
        recommendation = {
            'product_id': product_id,
            'current_price': current_price,
            'recommended_price': round(optimal_price, 2),
            'price_change_percent': round(price_change_percent, 2),
            'confidence': 0.85,
            'market_conditions': market_data,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(recommendation), 200
        
    except Exception as e:
        logger.error(f"Error getting price recommendation for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dynamic-pricing/update-price/<int:product_id>', methods=['POST'])
def update_product_price(product_id: int):
    """Update product price"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        force_update = data.get('force_update', False)
        
        # Get current price
        product_data = db.get_product_data(product_id)
        if product_data.empty:
            return jsonify({'error': 'Product not found'}), 404
        
        current_price = float(product_data['base_price'].iloc[0])
        
        # Get PPO agent for recommendation
        agent = get_ppo_agent(product_id)
        if agent is None:
            return jsonify({'error': 'No trained model available for this product'}), 404
        
        # Get market conditions
        market_data = db.get_market_conditions()
        
        # Get optimal price recommendation
        optimal_price = agent.get_optimal_price(current_price, market_data)
        optimal_price = float(optimal_price)  # Ensure native float
        
        # Calculate price change
        price_change_percent = ((optimal_price - current_price) / current_price) * 100
        
        # Update price in database
        success = db.update_product_price(product_id, optimal_price)
        if not success:
            return jsonify({'error': 'Failed to update price in database'}), 500
        
        # Log price change
        db.log_price_change(product_id, float(current_price), float(optimal_price), 'ai_recommendation', agent.model_version)
        
        response = {
            'product_id': product_id,
            'old_price': current_price,
            'new_price': optimal_price,
            'price_change_percent': round(price_change_percent, 2),
            'method': 'dynamic_pricing',
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Price updated for product {product_id}: {current_price} -> {optimal_price}")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error updating price for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dynamic-pricing/batch-update', methods=['POST'])
def batch_update_prices():
    """Update prices for multiple products"""
    try:
        data = request.get_json()
        if not data or 'product_ids' not in data:
            return jsonify({'error': 'product_ids array is required'}), 400
        
        product_ids = data['product_ids']
        force_update = data.get('force_update', False)
        results = []
        
        for product_id in product_ids:
            try:
                # Get current price
                product_data = db.get_product_data(product_id)
                if product_data.empty:
                    results.append({
                        'product_id': product_id,
                        'status': 'failed',
                        'error': 'Product not found'
                    })
                    continue
                
                current_price = float(product_data['base_price'].iloc[0])
                
                # Get PPO agent for recommendation
                agent = get_ppo_agent(product_id)
                if agent is None:
                    results.append({
                        'product_id': product_id,
                        'status': 'failed',
                        'error': 'No trained model available'
                    })
                    continue
                
                # Get market conditions
                market_data = db.get_market_conditions()
                
                # Get optimal price recommendation
                optimal_price = agent.get_optimal_price(current_price, market_data)
                
                # Update price
                success = db.update_product_price(product_id, optimal_price)
                if success:
                    db.log_price_change(product_id, current_price, optimal_price, 'batch_update', agent.model_version)
                    results.append({
                        'product_id': product_id,
                        'status': 'success',
                        'old_price': current_price,
                        'new_price': optimal_price
                    })
                else:
                    results.append({
                        'product_id': product_id,
                        'status': 'failed',
                        'error': 'Database update failed'
                    })
                    
            except Exception as e:
                results.append({
                    'product_id': product_id,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return jsonify({
            'message': 'Batch update completed',
            'results': results,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in batch price update: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/products/<int:product_id>/market-analysis', methods=['GET'])
def get_market_analysis(product_id: int):
    """Get comprehensive market analysis for a product"""
    try:
        # Get product data
        product_data = db.get_product_data(product_id)
        if product_data.empty:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get sales history
        sales_history = db.get_sales_history(product_id, days_back=30)
        
        # Get market conditions
        market_conditions = db.get_market_conditions()
        
        # Calculate metrics
        analysis = {
            'product_id': product_id,
            'product_name': product_data['name'].iloc[0],
            'category': product_data['category_name'].iloc[0],
            'current_price': float(product_data['base_price'].iloc[0]),
            'stock_quantity': int(product_data['stock_quantity'].iloc[0]),
            'avg_rating': float(product_data['avg_rating'].iloc[0]),
            'review_count': int(product_data['review_count'].iloc[0]),
            
            'sales_metrics': {
                'total_sales_30d': sales_history['quantity'].sum() if not sales_history.empty else 0,
                'avg_daily_sales': sales_history['quantity'].mean() if not sales_history.empty else 0,
                'total_revenue_30d': (sales_history['quantity'] * sales_history['sale_price']).sum() if not sales_history.empty else 0,
                'avg_sale_price': sales_history['sale_price'].mean() if not sales_history.empty else 0
            },
            
            'demand_analysis': {
                'price_elasticity': -1.2,  # Placeholder - could be calculated from historical data
                'demand_trend': 'stable',  # Placeholder
                'seasonal_pattern': market_conditions['season']
            },
            
            'market_conditions': market_conditions,
            
            'pricing_recommendations': {
                'optimal_price_range': {
                    'min': float(product_data['base_price'].iloc[0]) * 0.8,
                    'max': float(product_data['base_price'].iloc[0]) * 1.2
                },
                'suggested_discount': 0.05 if market_conditions['is_holiday'] else 0.0,
                'competition_level': market_conditions['competition_level']
            },
            
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(analysis), 200
        
    except Exception as e:
        logger.error(f"Error getting market analysis for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/products/<int:product_id>/price-history', methods=['GET'])
def get_price_history(product_id: int):
    """Get price change history for a product"""
    try:
        # Get price change log
        query = """
        SELECT old_price, new_price, change_percent, reason, model_version, created_at
        FROM price_change_log
        WHERE product_id = %s
        ORDER BY created_at DESC
        LIMIT 50
        """
        
        cursor = db.connection.cursor()
        cursor.execute(query, (product_id,))
        rows = cursor.fetchall()
        cursor.close()
        
        history = []
        for row in rows:
            history.append({
                'old_price': float(row[0]),
                'new_price': float(row[1]),
                'change_percent': float(row[2]),
                'reason': row[3],
                'model_version': row[4],
                'timestamp': row[5].isoformat()
            })
        
        return jsonify({
            'product_id': product_id,
            'price_changes': history,
            'total_changes': len(history)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting price history for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/models/status', methods=['GET'])
def get_models_status():
    """Get status of all trained models"""
    try:
        models_path = DynamicPricingConfig.TRAINING_CONFIG['model_save_path']
        models_status = []
        
        if os.path.exists(models_path):
            for item in os.listdir(models_path):
                if item.startswith('product_'):
                    product_id = int(item.split('_')[1])
                    model_path = os.path.join(models_path, item)
                    
                    # Check if model exists
                    best_model_path = os.path.join(model_path, 'best_model.zip')
                    model_exists = os.path.exists(best_model_path)
                    
                    # Get model info
                    model_info = {
                        'product_id': product_id,
                        'model_exists': model_exists,
                        'last_updated': None,
                        'model_size_mb': 0
                    }
                    
                    if model_exists:
                        stat = os.stat(best_model_path)
                        model_info['last_updated'] = datetime.fromtimestamp(stat.st_mtime).isoformat()
                        model_info['model_size_mb'] = round(stat.st_size / (1024 * 1024), 2)
                    
                    models_status.append(model_info)
        
        return jsonify({
            'total_models': len(models_status),
            'models': models_status,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting models status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dynamic-pricing/train', methods=['POST'])
def train_model():
    """Train model for a specific product"""
    try:
        data = request.get_json()
        if not data or 'product_id' not in data:
            return jsonify({'error': 'product_id is required'}), 400
        
        product_id = data['product_id']
        total_timesteps = data.get('total_timesteps', 100000)
        
        # Create new PPO agent
        agent = DynamicPricingPPO(product_id, db)
        
        # Train the model
        agent.train(total_timesteps=total_timesteps)
        
        # Update cache
        ppo_agents[product_id] = agent
        
        return jsonify({
            'product_id': product_id,
            'status': 'success',
            'total_timesteps': total_timesteps,
            'model_version': agent.model_version,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error training model for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500

# @app.route('/api/dynamic-pricing/products', methods=['GET'])
# def get_products_with_pricing():
#     """Get all products with dynamic pricing recommendations"""
#     try:
#         # Get all products
#         products_data = db.get_product_data()
#         products = []
        
#         for _, product in products_data.iterrows():
#             product_id = product['product_id']
            
#             # Get price recommendation
#             try:
#                 agent = get_ppo_agent(product_id)
#                 if agent is not None:
#                     current_price = float(product['base_price'])
#                     market_data = db.get_market_conditions()
#                     recommended_price = agent.get_optimal_price(current_price, market_data)
#                     price_change_percent = ((recommended_price - current_price) / current_price) * 100
#                 else:
#                     recommended_price = None
#                     price_change_percent = 0
#             except Exception as e:
#                 logger.warning(f"Error getting recommendation for product {product_id}: {e}")
#                 recommended_price = None
#                 price_change_percent = 0
            
#             # Get image URL
#             image_url = f"/images/products/{product['name'].lower().replace(' ', '-')}.jpg"
            
#             products.append({
#                 'product_id': product_id,
#                 'name': product['name'],
#                 'category_name': product['category_name'],
#                 'price': float(product['base_price']),
#                 'stock_quantity': int(product['stock_quantity']),
#                 'image_url': image_url,
#                 'recommended_price': recommended_price,
#                 'price_change_percent': price_change_percent,
#                 'avg_rating': float(product['avg_rating']),
#                 'review_count': int(product['review_count'])
#             })
        
#         return jsonify({
#             'products': products,
#             'total_products': len(products),
#             'timestamp': datetime.now().isoformat()
#         }), 200
        
#     except Exception as e:
#         logger.error(f"Error getting products with pricing: {e}")
#         return jsonify({'error': str(e)}), 500

@app.route('/api/dynamic-pricing/products', methods=['GET'])
def get_products_with_pricing():
    """Get only products with trained dynamic pricing models and recommendations"""
    try:
        # List of product IDs with trained models
        trained_product_ids = {4, 23, 29, 33, 44, 47, 60}

        # Get all products
        products_data = db.get_product_data()
        products = []

        # Filter only products with trained models
        filtered_products = products_data[products_data['product_id'].isin(trained_product_ids)]

        for _, product in filtered_products.iterrows():
            product_id = product['product_id']
            try:
                agent = get_ppo_agent(product_id)
                if agent is not None:
                    current_price = float(product['base_price'])
                    market_data = db.get_market_conditions()
                    recommended_price = agent.get_optimal_price(current_price, market_data)
                    price_change_percent = ((recommended_price - current_price) / current_price) * 100
                else:
                    recommended_price = None
                    price_change_percent = 0
            except Exception as e:
                logger.warning(f"Error getting recommendation for product {product_id}: {e}")
                recommended_price = None
                price_change_percent = 0

            image_url = f"/images/products/{product['name'].lower().replace(' ', '-')}.jpg"

            products.append({
                'product_id': product_id,
                'name': product['name'],
                'category_name': product['category_name'],
                'price': float(product['base_price']),
                'stock_quantity': int(product['stock_quantity']),
                'image_url': image_url,
                'recommended_price': recommended_price,
                'price_change_percent': price_change_percent,
                'avg_rating': float(product['avg_rating']),
                'review_count': int(product['review_count'])
            })

        return jsonify({
            'products': products,
            'total_products': len(products),
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error getting products with pricing: {e}")
        return jsonify({'error': str(e)}), 500
        
@app.route('/api/dynamic-pricing/status/<int:product_id>', methods=['GET'])
def get_model_status(product_id: int):
    """Get model status for a specific product"""
    try:
        agent = get_ppo_agent(product_id)
        
        if agent is None:
            return jsonify({
                'product_id': product_id,
                'model_exists': False,
                'status': 'not_trained'
            }), 200
        
        return jsonify({
            'product_id': product_id,
            'model_exists': True,
            'status': 'trained',
            'model_version': agent.model_version,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting model status for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/admin/dynamic-pricing/products', methods=['GET'])
def admin_get_products():
    """Admin endpoint to get all products with dynamic pricing (matches frontend expectation)"""
    return get_products_with_pricing()

@app.route('/admin/dynamic-pricing/train', methods=['POST'])
def admin_train_model():
    """Admin endpoint to train model (matches frontend expectation)"""
    return train_model()

@app.route('/admin/dynamic-pricing/batch-update', methods=['POST'])
def admin_batch_update():
    """Admin endpoint to batch update prices (matches frontend expectation)"""
    return batch_update_prices()

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    try:
        # Initialize database
        initialize_database()
        
        # Start the server
        app.run(
            host=DynamicPricingConfig.API_CONFIG['host'],
            port=DynamicPricingConfig.API_CONFIG['port'],
            debug=DynamicPricingConfig.API_CONFIG['debug']
        )
    except Exception as e:
        logger.error(f"Failed to start API server: {e}")
        sys.exit(1)
    finally:
        if db:
            db.disconnect() 