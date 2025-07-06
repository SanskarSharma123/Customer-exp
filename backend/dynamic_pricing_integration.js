/**
 * Dynamic Pricing Integration for Backend
 * Add this to your existing app.js or create a separate module
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken, isAdmin } = require('./auth_middleware');
// Dynamic Pricing API Configuration
const DYNAMIC_PRICING_API = process.env.DYNAMIC_PRICING_API_URL || 'http://localhost:5001';

/**
 * Get dynamic pricing recommendation for a product
 */
const getDynamicPricingRecommendation = async (productId) => {
  try {
    const response = await axios.get(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/predict/${productId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Dynamic pricing API error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update product price using dynamic pricing
 */
const updatePriceWithDynamicPricing = async (productId, forceUpdate = false) => {
  try {
    const response = await axios.post(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/update-price/${productId}`, {
      force_update: forceUpdate
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Dynamic pricing update error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Batch update prices for multiple products
 */
const batchUpdatePrices = async (productIds, forceUpdate = false) => {
  try {
    const response = await axios.post(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/batch-update`, {
      product_ids: productIds,
      force_update: forceUpdate
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Batch update error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Train dynamic pricing model for a product
 */
const trainDynamicPricingModel = async (productId, totalTimesteps = 100000) => {
  try {
    const response = await axios.post(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/train`, {
      product_id: productId,
      total_timesteps: totalTimesteps
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Training error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get model status for a product
 */
const getModelStatus = async (productId) => {
  try {
    const response = await axios.get(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/status/${productId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Status check error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Evaluate model performance
 */
const evaluateModel = async (productId) => {
  try {
    const response = await axios.get(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/evaluate/${productId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Evaluation error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get dynamic pricing recommendation for a product
 */
router.get('/api/products/:productId/dynamic-price', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate product exists
    const productResult = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const result = await getDynamicPricingRecommendation(productId);
    
    if (result.success) {
      res.json({
        product_id: parseInt(productId),
        current_price: result.data.current_price,
        recommended_price: result.data.recommended_price,
        price_change_percent: result.data.price_change_percent,
        market_conditions: result.data.market_conditions,
        confidence: 0.85,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to get dynamic pricing',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Dynamic pricing endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update product price with dynamic pricing (Admin only)
 */
router.post('/api/admin/products/:productId/update-price', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { use_dynamic_pricing = false, force_update = false } = req.body;
    
    // Validate product exists
    const productResult = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (use_dynamic_pricing) {
      // Use dynamic pricing
      const result = await updatePriceWithDynamicPricing(productId, force_update);
      
      if (result.success) {
        const { old_price, new_price, price_change_percent } = result.data;
        
        // Update price in database
        await pool.query(
          'UPDATE products SET price = $1, updated_at = NOW() WHERE product_id = $2',
          [new_price, productId]
        );
        
        res.json({ 
          message: 'Price updated with dynamic pricing',
          product_id: parseInt(productId),
          old_price: old_price,
          new_price: new_price,
          price_change_percent: price_change_percent,
          method: 'dynamic_pricing',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to update price with dynamic pricing',
          error: result.error 
        });
      }
    } else {
      // Manual price update
      const { price } = req.body;
      
      if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({ message: 'Invalid price value' });
      }
      
      const oldPrice = productResult.rows[0].price;
      
      await pool.query(
        'UPDATE products SET price = $1, updated_at = NOW() WHERE product_id = $2',
        [price, productId]
      );
      
      res.json({ 
        message: 'Price updated manually',
        product_id: parseInt(productId),
        old_price: oldPrice,
        new_price: price,
        price_change_percent: ((price - oldPrice) / oldPrice) * 100,
        method: 'manual',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Price update error:', error);
    res.status(500).json({ message: 'Failed to update price' });
  }
});

/**
 * Train dynamic pricing model (Admin only)
 */
router.post('/api/admin/dynamic-pricing/train', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { product_id, total_timesteps = 100000 } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ message: 'product_id is required' });
    }
    
    const result = await trainDynamicPricingModel(product_id, total_timesteps);
    
    if (result.success) {
      res.json({
        message: 'Training started successfully',
        product_id: product_id,
        total_timesteps: total_timesteps,
        status: 'training'
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to start training',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Training endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get model status (Admin only)
 */
router.get('/api/admin/dynamic-pricing/status/:productId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = await getModelStatus(productId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ 
        message: 'Failed to get model status',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Status endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Evaluate model performance (Admin only)
 */
router.get('/api/admin/dynamic-pricing/evaluate/:productId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = await evaluateModel(productId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ 
        message: 'Failed to evaluate model',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Evaluation endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Batch update prices (Admin only)
 */
router.post('/api/admin/dynamic-pricing/batch-update', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { product_ids, force_update = false } = req.body;
    
    if (!product_ids || !Array.isArray(product_ids)) {
      return res.status(400).json({ message: 'product_ids array is required' });
    }
    
    const result = await batchUpdatePrices(product_ids, force_update);
    
    if (result.success) {
      res.json({
        message: 'Batch update completed',
        results: result.data.results,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to perform batch update',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Batch update endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get all products with dynamic pricing recommendations (Admin only)
 */
router.get('/admin/dynamic-pricing/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await axios.get(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/products`);
    if (result.status === 200) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: 'Failed to get products with pricing' });
    }
  } catch (error) {
    console.error('Products endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// router.get('/admin/dynamic-pricing/products', authenticateToken, isAdmin, async (req, res) => {
//   try {
//     const result = await axios.get(`${DYNAMIC_PRICING_API}/api/dynamic-pricing/products`);
//     if (result.status === 200) {
//       res.json(result.data);
//     } else {
//       res.status(500).json({ message: 'Failed to get products with pricing' });
//     }
//   } catch (error) {
//     console.error('Products endpoint error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// Export the router
module.exports = router; 