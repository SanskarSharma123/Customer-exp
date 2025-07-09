import pandas as pd
import numpy as np
import asyncpg
from typing import Dict, List, Tuple
import asyncio
import json
import sys
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

class ImprovedDynamicPricing:
    def __init__(self):
        self.scaler = RobustScaler()
        self.rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.gb_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        self.feature_importance = {}
        self.market_elasticity = {}
        self.model_performance = {}
        self.price_constraints = {
            'max_increase': 0.15,
            'max_decrease': 0.20,
            'min_confidence': 0.3,
            'market_position_weight': 0.4,
        }
        
    async def fetch_enhanced_data(self):
        """Fetch comprehensive data with better market context"""
        try:
            conn = await asyncpg.connect(
                database="postgres2",
                user="postgres",
                password="hatebitches1",
                host="localhost",
                port=5432
            )
            
            query = """
            WITH product_metrics AS (
                SELECT 
                    p.product_id,
                    p.name,
                    p.price,
                    p.category_id,
                    COALESCE(p.discount_price, p.price) as min_price,
                    COALESCE(p.max_price, p.price * 1.5) as max_price,
                    p.stock_quantity,
                    p.created_at,
                    
                    -- Review metrics with better defaults
                    COALESCE(AVG(r.rating), 3.5) as avg_rating,
                    COALESCE(STDDEV(r.rating), 0.8) as rating_std,
                    COALESCE(COUNT(r.review_id), 0) as review_count,
                    COALESCE(AVG(r.sentiment_score), 5.5) as avg_sentiment,
                    COALESCE(STDDEV(r.sentiment_score), 1.2) as sentiment_std,
                    
                    -- Sales metrics
                    COALESCE(SUM(oi.quantity), 0) as total_sales,
                    COALESCE(COUNT(DISTINCT oi.order_id), 0) as order_count,
                    COALESCE(AVG(oi.quantity), 0) as avg_order_quantity,
                    
                    -- Time-based metrics
                    COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN oi.quantity ELSE 0 END), 0) as sales_last_7_days,
                    COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN oi.quantity ELSE 0 END), 0) as sales_last_30_days,
                    COALESCE(COUNT(CASE WHEN r.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN r.review_id END), 0) as recent_reviews,
                   COALESCE(COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '1 hour' THEN o.user_id END), 0) as unique_customers_last_hour,
COALESCE(COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '24 hours' THEN o.user_id END), 0) as unique_customers_last_24h,
        COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '1 hour' THEN oi.quantity ELSE 0 END), 0) as orders_last_hour,
        COALESCE(COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '1 hour' THEN o.order_id END), 0) as order_count_last_hour,
                    -- Product age in days
                    (CURRENT_DATE::date - p.created_at::date) as product_age_days
                    
                FROM products p
                LEFT JOIN reviews r ON p.product_id = r.product_id
                LEFT JOIN order_items oi ON p.product_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.order_id
                WHERE p.price > 0
                GROUP BY p.product_id, p.name, p.price, p.category_id, p.discount_price, p.max_price, p.stock_quantity, p.created_at
            ),
            category_metrics AS (
                SELECT 
                    category_id,
                    AVG(price) as category_avg_price,
                    STDDEV(price) as category_price_std,
                    AVG(total_sales) as category_avg_sales,
                    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price) as category_q1_price,
                    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price) as category_q3_price,
                    COUNT(*) as category_product_count
                FROM product_metrics
                GROUP BY category_id
            ),
            competitive_metrics AS (
                SELECT 
                    pm.product_id,
                    pm.price,
                    cm.category_avg_price,
                    cm.category_price_std,
                    cm.category_avg_sales,
                    cm.category_q1_price,
                    cm.category_q3_price,
                    CASE 
                        WHEN cm.category_price_std > 0 THEN (pm.price - cm.category_avg_price) / cm.category_price_std
                        ELSE 0
                    END as price_z_score,
                    CASE 
                        WHEN cm.category_avg_sales > 0 THEN (pm.total_sales - cm.category_avg_sales) / cm.category_avg_sales
                        ELSE 0
                    END as sales_vs_category
                FROM product_metrics pm
                JOIN category_metrics cm ON pm.category_id = cm.category_id
            )
            SELECT 
                pm.*,
                comp.category_avg_price,
                comp.category_price_std,
                comp.category_q1_price,
                comp.category_q3_price,
                COALESCE(comp.price_z_score, 0) as price_z_score,
                COALESCE(comp.sales_vs_category, 0) as sales_vs_category,
                
                -- Market position metrics (improved)
                CASE 
                    WHEN pm.price <= comp.category_q1_price THEN 'budget'
                    WHEN pm.price >= comp.category_q3_price THEN 'premium'
                    ELSE 'mid_range'
                END as market_segment,
                
                -- Performance metrics
                CASE 
                    WHEN pm.stock_quantity > 0 AND pm.sales_last_30_days > 0 
                    THEN pm.sales_last_30_days / pm.stock_quantity
                    ELSE 0
                END as inventory_turnover,
                
                -- Trend metrics (more conservative)
                CASE 
                    WHEN pm.sales_last_30_days > 0 
                    THEN LEAST(pm.sales_last_7_days / (pm.sales_last_30_days / 4.0), 3.0)
                    ELSE 1.0
                END as sales_trend,
                
                -- Competition density
                CASE 
                    WHEN comp.category_avg_price > 0 
                    THEN ABS(pm.price - comp.category_avg_price) / comp.category_avg_price
                    ELSE 0
                END as price_deviation
                
            FROM product_metrics pm
            JOIN competitive_metrics comp ON pm.product_id = comp.product_id
            ORDER BY pm.product_id
            """
            
            records = await conn.fetch(query)
            await conn.close()
            
            if not records:
                print("No data returned from enhanced query", file=sys.stderr)
                return None
                
            df = pd.DataFrame([dict(record) for record in records])
            
            # Convert numeric columns
            # Convert numeric columns
            numeric_columns = [
                'price', 'min_price', 'max_price', 'stock_quantity', 'avg_rating', 'rating_std',
                'review_count', 'avg_sentiment', 'sentiment_2', 'total_sales', 'order_count',
                'avg_order_quantity', 'sales_last_7_days', 'sales_last_30_days', 'recent_reviews',
                'product_age_days', 'category_avg_price', 'category_price_std', 'category_q1_price',
                'category_q3_price', 'price_z_score', 'sales_vs_category', 'inventory_turnover',
                'sales_trend', 'price_deviation',
                # ADD THESE NEW COLUMNS:
                'unique_customers_last_hour', 'unique_customers_last_24h', 'orders_last_hour', 'order_count_last_hour'
            ]
            
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Handle infinite values and outliers more conservatively
            df = df.replace([np.inf, -np.inf], np.nan)
            numeric_df = df.select_dtypes(include=[np.number])
            df[numeric_df.columns] = numeric_df.fillna(numeric_df.median())

            # Cap extreme values
            df['sales_trend'] = np.clip(df['sales_trend'], 0.1, 3.0)
            df['price_z_score'] = np.clip(df['price_z_score'], -3, 3)
            df['sales_vs_category'] = np.clip(df['sales_vs_category'], -2, 2)
            
            print(f"Enhanced DataFrame shape: {df.shape}", file=sys.stderr)
            print(f"Market segments: {df['market_segment'].value_counts().to_dict()}", file=sys.stderr)
            
            return df
            
        except Exception as e:
            print(f"Enhanced database error: {e}", file=sys.stderr)
            return None

    def calculate_market_equilibrium(self, df: pd.DataFrame) -> Dict:
        """Calculate market equilibrium points for different segments"""
        equilibrium = {}
        
        for segment in df['market_segment'].unique():
            segment_data = df[df['market_segment'] == segment]
            
            if len(segment_data) > 3:
                # Calculate optimal price range based on sales performance
                high_performers = segment_data[segment_data['total_sales'] > segment_data['total_sales'].quantile(0.7)]
                
                if len(high_performers) > 0:
                    equilibrium[segment] = {
                        'optimal_price_range': (
                            high_performers['price'].quantile(0.25),
                            high_performers['price'].quantile(0.75)
                        ),
                        'avg_performance': high_performers['total_sales'].mean(),
                        'elasticity': self.calculate_segment_elasticity(segment_data)
                    }
                else:
                    equilibrium[segment] = {
                        'optimal_price_range': (
                            segment_data['price'].quantile(0.4),
                            segment_data['price'].quantile(0.6)
                        ),
                        'avg_performance': segment_data['total_sales'].mean(),
                        'elasticity': -0.8
                    }
            else:
                equilibrium[segment] = {
                    'optimal_price_range': (df['price'].quantile(0.4), df['price'].quantile(0.6)),
                    'avg_performance': df['total_sales'].mean(),
                    'elasticity': -0.8
                }
        
        return equilibrium

    def calculate_segment_elasticity(self, segment_data: pd.DataFrame) -> float:
        """Calculate price elasticity for a market segment"""
        if len(segment_data) < 5:
            return -0.8
            
        # Sort by price and calculate elasticity
        sorted_data = segment_data.sort_values('price')
        
        # Calculate correlation between price and sales
        if sorted_data['price'].std() > 0 and sorted_data['total_sales'].std() > 0:
            correlation = np.corrcoef(sorted_data['price'], sorted_data['total_sales'])[0, 1]
            # Convert correlation to elasticity estimate
            elasticity = -abs(correlation) * 1.2  # Make it negative (law of demand)
            return np.clip(elasticity, -2.0, -0.2)
        
        return -0.8

    def create_balanced_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create balanced features that don't bias towards price increases"""
        df = df.copy()
        
        # Conservative interaction features
        df['quality_score'] = (df['avg_rating'] * 0.6 + df['avg_sentiment'] * 0.4) / 10
        df['market_position'] = df['price_z_score'] * 0.5  # Reduced weight
        df['demand_signal'] = np.log1p(df['total_sales']) * df['quality_score']
        
        # Competitive pressure (this should reduce prices when high)
        df['competitive_pressure'] = df['price_deviation'] * (1 + df['category_price_std'] / df['category_avg_price'])
        
        # Inventory health (balanced approach)
        df['inventory_health'] = np.where(
            df['stock_quantity'] > 0,
            np.clip(df['sales_last_30_days'] / df['stock_quantity'], 0, 2),
            0
        )
        
        # Product maturity (older products might need price adjustments)
        df['product_maturity'] = np.clip(df['product_age_days'] / 365, 0, 5)
        
        # Performance relative to category
        df['relative_performance'] = np.clip(df['sales_vs_category'], -1, 1)
        
        # Market confidence (conservative)
        df['market_confidence'] = np.clip(
            (np.log1p(df['review_count']) * 0.1 + df['quality_score'] * 0.3) / 0.4,
            0, 1
        )
        
        # ADD THESE NEW FEATURES HERE:
        # Real-time demand pressure
        df['demand_pressure'] = np.where(
            df['unique_customers_last_hour'] > 1,
            np.log1p(df['unique_customers_last_hour']) * 0.3 + 
            np.log1p(df['orders_last_hour']) * 0.2,
            0
        )
        
        # Demand velocity (how fast demand is growing)
        df['demand_velocity'] = np.where(
            df['unique_customers_last_24h'] > 0,
            (df['unique_customers_last_hour'] * 24) / (df['unique_customers_last_24h'] + 1),
            0
        )
        
        return df

    def prepare_ml_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Prepare features for machine learning models"""
        feature_columns = [
            'avg_rating', 'rating_std', 'review_count', 'avg_sentiment', 'sentiment_std',
            'total_sales', 'order_count', 'avg_order_quantity', 'sales_last_7_days',
            'sales_last_30_days', 'recent_reviews', 'product_age_days',
            'category_avg_price', 'category_price_std', 'category_q1_price',
            'category_q3_price', 'price_z_score', 'sales_vs_category',
            'inventory_turnover', 'sales_trend', 'price_deviation',
            'quality_score', 'market_position', 'demand_signal',
            'competitive_pressure', 'inventory_health', 'product_maturity',
            'relative_performance', 'market_confidence', 'stock_quantity',
            # ADD THESE NEW FEATURES:
            'demand_pressure', 'demand_velocity', 'unique_customers_last_hour', 'unique_customers_last_24h'
        ]
        
        # Add categorical features as dummy variables
        df_encoded = pd.get_dummies(df, columns=['market_segment'], prefix='segment')
        # Keep the original market_segment column
        df_encoded['market_segment'] = df['market_segment']
        
        # Get all segment columns
        segment_columns = [col for col in df_encoded.columns if col.startswith('segment_')]
        feature_columns.extend(segment_columns)
        
        # Ensure all feature columns exist
        feature_columns = [col for col in feature_columns if col in df_encoded.columns]
        
        return df_encoded, feature_columns

    def train_models(self, df: pd.DataFrame, feature_columns: List[str]) -> Dict:
        """Train both RandomForest and GradientBoosting models"""
        # Filter data with sufficient sales history for training
        training_data = df[df['total_sales'] > 0].copy()
        
        if len(training_data) < 10:
            print("Insufficient training data, using all available data", file=sys.stderr)
            training_data = df.copy()
        
        # Prepare features and target
        X = training_data[feature_columns].fillna(0)
        y = training_data['price']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        models = {}
        
        # Train Random Forest
        try:
            self.rf_model.fit(X_train, y_train)
            rf_pred = self.rf_model.predict(X_test)
            rf_score = r2_score(y_test, rf_pred)
            rf_mae = mean_absolute_error(y_test, rf_pred)
            
            models['RandomForest'] = {
                'model': self.rf_model,
                'r2_score': rf_score,
                'mae': rf_mae,
                'feature_importance': dict(zip(feature_columns, self.rf_model.feature_importances_))
            }
            print(f"Random Forest - R2: {rf_score:.3f}, MAE: {rf_mae:.3f}", file=sys.stderr)
        except Exception as e:
            print(f"Random Forest training error: {e}", file=sys.stderr)
        
        # Train Gradient Boosting
        try:
            self.gb_model.fit(X_train, y_train)
            gb_pred = self.gb_model.predict(X_test)
            gb_score = r2_score(y_test, gb_pred)
            gb_mae = mean_absolute_error(y_test, gb_pred)
            
            models['GradientBoosting'] = {
                'model': self.gb_model,
                'r2_score': gb_score,
                'mae': gb_mae,
                'feature_importance': dict(zip(feature_columns, self.gb_model.feature_importances_))
            }
            print(f"Gradient Boosting - R2: {gb_score:.3f}, MAE: {gb_mae:.3f}", file=sys.stderr)
        except Exception as e:
            print(f"Gradient Boosting training error: {e}", file=sys.stderr)
        
        self.model_performance = models
        return models

    def predict_with_models(self, row: pd.Series, feature_columns: List[str], models: Dict) -> Dict:
        """Make predictions with both models and choose the best one"""
        features = row[feature_columns].fillna(0).values.reshape(1, -1)
        features_scaled = self.scaler.transform(features)
        
        predictions = {}
        
        for model_name, model_info in models.items():
            try:
                model = model_info['model']
                pred_price = model.predict(features_scaled)[0]
                
                # Calculate model-specific confidence
                model_confidence = self.calculate_model_confidence(
                    row, model_info, pred_price
                )
                
                predictions[model_name] = {
                    'predicted_price': pred_price,
                    'confidence': model_confidence,
                    'r2_score': model_info['r2_score'],
                    'mae': model_info['mae']
                }
                
            except Exception as e:
                print(f"Prediction error with {model_name}: {e}", file=sys.stderr)
        
        # Choose the best model based on confidence
        if predictions:
            best_model = max(predictions.keys(), key=lambda x: predictions[x]['confidence'])
            return {
                'best_model': best_model,
                'predictions': predictions,
                'chosen_prediction': predictions[best_model]
            }
        else:
            return None

    def calculate_model_confidence(self, row: pd.Series, model_info: Dict, predicted_price: float) -> float:
        """Calculate confidence score for a model prediction"""
        current_price = row['price']
        
        # Base confidence from model performance
        base_confidence = max(0.1, model_info['r2_score']) * 0.4
        
        # Prediction reasonableness (penalize extreme predictions)
        price_ratio = predicted_price / current_price if current_price > 0 else 1
        if 0.7 <= price_ratio <= 1.4:
            reasonableness = 0.3
        elif 0.5 <= price_ratio <= 2.0:
            reasonableness = 0.2
        else:
            reasonableness = 0.1
        
        # Data quality confidence
        data_quality = min(0.2, np.log1p(row['total_sales']) * 0.02 + 
                          np.log1p(row['review_count']) * 0.01)
        
        # Market position confidence
        market_conf = row['market_confidence'] * 0.1
        
        total_confidence = base_confidence + reasonableness + data_quality + market_conf
        return min(1.0, total_confidence)

    def calculate_hybrid_price(self, row: pd.Series, equilibrium: Dict, 
                             ml_prediction: Dict = None) -> Dict:
        """Calculate price using hybrid approach: ML + market-aware logic"""
        current_price = float(row['price'])
        min_price = float(row['min_price'])
        max_price = float(row['max_price'])
        market_segment = row['market_segment']
        
        # Get market equilibrium data
        segment_eq = equilibrium.get(market_segment, {})
        optimal_range = segment_eq.get('optimal_price_range', (current_price * 0.9, current_price * 1.1))
        
        # Start with traditional approach
        traditional_result = self.calculate_conservative_price(row, equilibrium)
        
        # If ML prediction is available, combine approaches
        if ml_prediction and ml_prediction['chosen_prediction']:
            ml_price = ml_prediction['chosen_prediction']['predicted_price']
            ml_confidence = ml_prediction['chosen_prediction']['confidence']
            best_model = ml_prediction['best_model']
            
            # Weighted combination based on confidence
            traditional_confidence = traditional_result['confidence_score']
            
            # Normalize confidences
            total_confidence = ml_confidence + traditional_confidence
            if total_confidence > 0:
                ml_weight = ml_confidence / total_confidence
                traditional_weight = traditional_confidence / total_confidence
            else:
                ml_weight = 0.5
                traditional_weight = 0.5
            
            # Combine prices
            combined_price = (ml_price * ml_weight + 
                            traditional_result['new_price'] * traditional_weight)
            
            # Apply constraints
            combined_price = np.clip(combined_price, min_price, max_price)
            
            # Calculate final adjustment
            final_adjustment = (combined_price - current_price) / current_price
            
            # Apply conservative constraints
            max_increase = self.price_constraints['max_increase']
            max_decrease = self.price_constraints['max_decrease']
            final_adjustment = np.clip(final_adjustment, -max_decrease, max_increase)
            
            final_price = current_price * (1 + final_adjustment)
            
            # Combined confidence
            combined_confidence = min(1.0, (ml_confidence + traditional_confidence) / 2)
            
            # Don't make tiny adjustments
            if abs(final_price - current_price) < 0.01:
                final_price = current_price
                final_adjustment = 0
            
            return {
                'product_id': int(row['product_id']),
                'product_name': row['name'],
                'current_price': round(current_price, 2),
                'new_price': round(final_price, 2),
                'adjustment_factor': round(final_adjustment, 4),
                'confidence_score': round(combined_confidence, 3),
                'market_segment': market_segment,
                'algorithm': f'Hybrid: {best_model} + Conservative',
                'ml_prediction': round(ml_price, 2),
                'traditional_prediction': round(traditional_result['new_price'], 2),
                'ml_confidence': round(ml_confidence, 3),
                'traditional_confidence': round(traditional_confidence, 3),
                'best_model': best_model,
                'model_performance': {
                    'r2_score': round(ml_prediction['chosen_prediction']['r2_score'], 3),
                    'mae': round(ml_prediction['chosen_prediction']['mae'], 3)
                },
                'total_sales': int(row['total_sales']),
                'avg_rating': round(float(row['avg_rating']), 2),
                'avg_sentiment': round(float(row['avg_sentiment']), 2),
                'quality_score': round(float(row['quality_score']), 3),
                'expected_revenue_change': round((final_price - current_price) * max(row['sales_last_30_days'], 1), 2),
                'recommendation': self.get_recommendation(final_adjustment, combined_confidence),
                'all_predictions': ml_prediction['predictions']
            }
        else:
            # Fallback to traditional approach
            result = traditional_result.copy()
            result['algorithm'] = 'Conservative Market-Aware (ML Failed)'
            result['ml_prediction'] = None
            result['best_model'] = 'None'
            return result

    def calculate_conservative_price(self, row: pd.Series, equilibrium: Dict) -> Dict:
        """Calculate price using conservative, market-aware approach"""
        current_price = float(row['price'])
        min_price = float(row['min_price'])
        max_price = float(row['max_price'])
        market_segment = row['market_segment']
        
        # Get market equilibrium data
        segment_eq = equilibrium.get(market_segment, {})
        optimal_range = segment_eq.get('optimal_price_range', (current_price * 0.9, current_price * 1.1))
        segment_elasticity = segment_eq.get('elasticity', -0.8)
        
        # Calculate individual adjustment factors
        adjustments = {}
        
        # 1. Quality-based adjustment (conservative)
        quality_score = row['quality_score']
        if quality_score > 0.7:
            adjustments['quality'] = min(0.05, (quality_score - 0.7) * 0.1)
        elif quality_score < 0.5:
            adjustments['quality'] = max(-0.08, (quality_score - 0.5) * 0.2)
        else:
            adjustments['quality'] = 0
        
        # 2. Market position adjustment
        if current_price < optimal_range[0]:
            adjustments['position'] = min(0.10, (optimal_range[0] - current_price) / current_price)
        elif current_price > optimal_range[1]:
            adjustments['position'] = max(-0.12, (optimal_range[1] - current_price) / current_price)
        else:
            adjustments['position'] = 0
        
        # 3. Demand-based adjustment
        if row['total_sales'] > 0:
            relative_demand = row['relative_performance']
            if relative_demand > 0.5:
                adjustments['demand'] = min(0.06, relative_demand * 0.1)
            elif relative_demand < -0.3:
                adjustments['demand'] = max(-0.10, relative_demand * 0.2)
            else:
                adjustments['demand'] = 0
        else:
            adjustments['demand'] = -0.05  # No sales = price too high
        
        # 4. Inventory adjustment
        if row['inventory_health'] > 1.5:
            adjustments['inventory'] = min(0.04, (row['inventory_health'] - 1.5) * 0.02)
        elif row['inventory_health'] < 0.3 and row['stock_quantity'] > 0:
            adjustments['inventory'] = max(-0.08, (row['inventory_health'] - 0.3) * 0.1)
        else:
            adjustments['inventory'] = 0
        
        # 5. Competitive pressure adjustment
        if row['competitive_pressure'] > 0.3:
            adjustments['competition'] = max(-0.06, -row['competitive_pressure'] * 0.1)
        else:
            adjustments['competition'] = 0
        
        # 6. Trend adjustment (very conservative)
        sales_trend = row['sales_trend']
        if sales_trend > 1.3:
            adjustments['trend'] = min(0.03, (sales_trend - 1.3) * 0.02)
        elif sales_trend < 0.7:
            adjustments['trend'] = max(-0.05, (sales_trend - 0.7) * 0.05)
        else:
            adjustments['trend'] = 0

        if row['unique_customers_last_hour'] >= 2:
    # Multiple users ordering same product = increase price
            demand_multiplier = min(2.0, row['unique_customers_last_hour'] / 2)
            adjustments['real_time_demand'] = min(0.15, demand_multiplier * 0.05)
        elif row['demand_velocity'] > 2:
            # Growing demand = moderate increase
            adjustments['real_time_demand'] = min(0.08, (row['demand_velocity'] - 2) * 0.02)
        else:
            adjustments['real_time_demand'] = 0
        
        # Combine adjustments with weights
        weights = {
            'quality': 0.20,
            'position': 0.25,
            'demand': 0.15,
            'inventory': 0.10,
            'competition': 0.10,
            'trend': 0.05,
            'real_time_demand': 0.5
        }
        
        total_adjustment = sum(adjustments[k] * weights[k] for k in adjustments.keys())
        
        # Apply market confidence as a dampening factor
        confidence_factor = row['market_confidence']
        total_adjustment *= confidence_factor
        
        # Apply elasticity constraints
        if abs(segment_elasticity) > 1.5:  # Highly elastic
            total_adjustment *= 0.7
        elif abs(segment_elasticity) < 0.5:  # Inelastic
            total_adjustment *= 1.2
        
        # Apply conservative constraints
        max_increase = self.price_constraints['max_increase']
        max_decrease = self.price_constraints['max_decrease']
        
        # Reduce max increase for products with low confidence
        if confidence_factor < 0.5:
            max_increase *= 0.5
        
        total_adjustment = np.clip(total_adjustment, -max_decrease, max_increase)
        
        # Calculate final price
        new_price = current_price * (1 + total_adjustment)
        new_price = np.clip(new_price, min_price, max_price)
        
        # Don't make tiny adjustments
        if abs(new_price - current_price) < 0.01:
            new_price = current_price
            total_adjustment = 0
        
        # Calculate comprehensive confidence score
        confidence = self.calculate_comprehensive_confidence(row, adjustments, total_adjustment)
        
        return {
            'product_id': int(row['product_id']),
            'product_name': row['name'],
            'current_price': round(current_price, 2),
            'new_price': round(new_price, 2),
            'adjustment_factor': round(total_adjustment, 4),
            'confidence_score': round(confidence, 3),
            'market_segment': market_segment,
            'adjustments': {# Continuation from where the first code left off
            k: round(v, 4) for k, v in adjustments.items()
            },
            'total_sales': int(row['total_sales']),
            'avg_rating': round(float(row['avg_rating']), 2),
            'avg_sentiment': round(float(row['avg_sentiment']), 2),
            'quality_score': round(float(row['quality_score']), 3),
            'market_position': round(float(row['market_position']), 3),
            'expected_revenue_change': round((new_price - current_price) * max(row['sales_last_30_days'], 1), 2),
            'recommendation': self.get_recommendation(total_adjustment, confidence)
        }

    def calculate_comprehensive_confidence(self, row: pd.Series, adjustments: Dict, total_adjustment: float) -> float:
        """Calculate comprehensive confidence score"""
        # Base confidence from data quality
        data_confidence = min(0.4, np.log1p(row['total_sales']) * 0.05 + np.log1p(row['review_count']) * 0.03)
        
        # Market understanding confidence
        market_confidence = row['market_confidence'] * 0.3
        
        # Adjustment consistency confidence
        adjustment_consistency = 1 - (len([a for a in adjustments.values() if abs(a) > 0.01]) / len(adjustments)) * 0.2
        adjustment_consistency = max(0.1, adjustment_consistency)
        
        # Magnitude confidence (smaller changes = higher confidence)
        magnitude_confidence = max(0.2, 0.4 - abs(total_adjustment) * 2)
        
        total_confidence = data_confidence + market_confidence + adjustment_consistency * 0.2 + magnitude_confidence
        
        return min(1.0, total_confidence)

    def get_recommendation(self, adjustment: float, confidence: float) -> str:
        """Get recommendation category"""
        if confidence < 0.4:
            return 'monitor'
        elif abs(adjustment) < 0.02:
            return 'maintain'
        elif adjustment > 0.08:
            return 'increase_cautiously'
        elif adjustment > 0:
            return 'increase'
        elif adjustment < -0.08:
            return 'decrease_significantly'
        else:
            return 'decrease'

    async def calculate_dynamic_prices(self):
        """Main method to calculate dynamic prices with hybrid ML + market-aware approach"""
        df = await self.fetch_enhanced_data()
        if df is None or df.empty:
            print("No data available for pricing calculation", file=sys.stderr)
            return []

        # Create balanced features
        df = self.create_balanced_features(df)
        
        # Calculate market equilibrium
        equilibrium = self.calculate_market_equilibrium(df)
        print(f"Market equilibrium calculated for segments: {list(equilibrium.keys())}", file=sys.stderr)
        
        # Prepare ML features
        df_encoded, feature_columns = self.prepare_ml_features(df)
        
        # Train ML models
        models = self.train_models(df_encoded, feature_columns)
        
        # Calculate prices using hybrid approach
        new_prices = []
        
        for idx, row in df_encoded.iterrows():
            try:
                # Try ML prediction first
                ml_prediction = None
                algorithm_used = 'Conservative Market-Aware (ML Failed)'
                
                if models:
                    try:
                        ml_prediction = self.predict_with_models(row, feature_columns, models)
                        if ml_prediction:
                            algorithm_used = f'Hybrid: {ml_prediction["best_model"]} + Conservative'
                    except Exception as e:
                        print(f"ML prediction failed for product {row['product_id']}: {e}", file=sys.stderr)
                        ml_prediction = None
                
                # Calculate final price using hybrid approach
                if ml_prediction and ml_prediction['chosen_prediction']['confidence'] > 0.3:
                    # Use hybrid approach
                    price_info = self.calculate_hybrid_price(row, equilibrium, ml_prediction)
                else:
                    # Fallback to conservative approach
                    price_info = self.calculate_conservative_price(row, equilibrium)
                    price_info['algorithm'] = algorithm_used
                    price_info['ml_prediction'] = None
                    price_info['best_model'] = 'None'
                
                new_prices.append(price_info)
                
            except Exception as e:
                print(f"Error calculating price for product {row['product_id']}: {e}", file=sys.stderr)
                # Add a no-change entry
                new_prices.append({
                    'product_id': int(row['product_id']),
                    'product_name': row['name'],
                    'current_price': float(row['price']),
                    'new_price': float(row['price']),
                    'adjustment_factor': 0,
                    'confidence_score': 0.1,
                    'market_segment': row['market_segment'],
                    'algorithm': 'Error - No Change',
                    'recommendation': 'error'
                })
        
        # Filter and adjust low-confidence recommendations
        for p in new_prices:
            if p['confidence_score'] < self.price_constraints['min_confidence']:
                p['new_price'] = p['current_price']
                p['adjustment_factor'] = 0
                p['recommendation'] = 'maintain_low_confidence'
                p['algorithm'] = f"{p.get('algorithm', 'Unknown')} (Low Confidence Override)"
        
        # Sort by confidence score
        new_prices.sort(key=lambda x: x['confidence_score'], reverse=True)
        
        return new_prices

async def main():
    """Main execution function"""
    pricing_engine = ImprovedDynamicPricing()
    prices = await pricing_engine.calculate_dynamic_prices()
    return prices

if __name__ == "__main__":
    # Execute the pricing algorithm
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(main())
    
    # Print summary statistics
    if result:
        increases = [p for p in result if p['new_price'] > p['current_price']]
        decreases = [p for p in result if p['new_price'] < p['current_price']]
        maintains = [p for p in result if p['new_price'] == p['current_price']]
        
        print(f"\nCalculated prices for {len(result)} products:", file=sys.stderr)
        print(f"Price increases: {len(increases)} (avg: {np.mean([p['adjustment_factor'] for p in increases]) * 100:.1f}%)", file=sys.stderr)
        print(f"Price decreases: {len(decreases)} (avg: {np.mean([p['adjustment_factor'] for p in decreases]) * 100:.1f}%)", file=sys.stderr)
        print(f"Price maintains: {len(maintains)}", file=sys.stderr)
        print(f"Average confidence score: {np.mean([p['confidence_score'] for p in result]):.3f}", file=sys.stderr)
        
        # Show algorithm usage statistics
        algorithms = {}
        for item in result:
            alg = item.get('algorithm', 'Unknown')
            algorithms[alg] = algorithms.get(alg, 0) + 1
        print(f"Algorithm usage: {algorithms}", file=sys.stderr)
        
        # Show ML model performance if available
        ml_successes = [p for p in result if p.get('best_model') and p.get('best_model') != 'None']
        if ml_successes:
            print(f"ML predictions successful: {len(ml_successes)}/{len(result)}", file=sys.stderr)
            models_used = {}
            for item in ml_successes:
                model = item.get('best_model', 'Unknown')
                models_used[model] = models_used.get(model, 0) + 1
            print(f"ML models used: {models_used}", file=sys.stderr)
        
        # Show distribution of adjustments
        adjustments = [p['adjustment_factor'] * 100 for p in result if p['adjustment_factor'] != 0]
        if adjustments:
            print(f"Adjustment range: {min(adjustments):.1f}% to {max(adjustments):.1f}%", file=sys.stderr)
            print(f"Median adjustment: {np.median(adjustments):.1f}%", file=sys.stderr)
        
        # Show top recommendations by category
        recommendations = {}
        for item in result:
            rec = item['recommendation']
            recommendations[rec] = recommendations.get(rec, 0) + 1
        
        print(f"Recommendations: {recommendations}", file=sys.stderr)
    
    # Output clean JSON
    print(json.dumps(result, ensure_ascii=True, indent=None))