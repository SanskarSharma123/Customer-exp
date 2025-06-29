import React from 'react';
import { useCompare } from '../contexts/CompareContext';
import '../css/SubcategoryConfirmDialog.css';

const SubcategoryConfirmDialog = () => {
  const { pendingProduct, confirmAddToCompare, cancelAddToCompare } = useCompare();

  if (!pendingProduct) {
    return null;
  }

  return (
    <div className="subcategory-confirm-overlay">
      <div className="subcategory-confirm-dialog">
        <div className="dialog-header">
          <h3>Different Subcategories</h3>
          <button 
            className="close-button"
            onClick={cancelAddToCompare}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        
        <div className="dialog-content">
          <div className="warning-icon">⚠️</div>
          <p className="dialog-message">
            You're trying to compare products from different subcategories:
          </p>
          
          <div className="subcategory-comparison">
            <div className="current-product">
              <span className="product-name">Current Product</span>
              <span className="subcategory-name">{pendingProduct.currentSubcategoryName}</span>
            </div>
            
            <div className="vs-separator">vs</div>
            
            <div className="new-product">
              <span className="product-name">{pendingProduct.productName}</span>
              <span className="subcategory-name">{pendingProduct.subcategoryName}</span>
            </div>
          </div>
          
          <p className="dialog-question">
            Do you still want to compare these products?
          </p>
        </div>
        
        <div className="dialog-actions">
          <button 
            className="cancel-button"
            onClick={cancelAddToCompare}
          >
            Cancel
          </button>
          <button 
            className="confirm-button"
            onClick={confirmAddToCompare}
          >
            Yes, Compare
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubcategoryConfirmDialog; 