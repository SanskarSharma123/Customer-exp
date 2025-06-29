import React, { useState, useEffect } from 'react';
import { useCompare } from '../contexts/CompareContext';
import ProductCard from './ProductCard';
import '../css/SimilarProductsSection.css';

const SimilarProductsSection = ({ categoryId, subcategoryId, product1Id, product2Id }) => {
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedProducts = [], addToCompare, removeFromCompare, replaceInCompare } = useCompare();

  useEffect(() => {
    fetchSimilarProducts();
  }, [selectedProducts, categoryId, subcategoryId]);

  const fetchSimilarProducts = async () => {
    if (!selectedProducts || selectedProducts.length === 0) {
      setSimilarProducts([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const productIds = selectedProducts.join(',');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/products/similar?product_ids=${productIds}&category_id=${categoryId}&subcategory_id=${subcategoryId}&limit=8`
      );
      const data = await response.json();
      
      if (data.success) {
        setSimilarProducts(data.similar_products || []);
      } else {
        setSimilarProducts([]);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
      setSimilarProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCompare = (product) => {
    if (!selectedProducts) return;
    
    if (selectedProducts.length >= 2) {
      alert('You can compare maximum 2 products at a time');
      return;
    }
    addToCompare(product.product_id, product.category_id, product.subcategory_id, product.name, product.subcategory_name);
  };

  const handleRemoveFromCompare = (productId) => {
    removeFromCompare(productId);
  };

  const handleReplace = (slot, product) => {
    let indexToReplace = -1;
    if (slot === 1 && product1Id) {
      indexToReplace = selectedProducts.findIndex(id => id === product1Id);
    } else if (slot === 2 && product2Id) {
      indexToReplace = selectedProducts.findIndex(id => id === product2Id);
    }
    if (indexToReplace !== -1) {
      replaceInCompare(indexToReplace, product.product_id, product.category_id, product.subcategory_id, product.name, product.subcategory_name);
    }
  };

  if (!selectedProducts || selectedProducts.length === 0) return null;

  return (
    <div className="similar-products-section">
      <h3>Similar Products You Might Like</h3>
      
      {loading ? (
        <div className="loading">Loading similar products...</div>
      ) : (
        <div className="similar-products-grid">
          {similarProducts.map(product => {
            const isInComparison = selectedProducts.includes(product.product_id);
            return (
              <div key={product.product_id} className="similar-product-card">
                <ProductCard product={product} />
                <div className="compare-actions">
                  {isInComparison ? (
                    <button 
                      className="remove-from-compare"
                      onClick={() => handleRemoveFromCompare(product.product_id)}
                    >
                      Remove from Compare
                    </button>
                  ) : selectedProducts.length === 2 ? (
                    <div className="replace-actions">
                      <button className="replace-btn" onClick={() => handleReplace(1, product)}>
                        Replace Product 1
                      </button>
                      <button className="replace-btn" onClick={() => handleReplace(2, product)}>
                        Replace Product 2
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="add-to-compare"
                      onClick={() => handleAddToCompare(product)}
                    >
                      Add to Compare
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SimilarProductsSection; 