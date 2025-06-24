import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../config/config";
import RatingStars from "./RatingStars";
import "../css/ProductCard.css";
import productImages from "../components/ProductImages";

const ProductCard = ({ product }) => {
  const [isSelectedForCompare, setIsSelectedForCompare] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Initialize compare selection from localStorage
  useEffect(() => {
    const currentSelections = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    setIsSelectedForCompare(currentSelections.includes(product.product_id));
  }, [product.product_id]);

  const toggleCompare = () => {
    const currentSelections = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    let updatedSelections;

    if (isSelectedForCompare) {
      // Remove from selection
      updatedSelections = currentSelections.filter(id => id !== product.product_id);
    } else {
      // Add to selection (limit to 2)
      if (currentSelections.length >= 2) {
        alert('You can compare maximum 2 products at a time');
        return;
      }
      updatedSelections = [...currentSelections, product.product_id];
    }

    localStorage.setItem('compareProducts', JSON.stringify(updatedSelections));
    setIsSelectedForCompare(!isSelectedForCompare);
  };

  const addToCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.product_id,
          quantity: 1,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "0.00";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  const calculateDiscountPercentage = () => {
    if (product.discount_price && product.price) {
      const discount = ((product.price - product.discount_price) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="product-card">
      {/* Discount Badge */}
      {product.discount_price && (
        <div className="discount-badge">
          -{calculateDiscountPercentage()}%
        </div>
      )}
      
      {/* Compare Badge */}
      {isSelectedForCompare && (
        <div className="compare-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
      )}

      {/* Product Image */}
      <Link to={`/products/${product.product_id}`} className="product-image-link">
        <div className="product-image-container">
          {!imageError ? (
            <img
              src={productImages[product.product_id] || '/images/placeholder-product.jpg'}
              alt={product.name}
              className="product-image"
              onError={handleImageError}
            />
          ) : (
            <div className="image-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
          )}
        </div>
      </Link>
      
      {/* Product Content */}
      <div className="product-content">
        {/* Rating Section */}
        <div className="product-rating">
          <RatingStars rating={product.average_rating} />
          <span className="review-count">({product.review_count || 0})</span>
        </div>

        {/* Product Title */}
        <Link to={`/products/${product.product_id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>

        {/* Product Description */}
        {product.description && (
          <p className="product-description">
            {product.description.length > 80 
              ? `${product.description.substring(0, 80)}...` 
              : product.description}
          </p>
        )}

        {/* Pricing Section */}
        <div className="product-pricing">
          <div className="price-container">
            {product.discount_price ? (
              <div className="price-group">
                <span className="discounted-price">
                  ₹{formatPrice(product.discount_price)}
                </span>
                <span className="original-price">
                  ₹{formatPrice(product.price)}
                </span>
              </div>
            ) : (
              <span className="current-price">₹{formatPrice(product.price)}</span>
            )}
            <span className="product-unit">per {product.unit}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="product-actions">
          <button 
            className={`add-to-cart ${isLoading ? 'loading' : ''}`}
            onClick={addToCart}
            disabled={isLoading}
            aria-label={`Add ${product.name} to cart`}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Adding...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                Add to Cart
              </>
            )}
          </button>
          
          <button 
            className={`compare-btn ${isSelectedForCompare ? 'selected' : ''}`}
            onClick={toggleCompare}
            aria-label={`${isSelectedForCompare ? 'Remove from' : 'Add to'} comparison`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.25l1.25-1.25-2.75-2.75V21H3V3h1.25L9 7.75V6h1.5L12 7.5 13.5 6H15v1.75L18.75 4.25 20 5.5 15.25 10.25H17v1.5L15.5 13 17 14.5v1.5h-1.75L20.25 20.75z"/>
            </svg>
            {isSelectedForCompare ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;