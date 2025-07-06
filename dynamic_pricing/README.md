# Dynamic Pricing System with PPO

A sophisticated dynamic pricing system using Proximal Policy Optimization (PPO) for e-commerce applications. This system automatically optimizes product prices based on market conditions, customer behavior, and business objectives.

## 🚀 Features

- **PPO-based Price Optimization**: Uses reinforcement learning to find optimal pricing strategies
- **Multi-objective Optimization**: Balances revenue, profit margin, customer satisfaction, and inventory health
- **Real-time Market Adaptation**: Responds to changing market conditions and demand patterns
- **User Segmentation**: Different pricing strategies for different customer segments
- **Seasonal and Time-based Pricing**: Considers seasonal factors, weekends, and holidays
- **Audit Trail**: Complete logging of all price changes with reasons
- **REST API**: Easy integration with existing e-commerce platforms
- **Dashboard**: Real-time monitoring and visualization of pricing performance

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL database
- Your existing e-commerce database with products, orders, and user data

## 🛠️ Installation

1. **Clone the dynamic pricing module**:
```bash
cd dynamic_pricing
pip install -r requirements.txt
```

2. **Set up environment variables**:
Create a `.env` file in the `dynamic_pricing` directory:
```env
DB_HOST=localhost
DB_NAME=commerce_database
DB_USER=vidya
DB_PASSWORD=commerceproject
DB_PORT=5432
```

3. **Create required database table**:
```sql
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
);
```

## 🎯 Quick Start

### 1. Train Models

Train PPO models for your products:

```bash
# Train for a specific product
python train.py --product-id 1 --timesteps 100000

# Train for top 10 products by sales
python train.py --top-n 10 --timesteps 100000

# Train for specific categories
python train.py --categories 1 2 3 --min-sales 20
```

### 2. Start the API Server

```bash
python api.py
```

The API will be available at `http://localhost:5002`

### 3. Get Price Recommendations

```bash
curl http://localhost:5002/api/dynamic-pricing/predict/1
```

### 4. Update Prices

```bash
curl -X POST http://localhost:5002/api/dynamic-pricing/update-price/1 \
  -H "Content-Type: application/json" \
  -d '{"force_update": false}'
```

## 📊 API Endpoints

### Training
- `POST /api/dynamic-pricing/train` - Train PPO model for a product
- `GET /api/dynamic-pricing/status/{product_id}` - Get model status

### Predictions
- `GET /api/dynamic-pricing/predict/{product_id}` - Get price recommendation
- `POST /api/dynamic-pricing/update-price/{product_id}` - Update product price
- `POST /api/dynamic-pricing/batch-update` - Update multiple products

### Evaluation
- `GET /api/dynamic-pricing/evaluate/{product_id}` - Evaluate model performance
- `GET /api/dynamic-pricing/products` - Get all products with recommendations

## 🔧 Integration with Your Backend

### 1. Add Dynamic Pricing Endpoint to Your Backend

Add this to your `backend/app.js`:

```javascript
// Dynamic Pricing Integration
const DYNAMIC_PRICING_API = process.env.DYNAMIC_PRICING_API_URL || 'http://localhost:5002';

// Get dynamic pricing recommendation
app.get('/api/products/:productId/dynamic-price', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const response = await axios.get(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/predict/${productId}`);
    
    res.json({
      product_id: parseInt(productId),
      current_price: response.data.current_price,
      recommended_price: response.data.recommended_price,
      price_change_percent: response.data.price_change_percent,
      confidence: 0.85
    });
  } catch (error) {
    console.error('Dynamic pricing error:', error);
    res.status(500).json({ message: 'Failed to get dynamic pricing' });
  }
});

// Update product price with dynamic pricing
app.post('/api/admin/products/:productId/update-price', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { use_dynamic_pricing = false } = req.body;
    
    if (use_dynamic_pricing) {
      // Get dynamic pricing recommendation
      const pricingResponse = await axios.get(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/predict/${productId}`);
      const newPrice = pricingResponse.data.recommended_price;
      
      // Update price in database
      await pool.query(
        'UPDATE products SET price = $1, updated_at = NOW() WHERE product_id = $2',
        [newPrice, productId]
      );
      
      res.json({ 
        message: 'Price updated with dynamic pricing',
        old_price: pricingResponse.data.current_price,
        new_price: newPrice,
        change_percent: pricingResponse.data.price_change_percent
      });
    } else {
      // Manual price update (existing logic)
      const { price } = req.body;
      await pool.query(
        'UPDATE products SET price = $1, updated_at = NOW() WHERE product_id = $2',
        [price, productId]
      );
      res.json({ message: 'Price updated manually' });
    }
  } catch (error) {
    console.error('Price update error:', error);
    res.status(500).json({ message: 'Failed to update price' });
  }
});
```

### 2. Update Frontend to Show Dynamic Pricing

Add to your `frontend/src/components/ProductCard.jsx`:

```jsx
const [dynamicPricing, setDynamicPricing] = useState(null);

useEffect(() => {
  const fetchDynamicPricing = async () => {
    try {
      const response = await fetch(`${apiUrl}/products/${product.product_id}/dynamic-price`);
      if (response.ok) {
        const data = await response.json();
        setDynamicPricing(data);
      }
    } catch (error) {
      console.error('Error fetching dynamic pricing:', error);
    }
  };

  fetchDynamicPricing();
}, [product.product_id]);

// In your render method, add:
{dynamicPricing && dynamicPricing.price_change_percent > 5 && (
  <div className="dynamic-pricing-badge">
    <span className="trending-up">📈</span>
    <span>AI Recommended: ₹{dynamicPricing.recommended_price}</span>
  </div>
)}
```

## 🎛️ Configuration

### PPO Algorithm Parameters

Edit `config.py` to adjust PPO parameters:

```python
PPO_CONFIG = {
    'learning_rate': 3e-4,      # Learning rate
    'n_steps': 2048,            # Steps per update
    'batch_size': 64,           # Batch size
    'n_epochs': 10,             # Epochs per update
    'gamma': 0.99,              # Discount factor
    'clip_range': 0.2,          # PPO clip range
    'ent_coef': 0.01,           # Entropy coefficient
}
```

### Environment Parameters

```python
ENV_CONFIG = {
    'max_price_change_percent': 0.15,  # Max 15% price change
    'min_price_change_percent': 0.01,  # Min 1% price change
    'price_update_frequency_hours': 6, # Update every 6 hours
    'reward_weights': {
        'revenue': 0.4,              # Revenue weight
        'profit_margin': 0.3,        # Profit margin weight
        'customer_satisfaction': 0.2, # Customer satisfaction weight
        'inventory_health': 0.1      # Inventory health weight
    }
}
```

## 📈 Monitoring and Analytics

### TensorBoard Integration

Monitor training progress:

```bash
tensorboard --logdir ./logs/dynamic_pricing
```

### Performance Metrics

The system tracks:
- Revenue optimization
- Profit margin improvement
- Customer satisfaction impact
- Inventory turnover
- Price change frequency

## 🔄 Automated Price Updates

### Cron Job Setup

Add to your crontab for automated price updates:

```bash
# Update prices every 6 hours
0 */6 * * * curl -X POST http://localhost:5002/api/dynamic-pricing/batch-update \
  -H "Content-Type: application/json" \
  -d '{"product_ids": [1,2,3,4,5]}'

# Retrain models weekly
0 2 * * 0 python /path/to/dynamic_pricing/train.py --top-n 20
```

## 🛡️ Safety Features

- **Price Change Limits**: Maximum 15% price change per update
- **Profit Margin Protection**: Minimum 5% profit margin enforced
- **Audit Trail**: All price changes logged with reasons
- **Rollback Capability**: Easy rollback to previous prices
- **A/B Testing**: Compare dynamic vs static pricing

## 🚀 Deployment

### Production Setup

1. **Use production database**
2. **Set up monitoring and alerting**
3. **Configure backup and recovery**
4. **Set up load balancing for API**
5. **Implement rate limiting**

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5002

CMD ["python", "api.py"]
```

## 📚 Advanced Usage

### Custom Reward Functions

Modify the reward function in `environment.py`:

```python
def _calculate_reward(self, action: float, demand: float) -> float:
    # Add your custom business logic here
    base_reward = super()._calculate_reward(action, demand)
    
    # Add seasonal bonuses
    if self._is_peak_season():
        base_reward *= 1.2
    
    # Add inventory penalties
    if self.inventory_level < 10:
        base_reward *= 0.8
    
    return base_reward
```

### Multi-Product Optimization

Train models for product categories:

```python
# Train category-specific models
categories = [1, 2, 3]  # Electronics, Clothing, Food
for category in categories:
    products = get_products_by_category(category)
    train_category_model(products, category)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the logs in `training.log`
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Check TensorBoard for training insights

## 🎯 Next Steps

1. **Train models for your top products**
2. **Integrate with your existing backend**
3. **Set up automated price updates**
4. **Monitor performance and adjust parameters**
5. **Scale to more products and categories**

---

**Happy Dynamic Pricing! 🚀** 