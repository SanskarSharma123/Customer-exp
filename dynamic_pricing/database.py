"""
Database interface for Dynamic Pricing System
"""

import psycopg2
import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Tuple
from config import DynamicPricingConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DynamicPricingDB:
    def __init__(self):
        self.config = DynamicPricingConfig.DB_CONFIG
        self.connection = None  # psycopg2 connection for cursor-based operations
        self.engine = None      # SQLAlchemy engine for pandas
        
    def connect(self):
        """Establish database connection using both psycopg2 and SQLAlchemy"""
        try:
            # psycopg2 connection for cursor-based operations
            self.connection = psycopg2.connect(**self.config)
            # SQLAlchemy engine for pandas
            user = self.config['user']
            password = self.config['password']
            host = self.config['host']
            port = self.config['port']
            database = self.config['database']
            conn_str = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
            self.engine = create_engine(conn_str)
            logger.info("Database connection established (psycopg2 + SQLAlchemy)")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
        if self.engine:
            self.engine.dispose()
            logger.info("SQLAlchemy engine disposed")
    
    def get_product_data(self, product_id: Optional[int] = None, 
                        days_back: int = 30) -> pd.DataFrame:
        """Get product data with historical pricing and sales"""
        query = """
        SELECT 
            p.product_id,
            p.name,
            p.category_id,
            p.price as base_price,
            p.discount_price,
            p.stock_quantity,
            p.unit,
            p.is_featured,
            c.name as category_name,
            COALESCE(AVG(r.rating), 0) as avg_rating,
            COUNT(r.review_id) as review_count,
            COALESCE(AVG(r.sentiment_score), 5.0) as avg_sentiment
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        """
        
        if product_id:
            query += f" WHERE p.product_id = {product_id}"
        
        query += " GROUP BY p.product_id, c.name"
        
        try:
            df = pd.read_sql_query(query, self.engine)
            return df
        except Exception as e:
            logger.error(f"Error fetching product data: {e}")
            return pd.DataFrame()
    
    def get_sales_history(self, product_id: int, days_back: int = 30) -> pd.DataFrame:
        """Get historical sales data for a product"""
        query = """
        SELECT 
            DATE(o.created_at) as sale_date,
            oi.product_id,
            oi.quantity,
            oi.price as sale_price,
            o.total_amount,
            o.status,
            EXTRACT(DOW FROM o.created_at) as day_of_week,
            EXTRACT(HOUR FROM o.created_at) as hour_of_day
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.product_id = %s 
        AND o.created_at >= NOW() - INTERVAL '%s days'
        AND o.status = 'delivered'
        ORDER BY o.created_at
        """
        
        try:
            df = pd.read_sql_query(query, self.engine, params=(product_id, days_back))
            return df
        except Exception as e:
            logger.error(f"Error fetching sales history: {e}")
            return pd.DataFrame()
    
    def get_user_behavior_data(self, days_back: int = 30) -> pd.DataFrame:
        """Get user behavior data for segmentation"""
        query = """
        SELECT 
            u.user_id,
            u.name,
            COUNT(DISTINCT o.order_id) as total_orders,
            AVG(o.total_amount) as avg_order_value,
            SUM(oi.quantity) as total_items_purchased,
            AVG(oi.price) as avg_item_price,
            MAX(o.created_at) as last_purchase_date,
            COUNT(DISTINCT oi.product_id) as unique_products_purchased
        FROM users u
        LEFT JOIN orders o ON u.user_id = o.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.created_at >= NOW() - INTERVAL '%s days'
        GROUP BY u.user_id, u.name
        """
        
        try:
            df = pd.read_sql_query(query, self.engine, params=(days_back,))
            return df
        except Exception as e:
            logger.error(f"Error fetching user behavior data: {e}")
            return pd.DataFrame()
    
    def get_competitor_data(self, product_id: int) -> pd.DataFrame:
        """Get competitor pricing data (placeholder for future implementation)"""
        # This would integrate with external APIs or competitor monitoring
        # For now, return empty DataFrame
        return pd.DataFrame()
    
    def update_product_price(self, product_id: int, new_price: float, 
                           discount_price: Optional[float] = None) -> bool:
        """Update product price in database"""
        if not self.connection:
            logger.error("No database connection available for update_product_price.")
            return False
        try:
            cursor = self.connection.cursor()
            if discount_price is not None:
                query = """
                UPDATE products 
                SET price = %s, discount_price = %s, updated_at = NOW()
                WHERE product_id = %s
                """
                cursor.execute(query, (new_price, discount_price, product_id))
            else:
                query = """
                UPDATE products 
                SET price = %s, updated_at = NOW()
                WHERE product_id = %s
                """
                cursor.execute(query, (new_price, product_id))
            self.connection.commit()
            cursor.close()
            logger.info(f"Updated price for product {product_id}: {new_price}")
            return True
        except Exception as e:
            logger.error(f"Error updating product price: {e}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def log_price_change(self, product_id: int, old_price: float, 
                        new_price: float, reason: str, model_version: str):
        """Log price changes for audit trail"""
        if not self.connection:
            logger.error("No database connection available for log_price_change.")
            return
        query = """
        INSERT INTO price_change_log (
            product_id, old_price, new_price, change_percent, 
            reason, model_version, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """
        change_percent = ((new_price - old_price) / old_price) * 100
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, (product_id, old_price, new_price, 
                                 change_percent, reason, model_version))
            self.connection.commit()
            cursor.close()
        except Exception as e:
            logger.error(f"Error logging price change: {e}")
            if self.connection:
                self.connection.rollback()
    
    def get_market_conditions(self) -> Dict:
        """Get current market conditions and external factors"""
        # This would integrate with external APIs for:
        # - Economic indicators
        # - Seasonal factors
        # - Competitor pricing
        # - Supply chain conditions
        return {
            'season': self._get_current_season(),
            'day_of_week': datetime.now().weekday(),
            'is_holiday': self._is_holiday(),
            'economic_index': 1.0,  # Placeholder
            'competition_level': 1.0  # Placeholder
        }
    
    def _get_current_season(self) -> str:
        """Determine current season"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'summer'
        elif month in [6, 7, 8, 9]:
            return 'monsoon'
        else:
            return 'festival'
    
    def _is_holiday(self) -> bool:
        """Check if current date is a holiday"""
        # This would integrate with holiday calendar API
        # For now, return False
        return False
    
    def create_price_change_log_table(self):
        """Create table for logging price changes"""
        if not self.connection:
            logger.error("No database connection available for create_price_change_log_table.")
            return
        query = """
        CREATE TABLE IF NOT EXISTS price_change_log (
            log_id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL,
            old_price DECIMAL(10,2) NOT NULL,
            new_price DECIMAL(10,2) NOT NULL,
            change_percent DECIMAL(5,2) NOT NULL,
            reason VARCHAR(255),
            model_version VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )
        """
        try:
            cursor = self.connection.cursor()
            cursor.execute(query)
            self.connection.commit()
            cursor.close()
            logger.info("Price change log table created/verified")
        except Exception as e:
            logger.error(f"Error creating price change log table: {e}")
            if self.connection:
                self.connection.rollback() 