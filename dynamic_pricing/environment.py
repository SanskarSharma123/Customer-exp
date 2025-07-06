"""
Dynamic Pricing Environment for PPO Algorithm
"""

import gymnasium as gym
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import logging
from gymnasium import spaces
from database import DynamicPricingDB
from config import DynamicPricingConfig

logger = logging.getLogger(__name__)

class DynamicPricingEnvironment(gym.Env):
    """
    Custom Gymnasium environment for dynamic pricing using PPO
    """
    
    def __init__(self, product_id: int, db: DynamicPricingDB):
        super().__init__()
        
        self.product_id = product_id
        self.db = db
        self.config = DynamicPricingConfig.ENV_CONFIG
        
        # Load product data
        self.product_data = self._load_product_data()
        self.sales_history = self._load_sales_history()
        
        # Environment state
        self.current_step = 0
        self.current_price = float(self.product_data['base_price'].iloc[0])
        self.original_price = self.current_price
        self.total_revenue = 0.0
        self.total_profit = 0.0
        self.customer_satisfaction = 5.0
        self.inventory_level = int(self.product_data['stock_quantity'].iloc[0])
        
        # Define action and observation spaces
        self.action_space = spaces.Box(
            low=-self.config['max_price_change_percent'],
            high=self.config['max_price_change_percent'],
            shape=(1,),
            dtype=np.float32
        )
        
        # Observation space: [price, demand, inventory, satisfaction, time_features, market_features]
        self.observation_space = spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(15,),  # 15 features
            dtype=np.float32
        )
        
        # Initialize demand model
        self.demand_model = self._initialize_demand_model()
        
    def _load_product_data(self) -> pd.DataFrame:
        """Load product information"""
        return self.db.get_product_data(self.product_id)
    
    def _load_sales_history(self) -> pd.DataFrame:
        """Load historical sales data"""
        return self.db.get_sales_history(self.product_id, days_back=30)
    
    def _initialize_demand_model(self) -> Dict:
        """Initialize simple demand model based on historical data"""
        if self.sales_history.empty:
            return {
                'base_demand': 10,
                'price_elasticity': -1.0,
                'seasonal_factors': {'summer': 1.0, 'winter': 1.0, 'monsoon': 1.0, 'festival': 1.0}
            }
        
        # Calculate price elasticity from historical data
        if len(self.sales_history) > 1:
            price_changes = self.sales_history['sale_price'].pct_change().dropna()
            demand_changes = self.sales_history['quantity'].pct_change().dropna()
            
            if len(price_changes) > 0 and len(demand_changes) > 0:
                # Simple elasticity calculation
                elasticity = np.mean(demand_changes / price_changes) if np.any(price_changes != 0) else -1.0
            else:
                elasticity = -1.0
        else:
            elasticity = -1.0
        
        # Calculate base demand
        base_demand = self.sales_history['quantity'].mean() if not self.sales_history.empty else 10
        
        return {
            'base_demand': base_demand,
            'price_elasticity': elasticity,
            'seasonal_factors': self._calculate_seasonal_factors()
        }
    
    def _calculate_seasonal_factors(self) -> Dict:
        """Calculate seasonal demand factors"""
        if self.sales_history.empty:
            return {'summer': 1.0, 'winter': 1.0, 'monsoon': 1.0, 'festival': 1.0}
        
        seasonal_data = {}
        for season in ['summer', 'winter', 'monsoon', 'festival']:
            # This is a simplified calculation - in practice, you'd use more sophisticated methods
            seasonal_data[season] = 1.0 + np.random.normal(0, 0.1)
        
        return seasonal_data
    
    def _get_observation(self) -> np.ndarray:
        """Get current environment observation"""
        # Price features
        price_ratio = self.current_price / self.original_price
        price_change = (self.current_price - self.original_price) / self.original_price
        
        # Demand features
        current_demand = self._predict_demand()
        demand_change = (current_demand - self.demand_model['base_demand']) / self.demand_model['base_demand']
        
        # Inventory features
        inventory_ratio = self.inventory_level / max(1, int(self.product_data['stock_quantity'].iloc[0]))
        
        # Customer satisfaction features
        satisfaction_change = (self.customer_satisfaction - 5.0) / 5.0
        
        # Time features
        current_time = datetime.now()
        day_of_week = current_time.weekday() / 6.0  # Normalize to [0, 1]
        hour_of_day = current_time.hour / 23.0  # Normalize to [0, 1]
        is_weekend = 1.0 if current_time.weekday() >= 5 else 0.0
        
        # Market features
        market_conditions = self.db.get_market_conditions()
        season_encoded = self._encode_season(market_conditions['season'])
        is_holiday = 1.0 if market_conditions['is_holiday'] else 0.0
        
        # Product features
        avg_rating = float(self.product_data['avg_rating'].iloc[0]) / 5.0
        review_count = min(float(self.product_data['review_count'].iloc[0]) / 100.0, 1.0)
        is_featured = 1.0 if self.product_data['is_featured'].iloc[0] else 0.0
        
        # Financial features
        revenue_ratio = self.total_revenue / max(1, self.original_price * self.demand_model['base_demand'])
        profit_margin = self._calculate_profit_margin()
        
        observation = np.array([
            price_ratio,
            price_change,
            current_demand / 100.0,  # Normalize demand
            demand_change,
            inventory_ratio,
            satisfaction_change,
            day_of_week,
            hour_of_day,
            is_weekend,
            season_encoded,
            is_holiday,
            avg_rating,
            review_count,
            revenue_ratio,
            profit_margin
        ], dtype=np.float32)
        
        return observation
    
    def _encode_season(self, season: str) -> float:
        """Encode season as float"""
        season_map = {'summer': 0.25, 'monsoon': 0.5, 'festival': 0.75, 'winter': 1.0}
        return season_map.get(season, 0.5)
    
    def _predict_demand(self) -> float:
        """Predict demand based on current price and market conditions"""
        base_demand = self.demand_model['base_demand']
        price_elasticity = self.demand_model['price_elasticity']
        
        # Price effect
        price_ratio = self.current_price / self.original_price
        price_effect = np.power(price_ratio, price_elasticity)
        
        # Seasonal effect
        market_conditions = self.db.get_market_conditions()
        season = market_conditions['season']
        seasonal_factor = self.demand_model['seasonal_factors'].get(season, 1.0)
        
        # Time effect (weekend boost)
        current_time = datetime.now()
        time_factor = 1.2 if current_time.weekday() >= 5 else 1.0
        
        # Customer satisfaction effect
        satisfaction_factor = 1.0 + (self.customer_satisfaction - 5.0) * 0.1
        
        # Calculate final demand
        demand = base_demand * price_effect * seasonal_factor * time_factor * satisfaction_factor
        
        # Add some randomness
        demand *= np.random.normal(1.0, 0.1)
        
        return max(0, demand)
    
    def _calculate_profit_margin(self) -> float:
        """Calculate current profit margin"""
        if self.current_price <= 0:
            return 0.0
        
        # Assume cost is 60% of original price (simplified)
        cost = self.original_price * 0.6
        profit = self.current_price - cost
        margin = profit / self.current_price if self.current_price > 0 else 0.0
        
        return max(0.0, min(1.0, margin))
    
    def _calculate_reward(self, action: float, demand: float) -> float:
        """Calculate reward based on multiple objectives"""
        weights = self.config['reward_weights']
        
        # Revenue component
        revenue = demand * self.current_price
        revenue_reward = revenue / (self.original_price * self.demand_model['base_demand'])
        
        # Profit margin component
        profit_margin = self._calculate_profit_margin()
        
        # Customer satisfaction component
        satisfaction_reward = self.customer_satisfaction / 5.0
        
        # Inventory health component
        inventory_health = min(1.0, self.inventory_level / max(1, demand))
        
        # Penalty for extreme price changes
        price_change_penalty = -abs(action) * 0.1
        
        # Calculate weighted reward
        reward = (
            weights['revenue'] * revenue_reward +
            weights['profit_margin'] * profit_margin +
            weights['customer_satisfaction'] * satisfaction_reward +
            weights['inventory_health'] * inventory_health +
            price_change_penalty
        )
        
        return reward
    
    def step(self, action: np.ndarray) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """Execute one step in the environment"""
        # Extract price change from action
        price_change_percent = float(action[0])
        
        # Apply price change
        old_price = self.current_price
        price_change = self.current_price * price_change_percent
        self.current_price = max(0.1, self.current_price + price_change)
        
        # Predict demand
        demand = self._predict_demand()
        
        # Update inventory
        actual_sales = min(demand, self.inventory_level)
        self.inventory_level = max(0, self.inventory_level - actual_sales)
        
        # Update financial metrics
        revenue = actual_sales * self.current_price
        self.total_revenue += revenue
        
        # Update customer satisfaction (simplified model)
        price_satisfaction = 1.0 - abs(price_change_percent) * 2.0  # Price changes affect satisfaction
        self.customer_satisfaction = max(1.0, min(10.0, 
            self.customer_satisfaction * 0.9 + price_satisfaction * 0.1))
        
        # Calculate reward
        reward = self._calculate_reward(price_change_percent, actual_sales)
        
        # Check if episode is done
        done = self.inventory_level <= 0 or self.current_step >= 100
        
        # Update step counter
        self.current_step += 1
        
        # Get observation
        observation = self._get_observation()
        
        # Additional info
        info = {
            'price': self.current_price,
            'demand': demand,
            'actual_sales': actual_sales,
            'revenue': revenue,
            'inventory': self.inventory_level,
            'satisfaction': self.customer_satisfaction,
            'profit_margin': self._calculate_profit_margin()
        }
        
        return observation, reward, done, False, info
    
    def reset(self, seed: Optional[int] = None) -> Tuple[np.ndarray, Dict]:
        """Reset environment to initial state"""
        super().reset(seed=seed)
        
        # Reset state variables
        self.current_step = 0
        self.current_price = self.original_price
        self.total_revenue = 0.0
        self.total_profit = 0.0
        self.customer_satisfaction = 5.0
        self.inventory_level = int(self.product_data['stock_quantity'].iloc[0])
        
        # Get initial observation
        observation = self._get_observation()
        
        return observation, {}
    
    def render(self):
        """Render environment state (for debugging)"""
        print(f"Step: {self.current_step}")
        print(f"Price: ₹{self.current_price:.2f}")
        print(f"Inventory: {self.inventory_level}")
        print(f"Customer Satisfaction: {self.customer_satisfaction:.2f}")
        print(f"Total Revenue: ₹{self.total_revenue:.2f}")
        print(f"Profit Margin: {self._calculate_profit_margin():.2%}")
        print("-" * 50) 