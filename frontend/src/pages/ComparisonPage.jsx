import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../config/config';
import '../css/ComparisonPage.css';
import productImages from "../components/ProductImages";
import ProductCard from '../components/ProductCard';
import ConfirmDialog from '../components/ConfirmDialog';

const ComparisonPage = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [similarProducts, setSimilarProducts] = useState([]);
  const [replacing, setReplacing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingReplace, setPendingReplace] = useState(null); // {replaceIdx, newProduct}
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const productIds = searchParams.get('ids');
        
        if (!productIds) {
          throw new Error('No products selected for comparison');
        }

        const response = await axios.get(`${apiUrl}/products/compare?ids=${productIds}`);
        setComparisonData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [location.search]);

  // Fetch similar products after comparison data loads
  useEffect(() => {
    if (!comparisonData || !comparisonData.products) return;
    const subcategoryIds = comparisonData.products.map(p => p.subcategory_id).filter(Boolean);
    const excludeIds = comparisonData.products.map(p => p.product_id);
    // Use the category_id of the compared products (assume both have the same category)
    const categoryId = comparisonData.products[0]?.category_id;
    if (subcategoryIds.length === 0 || !categoryId) return;
    axios.post(`${apiUrl}/products/similar-in-subcategories`, {
      subcategory_ids: subcategoryIds,
      exclude_product_ids: excludeIds,
      category_id: categoryId
    })
      .then(res => setSimilarProducts(res.data))
      .catch(() => setSimilarProducts([]));
  }, [comparisonData]);

  // Helper function to get product image
  const getProductImage = (product) => {
    const productId = product.product_id || product.id;
    return productImages[productId] || product.image_url || '/images/placeholder.jpg';
  };

  // Helper function to check if values are different
  const areValuesDifferent = (values) => {
    const uniqueValues = [...new Set(values.map(v => v?.toString()))];
    return uniqueValues.length > 1;
  };

  // Helper function to get best value for numeric attributes
  const getBestValue = (values, attributeName) => {
    if (!values || values.length === 0) return null;
    
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (numericValues.length === 0) return null;
    
    // Define attributes where higher is better
    const higherIsBetter = ['rating', 'warranty', 'capacity', 'memory', 'storage'];
    // Define attributes where lower is better
    const lowerIsBetter = ['price', 'weight'];
    
    const attributeLower = attributeName.toLowerCase();
    
    if (higherIsBetter.some(attr => attributeLower.includes(attr))) {
      return Math.max(...numericValues);
    } else if (lowerIsBetter.some(attr => attributeLower.includes(attr))) {
      return Math.min(...numericValues);
    }
    
    return null;
  };

  // Helper to check if subcategory is different (compare newProduct with the other product)
  const isDifferentSubcategory = (replaceIdx, newProduct) => {
    if (!comparisonData || !comparisonData.products) return false;
    const otherIdx = replaceIdx === 0 ? 1 : 0;
    const otherProduct = comparisonData.products[otherIdx];
    return otherProduct.subcategory_id !== newProduct.subcategory_id;
  };

  // Replacement logic with subcategory check
  const handleReplace = (replaceIdx, newProduct) => {
    if (!comparisonData || !comparisonData.products) return;
    // Check subcategory difference
    if (isDifferentSubcategory(replaceIdx, newProduct)) {
      setPendingReplace({ replaceIdx, newProduct });
      setConfirmMessage('These products are from different subcategories. Do you still want to compare them?');
      setConfirmOpen(true);
      return;
    }
    doReplace(replaceIdx, newProduct);
  };

  const doReplace = (replaceIdx, newProduct) => {
    setReplacing(true);
    // Always replace the product at replaceIdx (0 or 1)
    const newProducts = [...comparisonData.products];
    newProducts[replaceIdx] = newProduct;
    const newIds = newProducts.map(p => p.product_id);
    localStorage.setItem('compareProducts', JSON.stringify(newIds));
    localStorage.setItem('compareCategory', String(newProduct.category_id));
    localStorage.setItem('compareSubcategory', String(newProduct.subcategory_id));
    navigate(`/compare?ids=${newIds.join(',')}`);
    setReplacing(false);
  };

  const handleConfirm = () => {
    if (pendingReplace) {
      doReplace(pendingReplace.replaceIdx, pendingReplace.newProduct);
      setPendingReplace(null);
      setConfirmOpen(false);
    }
  };

  const handleCancel = () => {
    setPendingReplace(null);
    setConfirmOpen(false);
  };

  // Clear comparison selection when navigating back or on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('compareProducts');
      localStorage.removeItem('compareCategory');
      window.dispatchEvent(new Event('compareProductsChanged'));
    };
  }, []);

  if (loading) {
    return (
      <div className="comparison-loading">
        <div className="loading-spinner"></div>
        <p>Loading comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comparison-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Comparison</h3>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="retry-button">
          Go Back
        </button>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="comparison-empty">
        <div className="empty-state-icon">📊</div>
        <h3>No Products to Compare</h3>
        <p>Please select products to compare from the product listing page.</p>
        <button onClick={() => navigate('/products')} className="shop-now-button">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="comparison-container">
      {/* Hero Section */}
      <div className="comparison-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Product Comparison</h1>
            <p className="hero-subtitle">
              Compare {comparisonData.products.length} products side by side
            </p>
          </div>
          <div className="hero-actions">
            <button onClick={() => {
              localStorage.removeItem('compareProducts');
              localStorage.removeItem('compareCategory');
              window.dispatchEvent(new Event('compareProductsChanged'));
              navigate('/products');
            }} className="back-button">
              <span className="back-icon">←</span>
              Back to Products
            </button>
            <button 
              onClick={() => setHighlightDifferences(!highlightDifferences)}
              className={`highlight-toggle ${highlightDifferences ? 'active' : ''}`}
            >
              <span className="toggle-icon">🔍</span>
              {highlightDifferences ? 'Show All' : 'Highlight Differences'}
            </button>
          </div>
        </div>
      </div>

      {/* Products Overview Cards */}
      <div className="products-overview">
        {comparisonData.products.map((product, idx) => (
          <div key={idx} className="product-overview-card">
            <div className="product-image-container">
              <img 
                src={getProductImage(product)}
                alt={product.name} 
                className="product-image"
                onError={(e) => {
                  if (e.target.src !== product.image_url && product.image_url) {
                    e.target.src = product.image_url;
                  } else {
                    e.target.src = '/images/placeholder.jpg';
                  }
                  e.target.onerror = null;
                }}
              />
              {product.discount_price && (
                <div className="discount-badge">
                  {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                </div>
              )}
            </div>
            <div className="product-overview-info">
              <h3 className="product-name">{product.name}</h3>
              {product.subcategory_name && (
                <div className="product-subcategory">
                  <span className="subcategory-badge">{product.subcategory_name}</span>
                </div>
              )}
              <div className="product-pricing">
                {product.discount_price ? (
                  <div className="price-container">
                    <span className="current-price">₹{product.discount_price.toLocaleString()}</span>
                    <span className="original-price">₹{product.price.toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="current-price">₹{product.price.toLocaleString()}</span>
                )}
              </div>
              <div className="product-rating">
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < Math.floor(product.average_rating) ? 'filled' : ''}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-text">
                  {product.average_rating} ({product.review_count} reviews)
                </span>
              </div>
              <button className="add-to-cart-button">
                <span className="cart-icon">🛒</span>
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="comparison-table-container">
        <h2 className="table-title">Detailed Comparison</h2>
        <div className="comparison-table">
          {comparisonData.commonAttributes.map((attr, idx) => {
            const isDifferent = areValuesDifferent(attr.values);
            const bestValue = getBestValue(attr.values, attr.name);
            
            // Skip rendering if highlighting differences and values are the same
            if (highlightDifferences && !isDifferent) {
              return null;
            }

            return (
              <div 
                key={idx} 
                className={`comparison-row ${isDifferent ? 'has-differences' : ''}`}
                data-attribute={attr.name.toLowerCase()}
              >
                <div className="attribute-name">
                  <span className="attribute-label">{attr.name}</span>
                  {isDifferent && <span className="difference-indicator">•</span>}
                </div>
                {attr.values.map((value, i) => {
                  const isNumeric = !isNaN(parseFloat(value));
                  const isBest = bestValue !== null && isNumeric && parseFloat(value) === bestValue;
                  
                  return (
                    <div key={i} className={`attribute-value ${isBest ? 'best-value' : ''}`}>
                      <span className="value-text">
                        {value !== null && value !== undefined ? value.toString() : 'N/A'}
                      </span>
                      {isBest && <span className="best-badge">Best</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div className="similar-products-section">
          <h2 className="similar-title">Similar products that you might like</h2>
          <div className="similar-products-list">
            {similarProducts.map((product, idx) => (
              <div key={product.product_id || idx} className="similar-product-card">
                <ProductCard product={product} />
                <div className="replace-actions">
                  <button
                    className="replace-btn"
                    disabled={replacing}
                    onClick={() => handleReplace(0, product)}
                  >
                    Replace Product 1
                  </button>
                  <button
                    className="replace-btn"
                    disabled={replacing}
                    onClick={() => handleReplace(1, product)}
                  >
                    Replace Product 2
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="comparison-actions">
        <button onClick={() => window.print()} className="print-button">
          <span className="print-icon">🖨️</span>
          Print Comparison
        </button>
        <button onClick={() => navigate('/products')} className="continue-shopping-button">
          <span className="shop-icon">🛍️</span>
          Continue Shopping
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Compare products from different subcategories?"
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ComparisonPage;