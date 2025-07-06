# Dynamic Pricing REST API

A comprehensive REST API server for dynamic pricing recommendations and price management using PPO (Proximal Policy Optimization) models.

## Features

- **Price Recommendations**: Get AI-powered price recommendations for products
- **Price Updates**: Update product prices with audit logging
- **Batch Operations**: Update multiple product prices simultaneously
- **Market Analysis**: Comprehensive market analysis and insights
- **Model Management**: Monitor and retrain PPO models
- **Performance Analytics**: System-wide performance metrics

## Quick Start

### Prerequisites

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (optional):
```bash
export DB_HOST=localhost
export DB_NAME=commerce_database
export DB_USER=vidya
export DB_PASSWORD=commerceproject
export DB_PORT=5432
```

3. Start the API server:
```bash
python api.py
```

The server will start on `http://localhost:5002` by default.

## API Endpoints

### Health Check

#### GET `/health`
Check the health status of the API server.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "database": "connected",
  "active_agents": 5
}
```

### Price Recommendations

#### GET `/api/v1/products/{product_id}/price-recommendation`
Get AI-powered price recommendation for a specific product.

**Query Parameters:**
- `current_price` (optional): Current price of the product
- `user_segment` (optional): User segment (default: "standard")
- `market_conditions` (optional): Market conditions (default: "normal")

**Response:**
```json
{
  "product_id": 23,
  "product_name": "Shimla Apples",
  "current_price": 150.0,
  "recommended_price": 165.0,
  "price_change_percent": 10.0,
  "confidence_score": 0.85,
  "reasoning": {
    "market_conditions": {
      "season": "winter",
      "day_of_week": 1,
      "is_holiday": false
    },
    "recent_demand": 45,
    "price_elasticity": -1.2,
    "seasonal_factor": "winter"
  },
  "constraints_applied": {
    "max_price_change": 0.15,
    "min_profit_margin": 0.05
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

### Price Management

#### POST `/api/v1/products/{product_id}/update-price`
Update the price of a specific product.

**Request Body:**
```json
{
  "new_price": 165.0,
  "discount_price": 155.0,
  "reason": "ai_recommendation",
  "model_version": "ppo_v1_20240115"
}
```

**Response:**
```json
{
  "product_id": 23,
  "old_price": 150.0,
  "new_price": 165.0,
  "price_change_percent": 10.0,
  "discount_price": 155.0,
  "reason": "ai_recommendation",
  "model_version": "ppo_v1_20240115",
  "timestamp": "2024-01-15T10:30:00",
  "status": "success"
}
```

#### POST `/api/v1/products/{product_id}/batch-update`
Update prices for multiple products in a single request.

**Request Body:**
```json
{
  "updates": [
    {
      "product_id": 23,
      "new_price": 165.0,
      "reason": "batch_update"
    },
    {
      "product_id": 29,
      "new_price": 180.0,
      "reason": "batch_update"
    }
  ]
}
```

**Response:**
```json
{
  "batch_id": "20240115_103000",
  "total_updates": 2,
  "successful_updates": 2,
  "failed_updates": 0,
  "results": [
    {
      "product_id": 23,
      "status": "success",
      "old_price": 150.0,
      "new_price": 165.0
    },
    {
      "product_id": 29,
      "status": "success",
      "old_price": 170.0,
      "new_price": 180.0
    }
  ],
  "timestamp": "2024-01-15T10:30:00"
}
```

### Market Analysis

#### GET `/api/v1/products/{product_id}/market-analysis`
Get comprehensive market analysis for a product.

**Response:**
```json
{
  "product_id": 23,
  "product_name": "Shimla Apples",
  "category": "Fruits",
  "current_price": 150.0,
  "stock_quantity": 100,
  "avg_rating": 4.5,
  "review_count": 25,
  "sales_metrics": {
    "total_sales_30d": 150,
    "avg_daily_sales": 5.0,
    "total_revenue_30d": 22500.0,
    "avg_sale_price": 150.0
  },
  "demand_analysis": {
    "price_elasticity": -1.2,
    "demand_trend": "stable",
    "seasonal_pattern": "winter"
  },
  "market_conditions": {
    "season": "winter",
    "day_of_week": 1,
    "is_holiday": false,
    "economic_index": 1.0,
    "competition_level": 1.0
  },
  "pricing_recommendations": {
    "optimal_price_range": {
      "min": 120.0,
      "max": 180.0
    },
    "suggested_discount": 0.0,
    "competition_level": 1.0
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

### Price History

#### GET `/api/v1/products/{product_id}/price-history`
Get price change history for a product.

**Response:**
```json
{
  "product_id": 23,
  "price_changes": [
    {
      "old_price": 150.0,
      "new_price": 165.0,
      "change_percent": 10.0,
      "reason": "ai_recommendation",
      "model_version": "ppo_v1_20240115",
      "timestamp": "2024-01-15T10:30:00"
    }
  ],
  "total_changes": 1
}
```

### Model Management

#### GET `/api/v1/models/status`
Get status of all trained PPO models.

**Response:**
```json
{
  "total_models": 6,
  "models": [
    {
      "product_id": 23,
      "model_exists": true,
      "last_updated": "2024-01-15T09:00:00",
      "model_size_mb": 15.2
    }
  ],
  "timestamp": "2024-01-15T10:30:00"
}
```

#### POST `/api/v1/models/{product_id}/retrain`
Retrain the PPO model for a specific product.

**Request Body:**
```json
{
  "total_timesteps": 100000
}
```

**Response:**
```json
{
  "product_id": 23,
  "status": "success",
  "total_timesteps": 100000,
  "model_version": "ppo_v1_20240115_103000",
  "timestamp": "2024-01-15T10:30:00"
}
```

### Performance Analytics

#### GET `/api/v1/analytics/performance`
Get overall system performance analytics.

**Response:**
```json
{
  "system_metrics": {
    "total_products": 100,
    "active_models": 6,
    "model_coverage": 6.0
  },
  "recent_activity": {
    "top_products_by_changes": [
      {
        "product_id": 23,
        "product_name": "Shimla Apples",
        "avg_price_change": 8.5,
        "total_changes": 5,
        "last_change": "2024-01-15T10:30:00"
      }
    ],
    "total_price_changes_7d": 15
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found (product/model not found)
- `500`: Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "Product not found"
}
```

## Configuration

The API uses configuration from `config.py`. Key settings:

- **Database**: Connection parameters for PostgreSQL
- **API**: Host, port, CORS origins
- **PPO**: Model training parameters
- **Environment**: Pricing constraints and business rules

## Security Considerations

- All price changes are logged with timestamps and reasons
- Database connections use parameterized queries
- CORS is configured for specific origins
- Input validation is performed on all endpoints

## Monitoring

The API includes comprehensive logging:

- Request/response logging
- Database operation logging
- Model training and prediction logging
- Error logging with stack traces

## Integration Examples

### Python Client Example

```python
import requests

# Get price recommendation
response = requests.get('http://localhost:5002/api/v1/products/23/price-recommendation')
recommendation = response.json()

# Update price
update_data = {
    'new_price': recommendation['recommended_price'],
    'reason': 'ai_recommendation'
}
response = requests.post('http://localhost:5002/api/v1/products/23/update-price', 
                        json=update_data)
```

### JavaScript Client Example

```javascript
// Get price recommendation
fetch('http://localhost:5002/api/v1/products/23/price-recommendation')
  .then(response => response.json())
  .then(recommendation => {
    console.log('Recommended price:', recommendation.recommended_price);
  });

// Update price
fetch('http://localhost:5002/api/v1/products/23/update-price', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    new_price: 165.0,
    reason: 'manual_update'
  })
})
.then(response => response.json())
.then(result => {
  console.log('Price updated:', result);
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in config
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Model Not Found**
   - Train models first using the training scripts
   - Check model file paths in config
   - Verify model files exist in the models directory

3. **CORS Errors**
   - Update CORS origins in config
   - Check frontend URL configuration

### Logs

Check the application logs for detailed error information:

```bash
tail -f training.log
```

## Support

For issues and questions:
1. Check the logs for error details
2. Verify configuration settings
3. Ensure all dependencies are installed
4. Test database connectivity 