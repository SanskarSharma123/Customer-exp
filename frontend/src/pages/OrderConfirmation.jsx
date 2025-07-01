import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/OrderConfirmation.css";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  if (!orderId) {
    return null;
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p>Your order has been placed successfully.</p>
        <div className="order-details">
          <p>
            <strong>Order ID:</strong> #{orderId}
          </p>
          <p>
            <strong>Estimated Delivery:</strong> Within 15 minutes
          </p>
        </div>
        <div className="action-buttons">
          <button
            className="track-order"
            onClick={() => navigate(`/tracking/${orderId}`)}
          >
            Track Order
          </button>
          <button className="continue-shopping" onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;