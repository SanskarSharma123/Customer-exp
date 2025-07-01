import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/Orders.css";
import productImages from "../components/ProductImages";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${apiUrl}/orders`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch orders");
        }

        setOrders(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Helper function to get product image
  const getProductImage = (item) => {
    // Try different possible ID properties
    const productId = item.product_id || item.id;
    return productImages[productId] || item.image_url || '/images/placeholder-product.jpg';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Helper function to safely format price
  const formatPrice = (price) => {
    const numericPrice = parseFloat(price);
    return !isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00';
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
          <button onClick={() => navigate("/products")}>Start Shopping</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.order_id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.order_id}</h3>
                  <p className="order-date">{formatDate(order.created_at)}</p>
                </div>
                <span className={`order-status status-${order.status}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>

              <div className="order-details">
                <div className="order-items">
                  {order.items.slice(0, 3).map(item => (
                    <div key={item.order_item_id} className="order-item">
                      <img 
                        src={getProductImage(item)}
                        alt={item.name} 
                        className="item-image"
                        onError={(e) => {
                          // First fallback: try API image if local image fails
                          if (e.target.src !== item.image_url && item.image_url) {
                            e.target.src = item.image_url;
                          } else {
                            // Second fallback: placeholder image
                            e.target.src = '/images/placeholder-product.jpg';
                          }
                          // Prevent infinite error loop
                          e.target.onerror = null;
                        }}
                      />
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <p>{item.quantity} x ₹{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="more-items">+ {order.items.length - 3} more items</p>
                  )}
                </div>

                <div className="order-summary">
                  <div className="summary-row">
                    <span>Total Amount:</span>
                    <span>₹{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Fee:</span>
                    <span>₹{formatPrice(order.delivery_fee)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Payment Method:</span>
                    <span>{order.payment_method.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="order-actions">
                <button 
                  onClick={() => navigate(`/tracking/${order.order_id}`)}
                  className="track-button"
                >
                  Track Order
                </button>
                <button className="reorder-button">Reorder</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;