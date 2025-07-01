import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../config/config";
import RatingStars from "../components/RatingStars";
import ReviewForm from "../components/ReviewForm";
import "../css/ProductDetails.css";
import productImages from "../components/ProductImages";
import { useNavigate } from "react-router-dom";

const ProductDetails = () => {
    
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    

    // Add price formatting function
    const formatPrice = (price) => {
        if (price === null || price === undefined) return '0.00';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    };
    const fetchProduct = async () => {
      try {
          const response = await fetch(`${apiUrl}/products/${productId}`);
          if (!response.ok) throw new Error("Failed to fetch product");
          const data = await response.json();
          setProduct(data);
      } catch (error) {
          setError(error.message);
      }
  };
  const handleHelpful = async (reviewId) => {
    try {
      const response = await fetch(`${apiUrl}/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        credentials: 'include' // Required for cookies
      });
      
      if (!response.ok) throw new Error('Failed to update helpful count');
      
      const data = await response.json();
      
      // Update the reviews state with new helpful count
      setReviews(reviews.map(review => 
        review.review_id === reviewId 
          ? { ...review, helpful_count: data.helpfulCount } 
          : review
      ));
    } catch (error) {
      console.error('Error marking review helpful:', error);
      // Optionally show error to user
    }
  };


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");
                
                const productResponse = await fetch(`${apiUrl}/products/${productId}`);
                if (!productResponse.ok) {
                    if (productResponse.status === 404) {
                        throw new Error("Product not found");
                    }
                    throw new Error("Failed to fetch product");
                }
                
                const reviewsResponse = await fetch(`${apiUrl}/products/${productId}/reviews`);
                
                const productData = await productResponse.json();
                const reviewsData = await reviewsResponse.json();
                
                setProduct(productData);
                setReviews(reviewsData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId]);

    const handleNewReview = (newReview) => {
        setReviews([newReview, ...reviews]);
        fetchProduct();
    };

    if (loading) return <div className="loading">Loading product...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!product) return <div className="error">Product not found</div>;
    const handleAddToCart = async () => {
      try {
        const response = await fetch(`${apiUrl}/cart/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: productId,
            quantity: 1
          }),
          credentials: "include",
        });
    
        if (!response.ok) {
          throw new Error("Failed to add item to cart");
        }
    
        // Navigate to cart page
        navigate("/cart");
      } catch (error) {
        console.error("Error adding to cart:", error);
        // You can add error handling here if needed
      }
    };
    return (
        <div className="product-details">
          <div className="product-main">
            {/* Add image container div */}
            <div className="product-image-container">
              <img 
                src={productImages[product.product_id] || '/images/placeholder-product.jpg'}
                alt={product.name}
                className="product-image"
              />
            </div>
            
            <div className="product-info">
              <h1>{product.name}</h1>
              <div className="price-section">
                {product.discount_price ? (
                  <>
                    <span className="current-price">
                      ₹{formatPrice(product.discount_price)}
                    </span>
                    <span className="original-price">
                      ₹{formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="current-price">
                    ₹{formatPrice(product.price)}
                  </span>
                )}
                <span className="unit">/ {product.unit}</span>
              </div>
              <div className="rating-section">
                <RatingStars rating={product.average_rating} />
                <span>({product.review_count} reviews)</span>
              </div>
              <button className="add-to-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
            </div>
          </div>

            <div className="reviews-section">
                <h2>Customer Reviews</h2>
                <ReviewForm productId={productId} onReviewSubmit={handleNewReview} />
                
                <div className="reviews-list">
                    {reviews.map(review => (
                        <div key={review.review_id} className="review">
                            <div className="review-header">
                                <h4>{review.user_name}</h4>
                                <div className="review-meta">
                                    <RatingStars rating={review.rating} />
                                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <p>{review.comment}</p>
                            <div className="helpful-section">
                            <button 
                              className="helpful-button"
                              onClick={() => handleHelpful(review.review_id)}
                            >
                              Helpful ({review.helpful_count})
                            </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;