import os
import psycopg2
from psycopg2.extras import RealDictCursor
from collections import defaultdict
import numpy as np
from flask import Flask, request, jsonify
import logging

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
    'host': 'localhost',
    'database': 'ecommerce',
    'user': 'sanskar',
    'password': 'hatebitches1',
    'port': 5432
}

class RecommendationSystem:
    def __init__(self, db_config, model_dir='enhanced_sentiment_model'):
        self.db_config = db_config
        self.model_dir = model_dir
        self.sentiment_model = None
        self.tokenizer = None
        self.label_encoder = None
        self.preprocessor = None
        self.max_len = None
        
        # Load sentiment model if available
        if SENTIMENT_AVAILABLE:
            try:
                self.sentiment_model, self.tokenizer, self.label_encoder, self.preprocessor, self.max_len = load_model_complete(model_dir)
                logger.info("Sentiment model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load sentiment model: {e}")
                self.sentiment_model = None
        else:
            logger.info("Sentiment model not available, using rating-based fallback")
            
        self.product_cache = {}
        self.user_cache = {}
        
    def connect_db(self):
        """Create database connection with better error handling"""
        try:
            return psycopg2.connect(**self.db_config)
        except psycopg2.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def get_user_purchase_history(self, user_id):
        """Get user's purchase history with product details"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT DISTINCT 
                        p.product_id, p.name, p.price, p.category_id, p.description,
                        oi.quantity, oi.price as purchase_price,
                        o.created_at, o.status
                    FROM orders o
                    JOIN order_items oi ON o.order_id = oi.order_id
                    JOIN products p ON oi.product_id = p.product_id
                    WHERE o.user_id = %s AND o.status = 'delivered'
                    ORDER BY o.created_at DESC
                    """
                    cur.execute(query, (user_id,))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching purchase history for user {user_id}: {e}")
            return []
    
    def get_user_reviews_and_ratings(self, user_id):
        """Get user's reviews and ratings"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT r.product_id, r.rating, r.comment, r.created_at,
                           p.name, p.category_id
                    FROM reviews r
                    JOIN products p ON r.product_id = p.product_id
                    WHERE r.user_id = %s
                    ORDER BY r.created_at DESC
                    """
                    cur.execute(query, (user_id,))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching user reviews for user {user_id}: {e}")
            return []
    
    def analyze_sentiment(self, comment, fallback_rating=None):
        """Analyze sentiment with proper fallback handling"""
        if not comment or comment.strip() == '':
            if fallback_rating:
                return self.get_sentiment_from_rating(fallback_rating)
            return {'sentiment_score': 5.0, 'sentiment_label': 'neutral'}
        
        # Try AI-based sentiment analysis
        if self.sentiment_model and SENTIMENT_AVAILABLE:
            try:
                return predict_sentiment_aligned(
                    comment, 
                    self.sentiment_model, 
                    self.tokenizer,
                    self.label_encoder, 
                    self.preprocessor, 
                    self.max_len
                )
            except Exception as e:
                logger.warning(f"Sentiment analysis failed: {e}")
        
        # Fallback to rating-based sentiment
        if fallback_rating:
            return self.get_sentiment_from_rating(fallback_rating)
        
        # Last resort - neutral sentiment
        return {'sentiment_score': 5.0, 'sentiment_label': 'neutral'}
    
    def get_sentiment_from_rating(self, rating):
        """Convert numeric rating to sentiment"""
        sentiment_mappings = {
            1: {'sentiment_score': 1.0, 'sentiment_label': 'highly negative'},
            2: {'sentiment_score': 3.0, 'sentiment_label': 'negative'},
            3: {'sentiment_score': 5.0, 'sentiment_label': 'neutral'},
            4: {'sentiment_score': 7.0, 'sentiment_label': 'positive'},
            5: {'sentiment_score': 9.0, 'sentiment_label': 'highly positive'}
        }
        return sentiment_mappings.get(rating, {'sentiment_score': 5.0, 'sentiment_label': 'neutral'})
    
    def get_product_reviews_with_sentiment(self, product_id=None):
        """Get product reviews with sentiment analysis"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if product_id:
                        query = """
                        SELECT r.review_id, r.product_id, r.user_id, r.rating, 
                               r.comment, r.created_at, p.name as product_name
                        FROM reviews r
                        JOIN products p ON r.product_id = p.product_id
                        WHERE r.product_id = %s
                        ORDER BY r.created_at DESC
                        """
                        cur.execute(query, (product_id,))
                    else:
                        query = """
                        SELECT r.review_id, r.product_id, r.user_id, r.rating, 
                               r.comment, r.created_at, p.name as product_name
                        FROM reviews r
                        JOIN products p ON r.product_id = p.product_id
                        ORDER BY r.created_at DESC
                        """
                        cur.execute(query)
                    
                    reviews = cur.fetchall()
            
            # Process sentiment for each review
            for review in reviews:
                sentiment_result = self.analyze_sentiment(review['comment'], review['rating'])
                review.update(sentiment_result)
            
            return reviews
        except Exception as e:
            logger.error(f"Error fetching product reviews: {e}")
            return []
    
    def get_best_selling_products(self, limit=10, category_id=None):
        """Get best selling products based on order frequency and quantity"""
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    base_query = """
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                           p.category_id, p.description, p.image_url, p.unit,
                           COUNT(oi.order_item_id) as order_count,
                           SUM(oi.quantity) as total_quantity_sold,
                           AVG(r.rating) as avg_rating,
                           COUNT(r.review_id) as review_count
                    FROM products p
                    LEFT JOIN order_items oi ON p.product_id = oi.product_id
                    LEFT JOIN orders o ON oi.order_id = o.order_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE (o.status = 'delivered' OR o.status IS NULL)
                    """
                    
                    if category_id:
                        base_query += " AND p.category_id = %s"
                        params = (category_id,)
                    else:
                        params = ()
                    
                    base_query += """
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                             p.category_id, p.description, p.image_url, p.unit
                    ORDER BY total_quantity_sold DESC NULLS LAST, 
                             order_count DESC NULLS LAST,
                             avg_rating DESC NULLS LAST
                    LIMIT %s
                    """
                    
                    cur.execute(base_query, params + (limit,))
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching best selling products: {e}")
            return []
    
    def calculate_user_preferences(self, user_id):
        """Calculate user preferences based on purchase history and reviews"""
        purchase_history = self.get_user_purchase_history(user_id)
        reviews = self.get_user_reviews_and_ratings(user_id)
        
        if not purchase_history and not reviews:
            return None
        
        preferences = {
            'categories': defaultdict(float),
            'price_range': {'min': 0, 'max': float('inf')},
            'sentiment_preference': 0.0,
            'preferred_products': set(),
            'avg_rating_given': 0.0
        }
        
        # Analyze purchase history
        category_purchases = defaultdict(int)
        prices = []
        
        for purchase in purchase_history:
            category_purchases[purchase['category_id']] += purchase['quantity']
            prices.append(float(purchase['purchase_price']))
            preferences['preferred_products'].add(purchase['product_id'])
        
        # Calculate category preferences
        total_purchases = sum(category_purchases.values())
        if total_purchases > 0:
            for category_id, count in category_purchases.items():
                preferences['categories'][category_id] = count / total_purchases
        
        # Calculate price range preferences
        if prices:
            preferences['price_range']['min'] = min(prices) * 0.8  # 20% below minimum
            preferences['price_range']['max'] = max(prices) * 1.2  # 20% above maximum
        
        # Analyze reviews and ratings
        if reviews:
            total_sentiment = 0
            total_ratings = 0
            
            for review in reviews:
                total_ratings += review['rating']
                sentiment_result = self.analyze_sentiment(review['comment'], review['rating'])
                total_sentiment += sentiment_result['sentiment_score']
            
            preferences['avg_rating_given'] = total_ratings / len(reviews)
            preferences['sentiment_preference'] = total_sentiment / len(reviews)
        
        return preferences
    
    def get_similar_users(self, user_id, limit=10):
        """Find users with similar preferences"""
        target_preferences = self.calculate_user_preferences(user_id)
        if not target_preferences:
            return []
        
        try:
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get all users who have made purchases or reviews
                    query = """
                    SELECT DISTINCT user_id FROM (
                        SELECT user_id FROM orders WHERE status = 'delivered'
                        UNION
                        SELECT user_id FROM reviews
                    ) AS active_users
                    WHERE user_id != %s
                    """
                    cur.execute(query, (user_id,))
                    other_users = [row['user_id'] for row in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error fetching similar users: {e}")
            return []
        
        similar_users = []
        
        for other_user_id in other_users:
            other_preferences = self.calculate_user_preferences(other_user_id)
            if not other_preferences:
                continue
            
            # Calculate similarity score
            similarity = self.calculate_preference_similarity(target_preferences, other_preferences)
            if similarity > 0.3:  # Threshold for similarity
                similar_users.append((other_user_id, similarity))
        
        # Sort by similarity and return top users
        similar_users.sort(key=lambda x: x[1], reverse=True)
        return similar_users[:limit]
    
    def calculate_preference_similarity(self, pref1, pref2):
        """Calculate similarity between two user preference profiles"""
        # Category similarity
        categories1 = set(pref1['categories'].keys())
        categories2 = set(pref2['categories'].keys())
        
        if not categories1 or not categories2:
            category_similarity = 0
        else:
            common_categories = categories1.intersection(categories2)
            if not common_categories:
                category_similarity = 0
            else:
                category_sim_scores = []
                for cat in common_categories:
                    cat_sim = 1 - abs(pref1['categories'][cat] - pref2['categories'][cat])
                    category_sim_scores.append(cat_sim)
                category_similarity = np.mean(category_sim_scores) if category_sim_scores else 0
        
        # Price range similarity
        price_overlap = min(pref1['price_range']['max'], pref2['price_range']['max']) - \
                       max(pref1['price_range']['min'], pref2['price_range']['min'])
        price_union = max(pref1['price_range']['max'], pref2['price_range']['max']) - \
                     min(pref1['price_range']['min'], pref2['price_range']['min'])
        
        price_similarity = max(0, price_overlap / price_union) if price_union > 0 else 0
        
        # Rating similarity
        rating_similarity = 1 - abs(pref1['avg_rating_given'] - pref2['avg_rating_given']) / 5.0
        
        # Weighted combination
        total_similarity = (0.5 * category_similarity + 
                          0.3 * price_similarity + 
                          0.2 * rating_similarity)
        
        return total_similarity
    
    def get_content_based_recommendations(self, user_id, limit=10):
        """Generate content-based recommendations"""
        preferences = self.calculate_user_preferences(user_id)
        if not preferences:
            return []
        
        try:
            # Get products user hasn't purchased
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    purchased_products = list(preferences['preferred_products'])
                    
                    query = """
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                           p.category_id, p.description, p.image_url, p.unit,
                           AVG(r.rating) as avg_rating,
                           COUNT(r.review_id) as review_count
                    FROM products p
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE p.stock_quantity > 0
                    """
                    
                    params = []
                    if purchased_products:
                        placeholders = ','.join(['%s'] * len(purchased_products))
                        query += f" AND p.product_id NOT IN ({placeholders})"
                        params.extend(purchased_products)
                    
                    query += """
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                             p.category_id, p.description, p.image_url, p.unit
                    """
                    
                    cur.execute(query, params)
                    candidate_products = cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching content-based recommendations: {e}")
            return []
        
        # Score products based on user preferences
        scored_products = []
        
        for product in candidate_products:
            score = 0
            
            # Category preference score
            category_score = preferences['categories'].get(product['category_id'], 0)
            score += category_score * 0.4
            
            # Price preference score
            product_price = float(product['discount_price'] or product['price'])
            if (preferences['price_range']['min'] <= product_price <= preferences['price_range']['max']):
                price_score = 1.0
            else:
                price_diff = min(abs(product_price - preferences['price_range']['min']),
                               abs(product_price - preferences['price_range']['max']))
                max_price_range = preferences['price_range']['max'] - preferences['price_range']['min']
                price_score = max(0, 1 - price_diff / max_price_range) if max_price_range > 0 else 0
            score += price_score * 0.3
            
            # Rating score
            if product['avg_rating']:
                rating_score = float(product['avg_rating']) / 5.0
                score += rating_score * 0.3
            
            scored_products.append((product, score))
        
        # Sort by score and return top recommendations
        scored_products.sort(key=lambda x: x[1], reverse=True)
        return [product for product, score in scored_products[:limit]]
    
    def get_collaborative_recommendations(self, user_id, limit=10):
        """Generate collaborative filtering recommendations"""
        similar_users = self.get_similar_users(user_id)
        if not similar_users:
            return []
        
        try:
            # Get products purchased by similar users
            similar_user_ids = [user_id for user_id, similarity in similar_users]
            
            with self.connect_db() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    placeholders = ','.join(['%s'] * len(similar_user_ids))
                    query = f"""
                    SELECT p.product_id, p.name, p.price, p.discount_price, 
                           p.category_id, p.description, p.image_url, p.unit,
                           COUNT(DISTINCT o.user_id) as user_count,
                           SUM(oi.quantity) as total_quantity,
                           AVG(r.rating) as avg_rating
                    FROM products p
                    JOIN order_items oi ON p.product_id = oi.product_id
                    JOIN orders o ON oi.order_id = o.order_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE o.user_id IN ({placeholders}) 
                    AND o.status = 'delivered'
                    AND p.stock_quantity > 0
                    GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                             p.category_id, p.description, p.image_url, p.unit
                    ORDER BY user_count DESC, total_quantity DESC, avg_rating DESC
                    LIMIT %s
                    """
                    
                    cur.execute(query, similar_user_ids + [limit])
                    return cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching collaborative recommendations: {e}")
            return []
    
    def get_recommendations(self, user_id, limit=20):
        """Main recommendation function that combines multiple approaches"""
        # Check if user exists and has history
        user_preferences = self.calculate_user_preferences(user_id)
        
        if not user_preferences:
            # New user - return best selling products
            return {
                'type': 'best_selling',
                'products': self.get_best_selling_products(limit),
                'message': 'Welcome! Here are our most popular products.'
            }
        
        # Existing user - generate personalized recommendations
        content_recs = self.get_content_based_recommendations(user_id, limit // 2)
        collab_recs = self.get_collaborative_recommendations(user_id, limit // 2)
        
        # Combine recommendations (avoiding duplicates)
        seen_products = set()
        combined_recs = []
        
        # Add content-based recommendations first
        for product in content_recs:
            if product['product_id'] not in seen_products:
                combined_recs.append(product)
                seen_products.add(product['product_id'])
        
        # Add collaborative recommendations
        for product in collab_recs:
            if product['product_id'] not in seen_products and len(combined_recs) < limit:
                combined_recs.append(product)
                seen_products.add(product['product_id'])
        
        # Fill remaining slots with best sellers if needed
        if len(combined_recs) < limit:
            best_sellers = self.get_best_selling_products(limit - len(combined_recs))
            for product in best_sellers:
                if product['product_id'] not in seen_products and len(combined_recs) < limit:
                    combined_recs.append(product)
                    seen_products.add(product['product_id'])
        
        return {
            'type': 'personalized',
            'products': combined_recs,
            'message': 'Recommendations based on your preferences and similar users.'
        }

# Flask API endpoints
app = Flask(__name__)

# Initialize recommendation system
try:
    rec_system = RecommendationSystem(DB_CONFIG)
    logger.info("Recommendation system initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize recommendation system: {e}")
    rec_system = None

@app.route('/api/recommendations/<int:user_id>', methods=['GET'])
def get_user_recommendations(user_id):
    """Get personalized recommendations for a user"""
    if not rec_system:
        return jsonify({
            'success': False,
            'error': 'Recommendation system not available'
        }), 503
    
    try:
        limit = request.args.get('limit', 20, type=int)
        limit = min(limit, 100)  # Cap the limit for performance
        
        recommendations = rec_system.get_recommendations(user_id, limit)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
    
    except Exception as e:
        logger.error(f"Error in get_user_recommendations: {e}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching recommendations'
        }), 500

@app.route('/api/best-selling', methods=['GET'])
def get_best_selling():
    """Get best selling products"""
    if not rec_system:
        return jsonify({
            'success': False,
            'error': 'Recommendation system not available'
        }), 503
    
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 100)  # Cap the limit for performance
        category_id = request.args.get('category_id', type=int)
        
        products = rec_system.get_best_selling_products(limit, category_id)
        
        return jsonify({
            'success': True,
            'products': products
        })
    
    except Exception as e:
        logger.error(f"Error in get_best_selling: {e}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching best selling products'
        }), 500

@app.route('/api/similar-products/<int:product_id>', methods=['GET'])
def get_similar_products(product_id):
    """Get products similar to a given product"""
    if not rec_system:
        return jsonify({
            'success': False,
            'error': 'Recommendation system not available'
        }), 503
    
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Cap the limit for performance
        
        # Get product details
        with rec_system.connect_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
                target_product = cur.fetchone()
                
                if not target_product:
                    return jsonify({'success': False, 'error': 'Product not found'}), 404
                
                # Get similar products from same category
                query = """
                SELECT p.product_id, p.name, p.price, p.discount_price, 
                       p.category_id, p.description, p.image_url, p.unit,
                       AVG(r.rating) as avg_rating,
                       COUNT(r.review_id) as review_count
                FROM products p
                LEFT JOIN reviews r ON p.product_id = r.product_id
                WHERE p.category_id = %s AND p.product_id != %s AND p.stock_quantity > 0
                GROUP BY p.product_id, p.name, p.price, p.discount_price, 
                         p.category_id, p.description, p.image_url, p.unit
                ORDER BY avg_rating DESC NULLS LAST, review_count DESC
                LIMIT %s
                """
                
                cur.execute(query, (target_product['category_id'], product_id, limit))
                similar_products = cur.fetchall()
        
        return jsonify({
            'success': True,
            'products': similar_products if similar_products else []
        })
    
    except Exception as e:
        logger.error(f"Error in get_similar_products: {e}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching similar products'
        }), 500

@app.route('/api/product-reviews/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    """Get product reviews with sentiment analysis"""
    if not rec_system:
        return jsonify({
            'success': False,
            'error': 'Recommendation system not available'
        }), 503
    
    try:
        reviews = rec_system.get_product_reviews_with_sentiment(product_id)
        
        return jsonify({
            'success': True,
            'reviews': reviews,
            'sentiment_available': rec_system.sentiment_model is not None
        })
    
    except Exception as e:
        logger.error(f"Error in get_product_reviews: {e}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while fetching product reviews'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy', 
        'service': 'recommendation-system',
        'sentiment_model_available': rec_system.sentiment_model is not None if rec_system else False
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)