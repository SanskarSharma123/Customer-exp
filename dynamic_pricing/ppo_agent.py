"""
PPO Agent for Dynamic Pricing
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
import logging
import joblib
import os
from datetime import datetime
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import EvalCallback, CheckpointCallback
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.logger import configure
import tensorboard
from environment import DynamicPricingEnvironment
from database import DynamicPricingDB
from config import DynamicPricingConfig

logger = logging.getLogger(__name__)

class DynamicPricingPPO:
    """
    PPO-based dynamic pricing agent
    """
    
    def __init__(self, product_id: int, db: DynamicPricingDB):
        self.product_id = product_id
        self.db = db
        self.config = DynamicPricingConfig
        
        # Initialize environment
        self.env = DynamicPricingEnvironment(product_id, db)
        self.vec_env = DummyVecEnv([lambda: Monitor(self.env)])
        
        # Initialize PPO model
        self.model = None
        self.model_version = f"ppo_v1_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Training history
        self.training_history = []
        
    def create_model(self):
        """Create and configure PPO model"""
        self.model = PPO(
            "MlpPolicy",
            self.vec_env,
            learning_rate=self.config.PPO_CONFIG['learning_rate'],
            n_steps=self.config.PPO_CONFIG['n_steps'],
            batch_size=self.config.PPO_CONFIG['batch_size'],
            n_epochs=self.config.PPO_CONFIG['n_epochs'],
            gamma=self.config.PPO_CONFIG['gamma'],
            gae_lambda=self.config.PPO_CONFIG['gae_lambda'],
            clip_range=self.config.PPO_CONFIG['clip_range'],
            clip_range_vf=self.config.PPO_CONFIG['clip_range_vf'],
            ent_coef=self.config.PPO_CONFIG['ent_coef'],
            vf_coef=self.config.PPO_CONFIG['vf_coef'],
            max_grad_norm=self.config.PPO_CONFIG['max_grad_norm'],
            target_kl=self.config.PPO_CONFIG['target_kl'],
            verbose=self.config.PPO_CONFIG['verbose'],
            tensorboard_log=self.config.TRAINING_CONFIG['tensorboard_log']
        )
        
        logger.info(f"PPO model created for product {self.product_id}")
        
    def train(self, total_timesteps: Optional[int] = None):
        """Train the PPO model"""
        if self.model is None:
            self.create_model()
        
        total_timesteps = total_timesteps or self.config.TRAINING_CONFIG['total_timesteps']
        
        # Create callbacks
        eval_env = DummyVecEnv([lambda: Monitor(DynamicPricingEnvironment(self.product_id, self.db))])
        eval_callback = EvalCallback(
            eval_env,
            best_model_save_path=f"{self.config.TRAINING_CONFIG['model_save_path']}/best_model",
            log_path=f"{self.config.TRAINING_CONFIG['model_save_path']}/logs",
            eval_freq=self.config.TRAINING_CONFIG['eval_freq'],
            deterministic=True,
            render=False
        )
        
        checkpoint_callback = CheckpointCallback(
            save_freq=self.config.TRAINING_CONFIG['save_freq'],
            save_path=f"{self.config.TRAINING_CONFIG['model_save_path']}/checkpoints",
            name_prefix=f"ppo_model_{self.product_id}"
        )
        
        # Configure logger
        log_path = f"{self.config.TRAINING_CONFIG['tensorboard_log']}/product_{self.product_id}"
        configure(log_path, ["stdout", "csv", "tensorboard"])
        
        # Train the model
        logger.info(f"Starting training for product {self.product_id} for {total_timesteps} timesteps")
        
        try:
            self.model.learn(
                total_timesteps=total_timesteps,
                callback=[eval_callback, checkpoint_callback],
                progress_bar=False
            )
            
            # Save final model
            self.save_model()
            
            logger.info(f"Training completed for product {self.product_id}")
            
        except Exception as e:
            logger.error(f"Training failed for product {self.product_id}: {e}")
            raise
    
    def predict_price_change(self, observation: np.ndarray) -> float:
        """Predict optimal price change given current observation"""
        if self.model is None:
            logger.warning("Model not trained. Loading latest model...")
            self.load_model()
        
        if self.model is None:
            logger.error("No model available for prediction")
            return 0.0
        
        try:
            action, _ = self.model.predict(observation, deterministic=True)
            return float(action[0])
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return 0.0
    
    def get_optimal_price(self, current_price: float, market_conditions: Dict) -> float:
        """Get optimal price recommendation"""
        # Get current observation
        observation = self.env._get_observation()
        
        # Predict price change
        price_change_percent = self.predict_price_change(observation)
        
        # Apply constraints
        max_change = self.config.ENV_CONFIG['max_price_change_percent']
        price_change_percent = np.clip(price_change_percent, -max_change, max_change)
        
        # Calculate new price
        new_price = current_price * (1 + price_change_percent)
        
        # Apply business constraints
        new_price = self._apply_business_constraints(new_price, current_price)
        
        return new_price
    
    def _apply_business_constraints(self, new_price: float, current_price: float) -> float:
        """Apply business rules and constraints to price"""
        # Minimum price constraint
        min_price = current_price * 0.5  # Don't go below 50% of current price
        new_price = max(new_price, min_price)
        
        # Maximum price constraint
        max_price = current_price * 2.0  # Don't go above 200% of current price
        new_price = min(new_price, max_price)
        
        # Profit margin constraint
        cost = current_price * 0.6  # Assume 60% cost
        min_profit_margin = 0.05  # Minimum 5% profit margin
        min_price_for_profit = cost / (1 - min_profit_margin)
        new_price = max(new_price, min_price_for_profit)
        
        return new_price
    
    def evaluate_model(self, n_episodes: int = 10) -> Dict:
        """Evaluate model performance"""
        if self.model is None:
            logger.error("No model to evaluate")
            return {}
        
        eval_env = DynamicPricingEnvironment(self.product_id, self.db)
        
        total_rewards = []
        total_revenues = []
        total_profits = []
        customer_satisfactions = []
        
        for episode in range(n_episodes):
            obs, _ = eval_env.reset()
            episode_reward = 0
            episode_revenue = 0
            episode_profit = 0
            
            done = False
            while not done:
                action, _ = self.model.predict(obs, deterministic=True)
                obs, reward, done, _, info = eval_env.step(action)
                
                episode_reward += reward
                episode_revenue += info.get('revenue', 0)
                episode_profit += info.get('revenue', 0) * info.get('profit_margin', 0)
            
            total_rewards.append(episode_reward)
            total_revenues.append(episode_revenue)
            total_profits.append(episode_profit)
            customer_satisfactions.append(eval_env.customer_satisfaction)
        
        return {
            'avg_reward': np.mean(total_rewards),
            'std_reward': np.std(total_rewards),
            'avg_revenue': np.mean(total_revenues),
            'avg_profit': np.mean(total_profits),
            'avg_satisfaction': np.mean(customer_satisfactions),
            'n_episodes': n_episodes
        }
    
    def save_model(self, path: Optional[str] = None):
        """Save the trained model"""
        if self.model is None:
            logger.error("No model to save")
            return
        
        if path is None:
            path = f"{self.config.TRAINING_CONFIG['model_save_path']}/product_{self.product_id}"
        
        os.makedirs(path, exist_ok=True)
        
        model_path = f"{path}/ppo_model_{self.model_version}.zip"
        self.model.save(model_path)
        
        # Save metadata
        metadata = {
            'product_id': self.product_id,
            'model_version': self.model_version,
            'created_at': datetime.now().isoformat(),
            'config': self.config.PPO_CONFIG
        }
        
        metadata_path = f"{path}/metadata_{self.model_version}.pkl"
        joblib.dump(metadata, metadata_path)
        
        logger.info(f"Model saved to {model_path}")
    
    def load_model(self, path: Optional[str] = None):
        """Load a trained model"""
        if path is None:
            path = f"{self.config.TRAINING_CONFIG['model_save_path']}/product_{self.product_id}"
        
        # Find the latest model
        if os.path.exists(path):
            model_files = [f for f in os.listdir(path) if f.endswith('.zip')]
            if model_files:
                latest_model = sorted(model_files)[-1]
                model_path = f"{path}/{latest_model}"
                
                try:
                    self.model = PPO.load(model_path, env=self.vec_env)
                    logger.info(f"Model loaded from {model_path}")
                    return True
                except Exception as e:
                    logger.error(f"Failed to load model: {e}")
        
        logger.warning("No saved model found")
        return False
    
    def get_training_history(self) -> List[Dict]:
        """Get training history"""
        return self.training_history
    
    def update_prices_batch(self, product_ids: List[int]) -> Dict:
        """Update prices for multiple products"""
        results = {}
        
        for product_id in product_ids:
            try:
                # Get current product data
                product_data = self.db.get_product_data(product_id)
                if product_data.empty:
                    continue
                
                current_price = float(product_data['price'].iloc[0])
                
                # Get optimal price
                market_conditions = self.db.get_market_conditions()
                optimal_price = self.get_optimal_price(current_price, market_conditions)
                
                # Update price in database
                success = self.db.update_product_price(product_id, optimal_price)
                
                if success:
                    # Log price change
                    self.db.log_price_change(
                        product_id, current_price, optimal_price,
                        "PPO optimization", self.model_version
                    )
                    
                    results[product_id] = {
                        'old_price': current_price,
                        'new_price': optimal_price,
                        'change_percent': ((optimal_price - current_price) / current_price) * 100,
                        'status': 'success'
                    }
                else:
                    results[product_id] = {
                        'status': 'failed',
                        'error': 'Database update failed'
                    }
                    
            except Exception as e:
                logger.error(f"Failed to update price for product {product_id}: {e}")
                results[product_id] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        return results 