import React, { useState, useEffect } from 'react';
import { dynamicPricingApiUrl } from '../config/config';
import '../css/DynamicPricingDashboard.css';

const DynamicPricingDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [trainingStatus, setTrainingStatus] = useState({});
  const [stats, setStats] = useState({
    totalProducts: 0,
    trainedModels: 0,
    activePricing: 0,
    avgRevenueIncrease: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${dynamicPricingApiUrl}/admin/dynamic-pricing/products`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched products:', data.products); // Debug log
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from products data
      const totalProducts = products.length;
      const trainedModels = products.filter(p => p.recommended_price !== null).length;
      const activePricing = products.filter(p => p.price_change_percent > 5).length;
      
      setStats({
        totalProducts,
        trainedModels,
        activePricing,
        avgRevenueIncrease: 12.5 // Placeholder - would come from actual data
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.product_id));
    }
  };

  const trainModel = async (productId) => {
    try {
      setTrainingStatus(prev => ({ ...prev, [productId]: 'training' }));
      
      const response = await fetch(`${dynamicPricingApiUrl}/admin/dynamic-pricing/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId, total_timesteps: 100000 })
      });

      if (response.ok) {
        setTrainingStatus(prev => ({ ...prev, [productId]: 'completed' }));
        setTimeout(() => {
          setTrainingStatus(prev => ({ ...prev, [productId]: null }));
        }, 3000);
      } else {
        setTrainingStatus(prev => ({ ...prev, [productId]: 'failed' }));
      }
    } catch (error) {
      console.error('Error training model:', error);
      setTrainingStatus(prev => ({ ...prev, [productId]: 'failed' }));
    }
  };

  const updatePrices = async (forceUpdate = false) => {
    if (selectedProducts.length === 0) {
      alert('Please select products to update');
      return;
    }

    try {
      const response = await fetch(`${dynamicPricingApiUrl}/admin/dynamic-pricing/batch-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          product_ids: selectedProducts, 
          force_update: forceUpdate 
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Updated ${result.results.filter(r => r.status === 'success').length} products`);
        fetchProducts(); // Refresh data
        setSelectedProducts([]);
      } else {
        alert('Failed to update prices');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      alert('Error updating prices');
    }
  };

  const getStatusBadge = (product) => {
    if (product.recommended_price === null) {
      return <span className="status-badge not-trained">Not Trained</span>;
    }
    
    const changePercent = product.price_change_percent;
    if (typeof changePercent !== 'number' || isNaN(changePercent)) {
        return <span className="status-badge unknown">Unknown Change</span>;
      }
    if (changePercent > 10) {
      return <span className="status-badge high-change">High Change ({changePercent.toFixed(1)}%)</span>;
    } else if (changePercent > 5) {
      return <span className="status-badge medium-change">Medium Change ({changePercent.toFixed(1)}%)</span>;
    } else {
      return <span className="status-badge low-change">Low Change ({changePercent.toFixed(1)}%)</span>;
    }
  };

  if (loading) {
    return (
      <div className="dynamic-pricing-dashboard">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dynamic-pricing-dashboard">
      <div className="dashboard-header">
        <h1>🤖 Dynamic Pricing Dashboard</h1>
        <p>AI-powered price optimization using PPO algorithm</p>
      </div>

      {/* Debug: Show raw products data */}
      <pre style={{maxHeight: 300, overflow: 'auto', background: '#eee', fontSize: 12}}>
        {JSON.stringify(products, null, 2)}
      </pre>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧠</div>
          <div className="stat-content">
            <h3>{stats.trainedModels}</h3>
            <p>Trained Models</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{stats.activePricing}</h3>
            <p>Active Pricing</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.avgRevenueIncrease}%</h3>
            <p>Avg Revenue Increase</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <div className="selection-controls">
          <button 
            className="select-all-btn"
            onClick={handleSelectAll}
          >
            {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="selected-count">
            {selectedProducts.length} products selected
          </span>
        </div>
        
        <div className="action-buttons">
          <button 
            className="train-btn"
            onClick={() => selectedProducts.forEach(trainModel)}
            disabled={selectedProducts.length === 0}
          >
            🧠 Train Models
          </button>
          <button 
            className="update-btn"
            onClick={() => updatePrices(false)}
            disabled={selectedProducts.length === 0}
          >
            ⚡ Update Prices
          </button>
          <button 
            className="force-update-btn"
            onClick={() => updatePrices(true)}
            disabled={selectedProducts.length === 0}
          >
            🔥 Force Update
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Product</th>
              <th>Current Price</th>
              <th>Recommended Price</th>
              <th>Change %</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>
                  No products found.
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.product_id || product.id || Math.random()}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedProducts.includes(product.product_id)}
                      onChange={() => handleProductSelect(product.product_id)}
                    />
                  </td>
                  <td>
                    <div className="product-info">
                      <img 
                        src={product.image_url || '/images/placeholder-product.jpg'} 
                        alt={product.name || 'Product'}
                        className="product-thumbnail"
                      />
                      <div>
                        <div className="product-name">{product.name || 'Unnamed'}</div>
                        <div className="product-category">{product.category_name || 'Unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td>₹{product.price ? product.price.toFixed(2) : '0.00'}</td>
                  <td>
                    {product.recommended_price !== null && product.recommended_price !== undefined ? (
                      <span className="recommended-price">
                        ₹{product.recommended_price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="no-recommendation">No recommendation</span>
                    )}
                  </td>
                  <td>
                    {typeof product.price_change_percent === 'number' ? (
                      <span className={`change-percent ${product.price_change_percent > 10 ? 'high' : product.price_change_percent > 5 ? 'medium' : 'low'}`}>
                        {product.price_change_percent > 0 ? '+' : ''}{product.price_change_percent.toFixed(1)}%
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>{getStatusBadge(product)}</td>
                  <td>
                    <div className="action-buttons-small">
                      <button 
                        className="train-btn-small"
                        onClick={() => trainModel(product.product_id)}
                        disabled={trainingStatus[product.product_id] === 'training'}
                      >
                        {trainingStatus[product.product_id] === 'training' ? '🔄' : '🧠'}
                      </button>
                      <button 
                        className="update-btn-small"
                        onClick={() => updatePrices([product.product_id])}
                        disabled={!product.recommended_price}
                      >
                        ⚡
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Training Status */}
      {Object.keys(trainingStatus).length > 0 && (
        <div className="training-status">
          <h3>Training Status</h3>
          {Object.entries(trainingStatus).map(([productId, status]) => (
            <div key={productId} className={`training-item ${status}`}>
              Product {productId}: {status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicPricingDashboard; 