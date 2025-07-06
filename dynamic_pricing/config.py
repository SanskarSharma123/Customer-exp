"""
Configuration file for Dynamic Pricing System using PPO
"""

import os
from dotenv import load_dotenv

load_dotenv()

class DynamicPricingConfig:
    # Database Configuration
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'database': os.getenv('DB_NAME', 'commerce_database'),
        'user': os.getenv('DB_USER', 'vidya'),
        'password': os.getenv('DB_PASSWORD', 'commerceproject'),
        'port': int(os.getenv('DB_PORT', 5432))
    }
    
    # PPO Algorithm Parameters
    PPO_CONFIG = {
        'learning_rate': 3e-4,
        'n_steps': 2048,
        'batch_size': 64,
        'n_epochs': 10,
        'gamma': 0.99,
        'gae_lambda': 0.95,
        'clip_range': 0.2,
        'clip_range_vf': None,
        'ent_coef': 0.01,
        'vf_coef': 0.5,
        'max_grad_norm': 0.5,
        'target_kl': 0.01,
        'verbose': 1
    }
    
    # Environment Parameters
    ENV_CONFIG = {
        'max_price_change_percent': 0.15,  # Max 15% price change per step
        'min_price_change_percent': 0.01,  # Min 1% price change per step
        'price_update_frequency_hours': 6,  # Update prices every 6 hours
        'observation_window_days': 30,      # Look back 30 days for context
        'reward_weights': {
            'revenue': 0.4,
            'profit_margin': 0.3,
            'customer_satisfaction': 0.2,
            'inventory_health': 0.1
        }
    }
    
    # Product Segmentation
    PRODUCT_SEGMENTS = {
        'premium': {
            'price_elasticity_range': (-0.5, -1.5),
            'max_price_change': 0.10,
            'min_profit_margin': 0.25
        },
        'standard': {
            'price_elasticity_range': (-1.0, -2.0),
            'max_price_change': 0.15,
            'min_profit_margin': 0.15
        },
        'budget': {
            'price_elasticity_range': (-1.5, -3.0),
            'max_price_change': 0.20,
            'min_profit_margin': 0.10
        }
    }
    
    # User Segmentation
    USER_SEGMENTS = {
        'price_sensitive': {
            'elasticity_multiplier': 1.5,
            'satisfaction_weight': 0.3
        },
        'value_seeker': {
            'elasticity_multiplier': 1.2,
            'satisfaction_weight': 0.25
        },
        'premium_buyer': {
            'elasticity_multiplier': 0.8,
            'satisfaction_weight': 0.15
        }
    }
    
    # Time-based Factors
    TIME_FACTORS = {
        'weekend_multiplier': 1.1,
        'holiday_multiplier': 1.2,
        'seasonal_factors': {
            'summer': 1.05,
            'winter': 1.08,
            'monsoon': 0.95,
            'festival': 1.15
        }
    }
    
    # Model Training
    TRAINING_CONFIG = {
        'total_timesteps': 1000000,
        'eval_freq': 10000,
        'save_freq': 50000,
        'model_save_path': './models/dynamic_pricing_ppo',
        'tensorboard_log': './logs/dynamic_pricing',
        'early_stopping_patience': 10
    }
    
    # API Configuration
    API_CONFIG = {
        'host': os.getenv('API_HOST', '0.0.0.0'),
        'port': int(os.getenv('API_PORT', 5002)),
        'debug': os.getenv('API_DEBUG', 'False').lower() == 'true',
        'cors_origins': os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    }
    
    # Monitoring & Logging
    MONITORING_CONFIG = {
        'log_level': os.getenv('LOG_LEVEL', 'INFO'),
        'metrics_export_interval': 3600,  # 1 hour
        'alert_thresholds': {
            'revenue_drop': 0.15,
            'profit_margin_drop': 0.10,
            'customer_satisfaction_drop': 0.20
        }
    } 