import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/Dashboard.css";
import productImages from "../components/ProductImages";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await fetch(`${apiUrl}/profile`, {
          credentials: "include",
        });

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await profileResponse.json();
        setUser(profileData.user);

        // Fetch recent orders
        const ordersResponse = await fetch(`${apiUrl}/orders`, {
          credentials: "include",
        });

        if (!ordersResponse.ok) {
          throw new Error("Failed to fetch orders");
        }

        const ordersData = await ordersResponse.json();
        setOrders(ordersData.slice(0, 3)); // Get most recent 3 orders

        // Fetch featured products
        const productsResponse = await fetch(`${apiUrl}/products/featured`);

        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }

        const productsData = await productsResponse.json();
        setFeaturedProducts(productsData.slice(0, 6)); // Get first 6 featured products
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Getting your dashboard ready...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Helper function to safely format price
  const formatPrice = (price) => {
    const numericPrice = parseFloat(price);
    return !isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00';
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': { color: '#f59e0b', icon: '⏳', text: 'Pending' },
      'confirmed': { color: '#3b82f6', icon: '✅', text: 'Confirmed' },
      'processing': { color: '#8b5cf6', icon: '⚙️', text: 'Processing' },
      'out_for_delivery': { color: '#06b6d4', icon: '🚚', text: 'Out for Delivery' },
      'delivered': { color: '#10b981', icon: '📦', text: 'Delivered' }
    };
    return statusMap[status] || { color: '#6b7280', icon: '❓', text: status };
  };

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <div className="welcome-section">
            <h1>{getGreeting()}, <span className="user-name">{user?.name}</span>! 👋</h1>
            <p className="hero-subtitle">What would you like to order today?</p>
          </div>
          <div className="delivery-info">
            <div className="delivery-card">
              <div className="delivery-icon">🚚</div>
              <div className="delivery-details">
                <span className="delivery-label">Express Delivery</span>
                <span className="delivery-time">10-15 mins</span>
              </div>
            </div>
            <div className="location-info">
              <div className="location-icon">📍</div>
              <span>Hyderabad, Telangana</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-info">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Recent Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <span className="stat-number">{featuredProducts.length}</span>
            <span className="stat-label">Featured Items</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-number">
              ₹{orders.reduce((total, order) => total + parseFloat(order.total_amount || 0), 0).toFixed(0)}
            </span>
            <span className="stat-label">Total Spent</span>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <p className="section-subtitle">Browse through our popular categories</p>
        </div>
        <div className="categories-grid">
          <Link to="/products?category=1" className="category-card fruits">
            <div className="category-icon">🍎</div>
            <div className="category-info">
              <h3>Fruits & Vegetables</h3>
              <p>Fresh & Organic</p>
            </div>
            <div className="category-arrow">→</div>
          </Link>
          <Link to="/products?category=2" className="category-card dairy">
            <div className="category-icon">🥛</div>
            <div className="category-info">
              <h3>Dairy & Eggs</h3>
              <p>Farm Fresh</p>
            </div>
            <div className="category-arrow">→</div>
          </Link>
          <Link to="/products?category=3" className="category-card bakery">
            <div className="category-icon">🍞</div>
            <div className="category-info">
              <h3>Bakery</h3>
              <p>Freshly Baked</p>
            </div>
            <div className="category-arrow">→</div>
          </Link>
          <Link to="/products?category=4" className="category-card snacks">
            <div className="category-icon">🥤</div>
            <div className="category-info">
              <h3>Snacks & Beverages</h3>
              <p>Quick Bites</p>
            </div>
            <div className="category-arrow">→</div>
          </Link>
          <Link to="/products?category=5" className="category-card household">
            <div className="category-icon">🧹</div>
            <div className="category-info">
              <h3>Household</h3>
              <p>Daily Essentials</p>
            </div>
            <div className="category-arrow">→</div>
          </Link>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section className="recent-orders-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <Link to="/orders" className="view-all-link">
            View All Orders
            <span className="arrow">→</span>
          </Link>
        </div>
        <div className="orders-container">
          {orders.length > 0 ? (
            orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.order_id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">
                      <span className="order-label">Order</span>
                      <span className="order-number">#{order.order_id}</span>
                    </div>
                    <div className="order-status" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
                      <span className="status-icon">{statusInfo.icon}</span>
                      <span className="status-text">{statusInfo.text}</span>
                    </div>
                  </div>
                  <div className="order-details">
                    <div className="order-meta">
                      <div className="meta-item">
                        <span className="meta-label">Date</span>
                        <span className="meta-value">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Items</span>
                        <span className="meta-value">{order.items?.length || 0}</span>
                      </div>
                    </div>
                    <div className="order-total">
                      <span className="total-label">Total</span>
                      <span className="total-amount">₹{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                  <Link to={`/tracking/${order.order_id}`} className="track-button">
                    <span>Track Order</span>
                    <span className="track-icon">📍</span>
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="no-orders-state">
              <div className="empty-state-icon">🛒</div>
              <h3>No orders yet</h3>
              <p>Start shopping to see your orders here</p>
              <Link to="/products" className="shop-now-button">
                <span>Start Shopping</span>
                <span className="button-icon">🛍️</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products-section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <Link to="/products" className="view-all-link">
            View All Products
            <span className="arrow">→</span>
          </Link>
        </div>
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <div key={product.product_id} className="product-card">
              <div className="product-image-container">
                <img
                  src={productImages[product.product_id] || '/images/placeholder-product.jpg'}
                  alt={product.name}
                  className="product-image"
                />
                {product.discount_price && (
                  <div className="discount-badge">
                    {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                  </div>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-pricing">
                  {product.discount_price ? (
                    <div className="price-container">
                      <span className="current-price">₹{formatPrice(product.discount_price)}</span>
                      <span className="original-price">₹{formatPrice(product.price)}</span>
                    </div>
                  ) : (
                    <span className="current-price">₹{formatPrice(product.price)}</span>
                  )}
                  <span className="product-unit">/ {product.unit}</span>
                </div>
                <button
                  className="add-to-cart-button"
                  onClick={async (event) => {
                    try {
                      await fetch(`${apiUrl}/cart/items`, {
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
                      // Show success feedback
                      const button = event.target;
                      const originalText = button.textContent;
                      button.textContent = "Added! ✓";
                      button.style.backgroundColor = "#10b981";
                      setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = "";
                      }, 2000);
                    } catch (error) {
                      console.error("Error adding to cart:", error);
                      alert("Failed to add item to cart. Please try again.");
                    }
                  }}
                >
                  <span className="cart-icon">🛒</span>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;