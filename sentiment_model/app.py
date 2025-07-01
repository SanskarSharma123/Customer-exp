import os
import psycopg2
from psycopg2.extras import RealDictCursor
from collections import defaultdict
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime, timedelta
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataPreprocessor:
    def __init__(self):
        self.score_ranges = {
            'highly negative': (0.0, 1.9),
            'negative': (2.0, 3.9),
            'neutral': (4.0, 5.9),
            'positive': (6.0, 7.9),
            'highly positive': (8.0, 10.0)
        }
    
    def get_label_from_score(self, score):
        if 0.0 <= score <= 1.9:
            return 'highly negative'
        elif 2.0 <= score <= 3.9:
            return 'negative'
        elif 4.0 <= score <= 5.9:
            return 'neutral'
        elif 6.0 <= score <= 7.9:
            return 'positive'
        elif 8.0 <= score <= 10.0:
            return 'highly positive'
        else:
            return 'neutral'

    def get_score_from_label(self, label):
        label_lower = label.lower()
        if label_lower in self.score_ranges:
            min_score, max_score = self.score_ranges[label_lower]
            return (min_score + max_score) / 2.0
        return 5.0

# Try to import sentiment model - make it optional
try:
    from sentiment_model import load_model_complete, predict_sentiment_aligned
    SENTIMENT_AVAILABLE = True
    logger.info("Sentiment model imported successfully")
except ImportError as e:
    logger.warning(f"Sentiment model not available: {e}")
    SENTIMENT_AVAILABLE = False

# Database configuration - use environment variables for security
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'postgres2'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'hatebitches1'),
    'port': int(os.getenv('DB_PORT', 5432))
}

class EnhancedRecommendationSystem:
    def __init__(self, db_config, model_dir='enhanced_sentiment_model'):
        self.db_config = db_config
        self.model_dir = model_dir
        self.sentiment_model = None
        self.tokenizer = None
        self.label_encoder = None
        self.preprocessor = DataPreprocessor()
        self.max_len = None
        
        # Load sentiment model if available
        if SENTIMENT_AVAILABLE:
            try:
                self.sentiment_model, self.tokenizer, self.label_encoder, _, self.max_len = load_model_complete(model_dir)
                logger.info("Sentiment model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load sentiment model: {e}")
                self.sentiment_model = None
        else:
            logger.info("Sentiment model not available, using rating-based fallback")
            
        # Caching for performance
        self.product_cache = {}
        self.user_cache = {}
        self.cache_ttl = 300  # 5 minutes
        
    def connect_db(self):
        """Create database connection with better error handling"""
        try:
            return psycopg2.connect(**self.db_config)
        except psycopg2.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def get_user_profile(self, user_id):
        """Get comprehensive user profile including demographics and preferences"""
        cache_key = f"user_profile_{user_id}"
        if cache_key in self.user_cache:
            return self.user_cache[cache_key]
            
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get user basic info
                    cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
                    user_info = cur.fetchone()
                    
                    if not user_info:
                        return None
                        
                    # Get user purchase history
                    order_history = self.get_user_order_history(user_id)
                    
                    # Get user reviews
                    reviews = self.get_user_reviews_and_ratings(user_id)
                    
                    # Calculate user preferences
                    preferences = self.calculate_user_preferences(user_id)
                    
                    profile = {
                        'user_info': dict(user_info),
                        'order_history': order_history,
                        'reviews': reviews,
                        'preferences': preferences
                    }
                    
                    self.user_cache[cache_key] = profile
                    return profile
                    
        except Exception as e:
            logger.error(f"Error fetching user profile for user {user_id}: {e}")
            return None
    
    def get_user_order_history(self, user_id):
        """Get user's order history with enhanced details"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT DISTINCT 
                        p.product_id, p.name, 
                        CAST(p.price AS FLOAT) as price,
                        CAST(p.discount_price AS FLOAT) as discount_price,
                        p.category_id, p.description, p.unit,
                        c.name as category_name,
                        oi.quantity, 
                        CAST(oi.price AS FLOAT) as order_price,
                        o.created_at, o.status,
                        COUNT(*) OVER (PARTITION BY p.product_id) as order_frequency
                    FROM orders o
                    JOIN order_items oi ON o.order_id = oi.order_id
                    JOIN products p ON oi.product_id = p.product_id
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    WHERE o.user_id = %s
                    ORDER BY o.created_at DESC
                    """
                    cur.execute(query, (user_id,))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching order history for user {user_id}: {e}")
            return []
    
    def get_user_order_statistics(self, user_id):
        """Get accurate user order statistics"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Count unique orders by status
                    order_stats_query = """
                    SELECT 
                        COUNT(*) as total_orders,
                        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                        MIN(created_at) as first_order_date,
                        MAX(created_at) as last_order_date,
                        SUM(total_amount) as total_spent
                    FROM orders 
                    WHERE user_id = %s
                    """
                    cur.execute(order_stats_query, (user_id,))
                    order_stats = cur.fetchone()
                    
                    # Count unique products purchased
                    unique_products_query = """
                    SELECT COUNT(DISTINCT oi.product_id) as unique_products_purchased
                    FROM orders o
                    JOIN order_items oi ON o.order_id = oi.order_id
                    WHERE o.user_id = %s
                    """
                    cur.execute(unique_products_query, (user_id,))
                    product_stats = cur.fetchone()
                    
                    return {
                        'total_orders': order_stats['total_orders'] or 0,
                        'delivered_orders': order_stats['delivered_orders'] or 0,
                        'pending_orders': order_stats['pending_orders'] or 0,
                        'cancelled_orders': order_stats['cancelled_orders'] or 0,
                        'first_order_date': order_stats['first_order_date'],
                        'last_order_date': order_stats['last_order_date'],
                        'total_spent': float(order_stats['total_spent']) if order_stats['total_spent'] else 0.0,
                        'unique_products_purchased': product_stats['unique_products_purchased'] or 0
                    }
                    
        except Exception as e:
            logger.error(f"Error getting user order statistics for user {user_id}: {e}")
            return {
                'total_orders': 0,
                'delivered_orders': 0,
                'pending_orders': 0,
                'cancelled_orders': 0,
                'first_order_date': None,
                'last_order_date': None,
                'total_spent': 0.0,
                'unique_products_purchased': 0
            }

    def get_user_reviews_and_ratings(self, user_id):
        """Get user's reviews and ratings with sentiment analysis"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Modified to fetch stored sentiment data
                    query = """
                    SELECT r.review_id, r.product_id, r.rating, r.comment, r.created_at,
                        r.sentiment_score, r.sentiment_label, r.sentiment_confidence,
                        p.name, p.category_id, c.name as category_name
                    FROM reviews r
                    JOIN products p ON r.product_id = p.product_id
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    WHERE r.user_id = %s
                    ORDER BY r.created_at DESC
                    """
                    cur.execute(query, (user_id,))
                    reviews = cur.fetchall()
                    
                    # Only analyze sentiment if not already stored
                    for review in reviews:
                        if review.get('sentiment_score') is None:
                            sentiment_result = self.analyze_sentiment(review['comment'], review['rating'])
                            review.update(sentiment_result)
                            # Update database with sentiment analysis
                            update_query = """
                            UPDATE reviews 
                            SET sentiment_score = %s, sentiment_label = %s, sentiment_confidence = %s
                            WHERE review_id = %s
                            """
                            cur.execute(update_query, (
                                sentiment_result['sentiment_score'],
                                sentiment_result['sentiment_label'],
                                sentiment_result.get('confidence', 0.8),
                                review['review_id']
                            ))
                            conn.commit()
                        else:
                            # Use stored sentiment data
                            sentiment_result = {
                                'sentiment_score': review['sentiment_score'],
                                'sentiment_label': review['sentiment_label'],
                                'confidence': review.get('sentiment_confidence', 0.8)
                            }
                            review.update(sentiment_result)
                    
                    return reviews
        except Exception as e:
            logger.error(f"Error fetching user reviews for user {user_id}: {e}")
            return []
    
    def analyze_sentiment(self, comment, fallback_rating=None):
        """Enhanced sentiment analysis with better fallback"""
        if not comment or comment.strip() == '':
            if fallback_rating:
                return self.get_sentiment_from_rating(fallback_rating)
            return {'sentiment_score': 5.0, 'sentiment_label': 'neutral', 'confidence': 0.5}
        
        # Try AI-based sentiment analysis
        if self.sentiment_model and SENTIMENT_AVAILABLE:
            try:
                result = predict_sentiment_aligned(
                    comment, 
                    self.sentiment_model, 
                    self.tokenizer,
                    self.label_encoder, 
                    self.preprocessor, 
                    self.max_len
                )
                result['confidence'] = 0.9  # High confidence for AI analysis
                return result
            except Exception as e:
                logger.warning(f"Sentiment analysis failed: {e}")
        
        # Fallback to rating-based sentiment
        if fallback_rating:
            result = self.get_sentiment_from_rating(fallback_rating)
            result['confidence'] = 0.7  # Medium confidence for rating-based
            return result
        
        # Last resort - neutral sentiment
        return {'sentiment_score': 5.0, 'sentiment_label': 'neutral', 'confidence': 0.5}
    
    def get_sentiment_from_rating(self, rating):
        """Convert numeric rating to sentiment with confidence scores"""
        sentiment_mappings = {
            1: {'sentiment_score': 1.0, 'sentiment_label': 'highly negative'},
            2: {'sentiment_score': 3.0, 'sentiment_label': 'negative'},
            3: {'sentiment_score': 5.0, 'sentiment_label': 'neutral'},
            4: {'sentiment_score': 7.0, 'sentiment_label': 'positive'},
            5: {'sentiment_score': 9.0, 'sentiment_label': 'highly positive'}
        }
        return sentiment_mappings.get(rating, {'sentiment_score': 5.0, 'sentiment_label': 'neutral'})
    
    def calculate_user_preferences(self, user_id):
        """Enhanced user preference calculation with time decay and sentiment weighting"""
        order_history = self.get_user_order_history(user_id)
        reviews = self.get_user_reviews_and_ratings(user_id)
        
        if not order_history and not reviews:
            return None
        
        preferences = {
            'categories': defaultdict(float),
            'price_ranges': {'min': 0, 'max': float('inf'), 'preferred': 0},
            'brands': defaultdict(float),
            'sentiment_profile': {'avg_sentiment': 5.0, 'sentiment_variance': 0.0},
            'purchase_frequency': defaultdict(int),
            'seasonal_preferences': defaultdict(float),
            'time_of_day_preferences': defaultdict(float),
            'preferred_products': set(),
            'avoided_products': set()
        }
        
        # Analyze purchase history with time decay
        current_time = datetime.now()
        category_weights = defaultdict(float)
        prices = []
        
        for order in order_history:
            # Calculate time decay (more recent purchases have higher weight)
            purchase_date = order['created_at']
            if isinstance(purchase_date, str):
                purchase_date = datetime.fromisoformat(purchase_date.replace('Z', '+00:00'))
            
            days_ago = (current_time - purchase_date).days
            time_weight = np.exp(-days_ago / 90)  # Decay over 90 days
            
            # Category preferences with frequency and recency
            category_weight = order['quantity'] * time_weight * order['order_frequency']
            category_weights[order['category_id']] += category_weight
            
            # Price analysis
            print(f"Processing purchase price data:")
            print(f"  Original price: {order['price']} (type: {type(order['price'])})")
            print(f"  Discount price: {order.get('discount_price')} (type: {type(order.get('discount_price'))})")
            
            discount = order.get('discount_price')
            if discount is not None:
                try:
                    price_val = float(discount)
                    print(f"  Using discount price: {price_val}")
                except Exception as e:
                    print(f"  Error converting discount price: {e}")
                    price_val = float(order['price'])
            else:
                try:
                    price_val = float(order['price'])
                    print(f"  Using regular price: {price_val}")
                except Exception as e:
                    print(f"  Error converting regular price: {e}")
                    continue
            
            prices.append(price_val)
            
            # Product preferences
            preferences['preferred_products'].add(order['product_id'])
            preferences['purchase_frequency'][order['product_id']] += order['quantity']
        
        # Normalize category preferences
        total_weight = sum(category_weights.values())
        if total_weight > 0:
            for category_id, weight in category_weights.items():
                preferences['categories'][category_id] = weight / total_weight
        
        # Calculate price preferences
        if prices:
            preferences['price_ranges']['min'] = float(np.percentile(prices, 10))
            preferences['price_ranges']['max'] = float(np.percentile(prices, 90))
            preferences['price_ranges']['preferred'] = float(np.median(prices))
        
        # Analyze sentiment from reviews
        if reviews:
            sentiments = []
            for review in reviews:
                sentiment_score = review.get('sentiment_score', 5.0)
                sentiments.append(sentiment_score)
                
                # Identify products to avoid based on negative sentiment
                if sentiment_score < 4.0:
                    preferences['avoided_products'].add(review['product_id'])
            
            preferences['sentiment_profile']['avg_sentiment'] = np.mean(sentiments)
            preferences['sentiment_profile']['sentiment_variance'] = np.var(sentiments)
        
        return preferences
    
    def get_trending_products(self, limit=10, time_window_days=7):
        """Get trending products based on recent purchase velocity"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                        p.category_id, p.description, p.image_url, p.unit,
                        c.name as category_name,
                        COALESCE(COUNT(oi.order_item_id), 0) as recent_orders,
                        COALESCE(SUM(oi.quantity), 0) as recent_quantity,
                        COALESCE(AVG(r.rating), 0) as avg_rating,
                        COUNT(DISTINCT r.review_id) as review_count
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN order_items oi ON p.product_id = oi.product_id
                    LEFT JOIN orders o ON oi.order_id = o.order_id AND 
                        o.created_at >= NOW() - INTERVAL '%s days'
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE p.stock_quantity > 0
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                            p.category_id, p.description, p.image_url, p.unit, c.name
                    ORDER BY recent_quantity DESC, recent_orders DESC, avg_rating DESC
                    LIMIT %s
                    """
                    cur.execute(query, (time_window_days, limit))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching trending products: {e}")
            return []
    
    def get_personalized_recommendations(self, user_id, limit=20):
        """Generate highly personalized recommendations using multiple algorithms"""
        user_profile = self.get_user_profile(user_id)
        
         
        if not user_profile or not user_profile['preferences']:
            # Get more products from each category to ensure we have enough after deduplication
            trending = self.get_trending_products(limit * 2)          # Get double the limit
            best_selling = self.get_best_selling_products(limit * 2)  # Get double the limit  
            highest_rated = self.get_highest_rated_products(limit * 2)
            
            # Combine and deduplicate
            seen_ids = set()
            combined = []
            
            for product_list in [trending, best_selling, highest_rated]:
                for product in product_list:
                    if product['product_id'] not in seen_ids:
                        combined.append(product)
                        seen_ids.add(product['product_id'])
            
            # Ensure we have at least the requested limit
            if len(combined) < limit:
                # If still not enough, get more from general products
                try:
                    with self.connect_db() as conn:
                        with conn.cursor(cursor_factory=RealDictCursor) as cur:
                            existing_ids = [p['product_id'] for p in combined]
                            placeholders = ','.join(['%s'] * len(existing_ids)) if existing_ids else 'NULL'
                            additional_query = f"""
                            SELECT p.product_id, p.name, p.price, p.discount_price, 
                                p.category_id, p.description, p.image_url, p.unit,
                                c.name as category_name,
                                COALESCE(AVG(r.rating), 0) as avg_rating,
                                COUNT(r.review_id) as review_count
                            FROM products p
                            LEFT JOIN categories c ON p.category_id = c.category_id
                            LEFT JOIN reviews r ON p.product_id = r.product_id
                            WHERE p.stock_quantity > 0 AND p.product_id NOT IN ({placeholders})
                            GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                                    p.category_id, p.description, p.image_url, p.unit, c.name
                            ORDER BY RANDOM()
                            LIMIT %s
                            """
                            needed = limit - len(combined)
                            cur.execute(additional_query, existing_ids + [needed])
                            additional_products = cur.fetchall()
                            combined.extend(additional_products)
                except Exception as e:
                    logger.error(f"Error fetching additional products: {e}")
            
            return {
                'type': 'new_user',
                'products': combined[:limit],
                'message': 'Welcome! Here are popular products others love.',
                'confidence': 0.7
            }
        
        # Existing user - generate multi-algorithm recommendations
        preferences = user_profile['preferences']
        
        # Algorithm 1: Content-based filtering
        content_recs = self.get_content_based_recommendations_enhanced(user_id, preferences, limit // 3)
        
        # Algorithm 2: Collaborative filtering
        collab_recs = self.get_collaborative_recommendations_enhanced(user_id, limit // 3)
        
        # Algorithm 3: Hybrid approach with sentiment weighting
        hybrid_recs = self.get_hybrid_recommendations(user_id, preferences, limit // 3)
        
        # Combine recommendations with smart deduplication and scoring
        final_recommendations = self.combine_recommendations([
            ('content', content_recs, 0.4),
            ('collaborative', collab_recs, 0.3),
            ('hybrid', hybrid_recs, 0.3)
        ], limit)
        
        return {
            'type': 'personalized',
            'products': final_recommendations,
            'message': 'Recommendations based on your purchase history and preferences.',
            'confidence': 0.9,
            'user_preferences': {
                'top_categories': dict(list(preferences['categories'].items())[:3]),
                'price_range': preferences['price_ranges'],
                'avg_sentiment': preferences['sentiment_profile']['avg_sentiment']
            }
        }
    
    def get_content_based_recommendations_enhanced(self, user_id, preferences, limit):
        """Enhanced content-based recommendations with better scoring"""
        try:
            purchased_products = list(preferences['preferred_products'])
            avoided_products = list(preferences['avoided_products'])
            
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                           p.category_id, p.description, p.image_url, p.unit,
                           c.name as category_name,
                           AVG(r.rating) as avg_rating,
                           COUNT(r.review_id) as review_count,
                           p.stock_quantity
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE p.stock_quantity > 0
                    """
                    
                    params = []
                    if purchased_products:
                        placeholders = ','.join(['%s'] * len(purchased_products))
                        query += f" AND p.product_id NOT IN ({placeholders})"
                        params.extend(purchased_products)
                    
                    if avoided_products:
                        placeholders = ','.join(['%s'] * len(avoided_products))
                        query += f" AND p.product_id NOT IN ({placeholders})"
                        params.extend(avoided_products)
                    
                    query += """
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                             p.category_id, p.description, p.image_url, p.unit, 
                             c.name, p.stock_quantity
                    """
                    
                    cur.execute(query, params)
                    candidate_products = cur.fetchall()
        
        
        # Score products based on user preferences
            scored_products = []
            
            for product in candidate_products:
                print(f"\n=== DEBUG: Processing product {product['product_id']} ===")
                
                score = 0
                sentiment_score = 5.0  # Default neutral
                if product.get('avg_rating'):
                    # Convert rating to sentiment score
                    rating = float(product['avg_rating'])
                    sentiment_score = min(10.0, max(1.0, rating * 2))
                
                # Use actual sentiment if available
                sentiment_pref = preferences['sentiment_profile']['avg_sentiment']
                print(f"Sentiment pref: {sentiment_pref} (type: {type(sentiment_pref)})")
                print(f"Sentiment score: {sentiment_score} (type: {type(sentiment_score)})")
                
                try:
                    sentiment_pref_float = float(sentiment_pref)
                    sentiment_diff = abs(sentiment_score - sentiment_pref_float)
                    sentiment_similarity = 1 - (sentiment_diff / 10.0)
                    score += sentiment_similarity * 0.3
                except (TypeError, ValueError) as e:
                    print(f"Error in sentiment calculation: {e}")
                    score += 0.5 * 0.3  # Default neutral score
                
                # Category preference (40% weight)
                category_score = preferences['categories'].get(product['category_id'], 0)
                score += category_score * 0.4
                
                # Price preference (25% weight) - DEBUG THIS SECTION
                print(f"Product price: {product['price']} (type: {type(product['price'])})")
                print(f"Product discount_price: {product.get('discount_price')} (type: {type(product.get('discount_price'))})")
                
                discount = product.get('discount_price')
                if discount is not None:
                    product_price = float(discount)
                    print(f"Using discount price: {product_price}")
                else:
                    product_price = float(product['price'])
                    print(f"Using regular price: {product_price}")

                # Convert preference price to float - handle Decimal type
                price_pref = preferences['price_ranges']['preferred']
                print(f"Price preference: {price_pref} (type: {type(price_pref)})")
                
                try:
                    price_pref = float(price_pref) if price_pref is not None else 0.0
                    print(f"Price preference after conversion: {price_pref}")
                except (TypeError, ValueError) as e:
                    print(f"Error converting price preference: {e}")
                    price_pref = 0.0

                # Now do calculations with floats - add safety check
                if price_pref > 0:
                    print(f"Calculating price score: abs({product_price} - {price_pref}) / {price_pref}")
                    try:
                        price_score = 1 / (1 + abs(product_price - price_pref) / price_pref)
                        print(f"Price score calculated: {price_score}")
                    except Exception as e:
                        print(f"ERROR in price score calculation: {e}")
                        price_score = 0.5
                else:
                    price_score = 0.5
                    print(f"Using default price score: {price_score}")
                
                score += price_score * 0.25

                # Rating score (20% weight) - handle no ratings
                rating_score = 0.5  # Default for products with no ratings
                if product.get('avg_rating') is not None:
                    try:
                        rating_score = float(product['avg_rating']) / 5.0
                        print(f"Rating score: {rating_score}")
                    except (TypeError, ValueError):
                        rating_score = 0.5
                        print(f"Error calculating rating score, using default: {rating_score}")
                score += rating_score * 0.2

                # Popularity score (10% weight) - handle no reviews
                popularity_score = 0.1  # Small default for new products
                if product.get('review_count') and product['review_count'] > 0:
                    try:
                        popularity_score = min(1.0, float(product['review_count']) / 50.0)
                    except (TypeError, ValueError):
                        popularity_score = 0.1
                score += popularity_score * 0.1
                
                # Stock availability bonus (5% weight)
                stock_score = min(1.0, product['stock_quantity'] / 100.0)
                score += stock_score * 0.05
                print(f"Final score for product {product['product_id']}: {score}")
                scored_products.append((product, score))
                
            
            # Sort by score and return top recommendations
            scored_products.sort(key=lambda x: x[1], reverse=True)
            return [product for product, score in scored_products[:limit]]
        except Exception as e:
            print(f"FULL ERROR in get_content_based_recommendations_enhanced: {e}")
            import traceback
            traceback.print_exc()
            return []
        
    def get_highest_rated_products(self, limit=10, min_reviews=5):
        """Get highest rated products with sufficient reviews"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                        p.category_id, p.description, p.image_url, p.unit,
                        c.name as category_name,
                        AVG(r.rating) as avg_rating,
                        COUNT(r.review_id) as review_count
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE p.stock_quantity > 0
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                            p.category_id, p.description, p.image_url, p.unit, c.name
                    HAVING COUNT(r.review_id) >= %s
                    ORDER BY avg_rating DESC, review_count DESC
                    LIMIT %s
                    """
                    cur.execute(query, (min_reviews, limit))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching highest rated products: {e}")
            return []
    
    def get_collaborative_recommendations_enhanced(self, user_id, limit):
        """Enhanced collaborative filtering with user similarity weighting"""
        similar_users = self.get_similar_users_enhanced(user_id)
        if not similar_users:
            return []
        
        try:
            # Weight recommendations by user similarity
            product_scores = defaultdict(float)
            
            for similar_user_id, similarity_score in similar_users:
                user_orders = self.get_user_order_history(similar_user_id)
                
                for order in user_orders:

                    product_id = order['product_id']
                    # Weight by similarity, purchase frequency, and recency
                    purchase_date = order['created_at']
                    if isinstance(purchase_date, str):
                        purchase_date = datetime.fromisoformat(purchase_date.replace('Z', '+00:00'))
                    
                    days_ago = (datetime.now() - purchase_date).days
                    recency_weight = np.exp(-days_ago / 60)  # 60-day decay
                    
                    score = float(similarity_score) * float(order['quantity']) * recency_weight
                    product_scores[product_id] += score
            
            # Get product details for top scored products
            if not product_scores:
                return []
            
            top_product_ids = sorted(product_scores.items(), key=lambda x: x[1], reverse=True)[:limit * 2]
            
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    placeholders = ','.join(['%s'] * len(top_product_ids))
                    query = f"""
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                           p.category_id, p.description, p.image_url, p.unit,
                           c.name as category_name,
                           AVG(r.rating) as avg_rating,
                           COUNT(r.review_id) as review_count
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE p.product_id IN ({placeholders}) AND p.stock_quantity > 0
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                             p.category_id, p.description, p.image_url, p.unit, c.name
                    """
                    
                    product_ids = [pid for pid, score in top_product_ids]
                    cur.execute(query, product_ids)
                    products = cur.fetchall()
                    
                    # Re-sort by collaborative score
                    products_with_scores = []
                    for product in products:
                        collab_score = product_scores[product['product_id']]
                        products_with_scores.append((product, collab_score))
                    
                    products_with_scores.sort(key=lambda x: x[1], reverse=True)
                    return [product for product, score in products_with_scores[:limit]]
                    
        except Exception as e:
            logger.error(f"Error in collaborative recommendations: {e}")
            return []
    
    def get_similar_users_enhanced(self, user_id, limit=20):
        """Enhanced user similarity calculation with multiple factors"""
        target_preferences = self.calculate_user_preferences(user_id)
        if not target_preferences:
            return []
        
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get users with similar purchase patterns
                    query = """
                    SELECT DISTINCT u.user_id, u.created_at as user_since
                    FROM users u
                    WHERE u.user_id != %s
                    AND u.user_id IN (
                        SELECT user_id FROM orders
                        UNION
                        SELECT user_id FROM reviews
                    )
                    """
                    cur.execute(query, (user_id,))
                    other_users = cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching similar users: {e}")
            return []
        
        similar_users = []
        
        for user_data in other_users:
            other_user_id = user_data['user_id']
            other_preferences = self.calculate_user_preferences(other_user_id)
            if not other_preferences:
                continue
            
            # Calculate multi-dimensional similarity
            similarity = self.calculate_enhanced_similarity(target_preferences, other_preferences)
            
            if similarity > 0.2:  # Threshold for similarity
                similar_users.append((other_user_id, similarity))
        
        # Sort by similarity and return top users
        similar_users.sort(key=lambda x: x[1], reverse=True)
        return similar_users[:limit]
    
    def calculate_enhanced_similarity(self, pref1, pref2):
        """Enhanced similarity calculation with multiple factors"""
        similarities = []
        
        # Category similarity (Jaccard + weighted overlap)
        categories1 = set(pref1['categories'].keys())
        categories2 = set(pref2['categories'].keys())
        
        if categories1 and categories2:
            jaccard = len(categories1.intersection(categories2)) / len(categories1.union(categories2))
            
            # Weighted category similarity
            common_cats = categories1.intersection(categories2)
            if common_cats:
                weighted_sim = np.mean([
                    1 - abs(pref1['categories'][cat] - pref2['categories'][cat])
                    for cat in common_cats
                ])
                category_similarity = 0.6 * jaccard + 0.4 * weighted_sim
            else:
                category_similarity = jaccard
            
            similarities.append(('category', category_similarity, 0.4))
        
        # Price range similarity
        price1 = pref1['price_ranges']
        price2 = pref2['price_ranges']
        
        print(f"Price similarity calculation:")
        print(f"  Price1 preferred: {price1.get('preferred')} (type: {type(price1.get('preferred'))})")
        print(f"  Price2 preferred: {price2.get('preferred')} (type: {type(price2.get('preferred'))})")

        if price1.get('preferred') and price2.get('preferred'):
            try:
                p1 = float(price1['preferred'])
                p2 = float(price2['preferred'])
                print(f"  Converted prices: p1={p1}, p2={p2}")
                
                if p1 > 0 and p2 > 0:
                    price_diff = abs(p1 - p2)
                    max_price = max(p1, p2)
                    price_similarity = 1 - (price_diff / max_price)
                    print(f"  Price similarity: {price_similarity}")
                    similarities.append(('price', price_similarity, 0.3))
            except (TypeError, ValueError, ZeroDivisionError) as e:
                print(f"  Error in price similarity calculation: {e}")
                # Skip price similarity if there's an error
                pass
        
        # Sentiment similarity
        try:
            sent1_float = float(pref1['sentiment_profile']['avg_sentiment'])
            sent2_float = float(pref2['sentiment_profile']['avg_sentiment'])
            sentiment_similarity = 1 - abs(sent1_float - sent2_float) / 10.0
        except (TypeError, ValueError):
            sentiment_similarity = 0.5 
        similarities.append(('sentiment', sentiment_similarity, 0.2))
        
        # Product overlap similarity
        products1 = pref1['preferred_products']
        products2 = pref2['preferred_products']
        
        if products1 and products2:
            product_jaccard = len(products1.intersection(products2)) / len(products1.union(products2))
            similarities.append(('products', product_jaccard, 0.1))
        
        # Calculate weighted average
        if similarities:
            total_weight = sum(weight for _, _, weight in similarities)
            weighted_similarity = sum(sim * weight for _, sim, weight in similarities) / total_weight
            return weighted_similarity
        
        return 0.0
    
    def get_hybrid_recommendations(self, user_id, preferences, limit):
        """Hybrid recommendations combining multiple signals"""
        try:
            # Get products from user's preferred categories but not purchased
            preferred_categories = list(preferences['categories'].keys())
            avoided_products = list(preferences['avoided_products'])
            purchased_products = list(preferences['preferred_products'])
            
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if preferred_categories:
                        placeholders = ','.join(['%s'] * len(preferred_categories))
                        query = f"""
                        SELECT p.product_id, p.name, p.price, p.discount_price, 
                               p.category_id, p.description, p.image_url, p.unit,
                               c.name as category_name,
                               AVG(r.rating) as avg_rating,
                               COUNT(r.review_id) as review_count,
                               COUNT(DISTINCT oi.order_id) as order_frequency
                        FROM products p
                        LEFT JOIN categories c ON p.category_id = c.category_id
                        LEFT JOIN reviews r ON p.product_id = r.product_id
                        LEFT JOIN order_items oi ON p.product_id = oi.product_id
                        LEFT JOIN orders o ON oi.order_id = o.order_id
                        WHERE p.category_id IN ({placeholders}) 
                        AND p.stock_quantity > 0
                        """
                        
                        params = preferred_categories[:]
                        
                        if purchased_products:
                            placeholders2 = ','.join(['%s'] * len(purchased_products))
                            query += f" AND p.product_id NOT IN ({placeholders2})"
                            params.extend(purchased_products)
                        
                        if avoided_products:
                            placeholders3 = ','.join(['%s'] * len(avoided_products))
                            query += f" AND p.product_id NOT IN ({placeholders3})"
                            params.extend(avoided_products)
                        
                        query += """
                        GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                                 p.category_id, p.description, p.image_url, p.unit, c.name
                        ORDER BY order_frequency DESC, avg_rating DESC
                        LIMIT %s
                        """
                        
                        params.append(limit * 2)
                        cur.execute(query, params)
                        return cur.fetchall()[:limit]
                    
        except Exception as e:
            logger.error(f"Error in hybrid recommendations: {e}")
            
        return []
    def get_best_selling_products(self, limit=10, time_window_days=30):
        """Get best selling products based on order frequency and quantity"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                           p.category_id, p.description, p.image_url, p.unit,
                           c.name as category_name,
                           COUNT(oi.order_item_id) as total_orders,
                           SUM(oi.quantity) as total_quantity_sold,
                           AVG(r.rating) as avg_rating,
                           COUNT(DISTINCT r.review_id) as review_count
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN order_items oi ON p.product_id = oi.product_id
                    LEFT JOIN orders o ON oi.order_id = o.order_id AND 
                        o.created_at >= NOW() - INTERVAL '%s days'
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE p.stock_quantity > 0
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                             p.category_id, p.description, p.image_url, p.unit, c.name
                    HAVING COUNT(oi.order_item_id) > 0
                    ORDER BY total_quantity_sold DESC, total_orders DESC, avg_rating DESC
                    LIMIT %s
                    """
                    cur.execute(query, (time_window_days, limit))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching best selling products: {e}")
            return []

    def combine_recommendations(self, recommendation_sets, limit):
        """Intelligently combine recommendations from multiple algorithms"""
        combined_scores = defaultdict(float)
        product_details = {}
        
        for algorithm_name, products, weight in recommendation_sets:
            for i, product in enumerate(products):
                product_id = product['product_id']
                # Score based on rank and algorithm weight
                rank_score = (len(products) - i) / len(products)
                combined_scores[product_id] += rank_score * weight
                
                # Store product details
                if product_id not in product_details:
                    product_details[product_id] = product
        
        # Sort by combined score and return top products
        sorted_products = sorted(
            combined_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        final_recommendations = []
        for product_id, score in sorted_products[:limit]:
            product = product_details[product_id]
            product['recommendation_score'] = round(score, 3)
            final_recommendations.append(product)
        
        return final_recommendations

    def get_category_based_recommendations(self, user_id, category_id, limit=10):
        """Get recommendations for a specific category"""
        user_profile = self.get_user_profile(user_id)
        
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get products from the specified category
                    query = """
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                           p.category_id, p.description, p.image_url, p.unit,
                           c.name as category_name,
                           AVG(r.rating) as avg_rating,
                           COUNT(r.review_id) as review_count,
                           COUNT(DISTINCT oi.order_id) as popularity_score
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    LEFT JOIN order_items oi ON p.product_id = oi.product_id
                    LEFT JOIN orders o ON oi.order_id = o.order_id
                    WHERE p.category_id = %s AND p.stock_quantity > 0
                    """
                    
                    params = [category_id]
                    
                    # Exclude already purchased products if user profile exists
                    if user_profile and user_profile['preferences']:
                        purchased_products = list(user_profile['preferences']['preferred_products'])
                        if purchased_products:
                            placeholders = ','.join(['%s'] * len(purchased_products))
                            query += f" AND p.product_id NOT IN ({placeholders})"
                            params.extend(purchased_products)
                    
                    query += """
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                             p.category_id, p.description, p.image_url, p.unit, c.name
                    ORDER BY avg_rating DESC, popularity_score DESC, review_count DESC
                    LIMIT %s
                    """
                    
                    params.append(limit)
                    cur.execute(query, params)
                    return cur.fetchall()
                    
        except Exception as e:
            logger.error(f"Error fetching category recommendations: {e}")
            return []

    def get_seasonal_recommendations(self, user_id, limit=10):
        """Get seasonal recommendations based on current time of year"""
        current_month = datetime.now().month
        
        # Define seasonal categories (you can adjust based on your categories)
        seasonal_mapping = {
            # Winter months
            12: [1, 3, 5],  # Fruits, Bakery, Household (hot beverages, warm foods)
            1: [1, 3, 5],
            2: [1, 3, 5],
            # Spring months
            3: [1, 2],      # Fruits, Dairy (fresh produce)
            4: [1, 2],
            5: [1, 2],
            # Summer months
            6: [1, 4],      # Fruits, Snacks & Beverages (cooling items)
            7: [1, 4],
            8: [1, 4],
            # Monsoon/Fall months
            9: [3, 4, 5],   # Bakery, Snacks, Household (comfort foods)
            10: [3, 4, 5],
            11: [3, 4, 5],
        }
        
        seasonal_categories = seasonal_mapping.get(current_month, [1, 2, 3, 4, 5])
        
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    placeholders = ','.join(['%s'] * len(seasonal_categories))
                    query = f"""
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                        p.category_id, p.description, p.image_url, p.unit,
                        c.name as category_name,
                        COALESCE(AVG(r.rating), 0) as avg_rating,
                        COUNT(r.review_id) as review_count,
                        COALESCE(COUNT(DISTINCT oi.order_id), 0) as seasonal_popularity
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    LEFT JOIN order_items oi ON p.product_id = oi.product_id
                    LEFT JOIN orders o ON oi.order_id = o.order_id
                    WHERE p.category_id IN ({placeholders}) AND p.stock_quantity > 0
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                            p.category_id, p.description, p.image_url, p.unit, c.name
                    ORDER BY seasonal_popularity DESC, avg_rating DESC
                    LIMIT %s
                    """
                    
                    params = seasonal_categories + [limit]
                    cur.execute(query, params)
                    return cur.fetchall()
                    
        except Exception as e:
            logger.error(f"Error fetching seasonal recommendations: {e}")
            return []

# Flask API endpoints
app = Flask(__name__)
CORS(app)

# Initialize recommendation system
rec_system = EnhancedRecommendationSystem(DB_CONFIG)

@app.route('/recommendations/<int:user_id>', methods=['GET'])
def get_recommendations(user_id):
    """Get personalized recommendations for a user"""
    try:
        limit = int(request.args.get('limit', 20))
        rec_type = request.args.get('type', 'personalized')
        
        if rec_type == 'trending':
            products = rec_system.get_trending_products(limit)
            result = {
                'type': 'trending',
                'products': products,
                'message': 'Currently trending products',
                'confidence': 0.8
            }
        elif rec_type == 'seasonal':
            products = rec_system.get_seasonal_recommendations(user_id, limit)
            result = {
                'type': 'seasonal',
                'products': products,
                'message': 'Seasonal recommendations for you',
                'confidence': 0.7
            }
        else:
            result = rec_system.get_personalized_recommendations(user_id, limit)
        
        return jsonify({
            'success': True,
            'recommendations': result
        })
        
    except Exception as e:
        logger.error(f"Error getting recommendations for user {user_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get recommendations'
        }), 500

@app.route('/recommendations/<int:user_id>/category/<int:category_id>', methods=['GET'])
def get_category_recommendations(user_id, category_id):
    """Get recommendations for a specific category"""
    try:
        limit = int(request.args.get('limit', 10))
        products = rec_system.get_category_based_recommendations(user_id, category_id, limit)
        
        return jsonify({
            'success': True,
            'products': products,
            'category_id': category_id
        })
        
    except Exception as e:
        logger.error(f"Error getting category recommendations: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get category recommendations'
        }), 500

@app.route('/trending', methods=['GET'])
def get_trending():
    """Get trending products"""
    try:
        limit = int(request.args.get('limit', 10))
        time_window = int(request.args.get('days', 7))
        
        products = rec_system.get_trending_products(limit, time_window)
        
        return jsonify({
            'success': True,
            'products': products,
            'time_window_days': time_window
        })
        
    except Exception as e:
        logger.error(f"Error getting trending products: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get trending products'
        }), 500

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_text_sentiment():
    """Analyze sentiment of provided text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        fallback_rating = data.get('rating')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        result = rec_system.analyze_sentiment(text, fallback_rating)
        
        return jsonify({
            'success': True,
            'sentiment': {
                'sentiment_label': result['sentiment_label'],
                'sentiment_score': result['sentiment_score'],
                'confidence': 0.9  # Add actual confidence if available
            }
        })
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to analyze sentiment'
        }), 500

@app.route('/user-profile/<int:user_id>', methods=['GET'])
def get_user_profile_api(user_id):
    """Get detailed user profile for recommendations"""
    try:
        profile = rec_system.get_user_profile(user_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'User profile not found'
            }), 404
        
        # Get accurate order statistics
        order_stats = rec_system.get_user_order_statistics(user_id)
        
        # Sanitize profile for API response (remove sensitive data)
        sanitized_profile = {
            'user_info': {
                'user_id': profile['user_info']['user_id'],
                'name': profile['user_info'].get('name'),
                'created_at': profile['user_info'].get('created_at')
            },
            'purchase_statistics': {
                'total_orders': order_stats['total_orders'],  # Now counts actual orders
                'delivered_orders': order_stats['delivered_orders'],
                'pending_orders': order_stats['pending_orders'],
                'cancelled_orders': order_stats['cancelled_orders'],
                'total_spent': order_stats['total_spent'],
                'unique_products_purchased': order_stats['unique_products_purchased'],
                'total_reviews': len(profile['reviews']),
                'preferred_categories': dict(list(profile['preferences']['categories'].items())[:5]) if profile['preferences'] else {},
                'avg_sentiment': profile['preferences']['sentiment_profile']['avg_sentiment'] if profile['preferences'] else 5.0,
                'first_order_date': order_stats['first_order_date'],
                'last_order_date': order_stats['last_order_date']
            }
        }
        
        return jsonify({
            'success': True,
            'profile': sanitized_profile
        })
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get user profile'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Run on different port from main app