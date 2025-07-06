import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import AddressForm from "../components/AddressForm";
import "../css/Cart.css";
import productImages from "../components/ProductImages";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [placingOrder, setPlacingOrder] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const navigate = useNavigate();


  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
  console.log("WebSocket state changed:", {
    connected: wsConnected,
    placingOrder: placingOrder,
    selectedAddress: selectedAddress
  });
}, [wsConnected, placingOrder, selectedAddress]);
// Helper function to get cookie value
const getTokenFromStorage = () => {
  try {
    // Debug: Log all localStorage keys
    console.log("=== DEBUG: localStorage contents ===");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`Key: ${key}`, value);
      
      // Try to parse if it looks like JSON
      try {
        const parsed = JSON.parse(value);
        if (parsed && parsed.token) {
          console.log(`Token found in ${key}:`, parsed.token.substring(0, 20) + "...");
          return parsed.token;
        }
      } catch (e) {
        // Not JSON, that's fine
      }
    }
    
    // Try direct token access
    const directToken = localStorage.getItem("token");
    if (directToken) {
      console.log("Direct token found:", directToken.substring(0, 20) + "...");
      return directToken;
    }
    
    console.log("No token found in localStorage");
    return null;
  } catch (error) {
    console.error("Error retrieving token from localStorage:", error);
    return null;
  }
};
const token = getTokenFromStorage();
const connectWebSocket = useCallback(() => {
  try {
    console.log("Token found:", token ? `${token.substring(0, 10)}...` : 'No token');

    if (!token) {
      console.warn("No token available, cannot establish WebSocket connection");
      return;
    }

    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
      reconnectAttempts.current = 0;

      console.log("Sending authentication message...");
      ws.send(JSON.stringify({ 
        type: "auth", 
        token: token 
      }));

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      ws.pingInterval = pingInterval;
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        if (data.type === "pong") {
          console.log("Pong received - connection alive");
        } else if (data.type === "auth_success") {
          console.log("✅ WebSocket authentication successful");
          showNotification("Connected successfully!", "success");
        } else if (data.type === "auth_failed") {
          console.error("❌ WebSocket authentication failed");
          showNotification("Connection authentication failed", "error");
        } 
        else if (data.action === "place_order") {
          console.log("🚀 Place order action received via WebSocket");

          if (data.payment === "cod") {
            showNotification("Placing COD order via chatbot...", "success");
            await handleOrderPlacement2();
          } else {
            showNotification("Order request received! Processing...", "info");
            await handlePlaceOrder();
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      setWsConnected(false);

      if (ws.pingInterval) {
        clearInterval(ws.pingInterval);
      }

      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Attempting to reconnect WebSocket in ${delay}ms...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connectWebSocket();
        }, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error("Max WebSocket reconnection attempts reached");
        showNotification("Connection lost. Please refresh the page.", "error");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
      showNotification("Connection error occurred", "error");
    };

    wsRef.current = ws;

  } catch (error) {
    console.error("Failed to create WebSocket connection:", error);
    setWsConnected(false);
    showNotification("Failed to establish connection", "error");
  }
  // eslint-disable-next-line
}, []);


// Initialize WebSocket connection
useEffect(() => {
  connectWebSocket();

  return () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      // Clear ping interval if it exists
      if (wsRef.current.pingInterval) {
        clearInterval(wsRef.current.pingInterval);
      }
      wsRef.current.close(1000, "Component unmounting");
    }
  };
}, [connectWebSocket]);
  // Initialize WebSocket connection
 
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cart
        const cartResponse = await fetch(`${apiUrl}/cart`, {
          credentials: "include",
        });
        if (!cartResponse.ok) {
          throw new Error("Failed to fetch cart");
        }
        const cartData = await cartResponse.json();
        setCart(cartData);

        // Fetch addresses
        const profileResponse = await fetch(`${apiUrl}/profile`, {
          credentials: "include",
        });
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile");
        }
        const profileData = await profileResponse.json();
        setAddresses(profileData.addresses);

        // Set default address if available
        const defaultAddress = profileData.addresses.find(
          (addr) => addr.is_default
        );
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.address_id);
        }

        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();

    // Add event listeners for cart updates
    const handleCartUpdate = (e) => {
      if (e.key === "cart_updated" || e.type === "cart_updated_manual") {
        fetchData();
      }
    };

    window.addEventListener("storage", handleCartUpdate);
    window.addEventListener("cart_updated_manual", handleCartUpdate);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("storage", handleCartUpdate);
      window.removeEventListener("cart_updated_manual", handleCartUpdate);
    };
}, []);

  // Auto-hide notifications
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

const showNotification = (message, type = "success") => {
  console.log(`Showing notification: ${message} (${type})`);
  setNotification({ show: true, message, type });
};

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const response = await fetch(`${apiUrl}/cart/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      // Refresh cart
      const cartResponse = await fetch(`${apiUrl}/cart`, {
        credentials: "include",
      });
      const cartData = await cartResponse.json();
      setCart(cartData);
      
      showNotification("Cart updated successfully!");
    } catch (error) {
      console.error("Error updating quantity:", error);
      showNotification("Failed to update cart", "error");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const removeItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to remove this item from your cart?")) {
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const response = await fetch(`${apiUrl}/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      // Refresh cart
      const cartResponse = await fetch(`${apiUrl}/cart`, {
        credentials: "include",
      });
      const cartData = await cartResponse.json();
      setCart(cartData);
      
      showNotification("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      showNotification("Failed to remove item", "error");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handlePlaceOrder = async () => {
    console.log("Attempting to place order with address ID:", selectedAddress);
    console.log("Available addresses:", addresses);
    
    if (!selectedAddress) {
      showNotification("Please select a delivery address", "error");
      return;
    }

    setPlacingOrder(true);

    try {
      const addressId = String(selectedAddress);
      console.log("Sending order with address ID:", addressId);
      
      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId: addressId,
          paymentMethod: paymentMethod,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      showNotification("Order placed successfully! Redirecting...");
      
      setTimeout(() => {
        navigate("/order-confirmation", {
          state: { orderId: data.orderId },
        });
      }, 1500);
    } catch (error) {
      console.error("Order error:", error);
      showNotification("Failed to place order: " + error.message, "error");
    } finally {
      setPlacingOrder(false);
    }
  };
const handleOrderPlacement2 = async () => {
  console.log("🚀 handleOrderPlacement2 triggered - Chatbot initiated order");
  console.log("📍 Current addresses state:", addresses);
  console.log("📊 Addresses length:", addresses?.length);
  console.log("🔄 Loading state:", loading);

  try {
    const profileResponse = await fetch(`${apiUrl}/profile`, {
      credentials: "include",
    });

    if (!profileResponse.ok) {
      console.error("❌ Failed to fetch profile:", profileResponse.status);
      throw new Error("Failed to fetch profile");
    }

    const profileData = await profileResponse.json();
    const fetchedAddresses = profileData.addresses;

    console.log("📍 Fetched addresses:", fetchedAddresses);
    console.log("📊 Fetched addresses count:", fetchedAddresses?.length);

    if (!fetchedAddresses || fetchedAddresses.length === 0) {
      console.error("❌ No addresses available even after fetching");
      showNotification("No delivery address found. Please add one.", "error");
      return;
    }

    setAddresses(fetchedAddresses);

    const defaultAddressObj = fetchedAddresses.find(addr => addr.is_default);
    const addressToUse = defaultAddressObj || fetchedAddresses[0];
    const addressId = String(addressToUse.address_id);

    console.log("🎯 Selected address for chatbot order:", {
      addressId,
      isDefault: addressToUse.is_default,
      address: addressToUse
    });

    setSelectedAddress(addressId);
    setPlacingOrder(true);

    // Mimicking handlePlaceOrder logic
    console.log("🛒 Sending order with address ID (chatbot):", addressId);

    const response = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addressId: addressId,
        paymentMethod: paymentMethod,  // Assuming this is globally available like in handlePlaceOrder
      }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to place order via chatbot");
    }

    showNotification("Order placed successfully by chatbot! Redirecting...");

    setTimeout(() => {
      navigate("/order-confirmation", {
        state: { orderId: data.orderId },
      });
    }, 1500);

  } catch (error) {
    console.error("❌ Error in handleOrderPlacement2:", error);
    showNotification("Failed to place order: " + error.message, "error");
  } finally {
    setPlacingOrder(false);
  }
};


// Helper function to place order with a specific address
// const placeOrderWithAddress = async (addressId) => {
//   console.log("🚀 Placing order with address ID:", addressId);
  
//   setPlacingOrder(true);

//   try {
//     // Small delay to ensure state updates are processed
//     await new Promise(resolve => setTimeout(resolve, 100));
    
//     const orderPayload = {
//       addressId: addressId,
//       paymentMethod: "cash_on_delivery",
//     };
    
//     console.log("📦 Order payload:", orderPayload);
    
//     const response = await fetch(`${apiUrl}/orders`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(orderPayload),
//       credentials: "include",
//     });

//     console.log("📡 Order response status:", response.status);
    
//     const data = await response.json();
//     console.log("📄 Order response data:", data);

//     if (!response.ok) {
//       console.error("❌ Order placement failed:", data);
//       throw new Error(data.message || "Failed to place order");
//     }

//     console.log("✅ Order placed successfully:", data);
//     showNotification("Order placed successfully via chatbot! Redirecting...");

//     setTimeout(() => {
//       navigate("/order-confirmation", {
//         state: { orderId: data.orderId },
//       });
//     }, 1500);
//   } catch (error) {
//     console.error("❌ Chatbot order error:", error);
//     showNotification("Failed to place order: " + error.message, "error");
//   } finally {
//     setPlacingOrder(false);
//   }
// };
  const handleAddressAdded = (newAddress) => {
    console.log("New address added:", newAddress);
    
    const addressId = String(newAddress.address_id);
    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    setSelectedAddress(addressId);
    setShowAddressForm(false);
    
    showNotification("New address added successfully!");
    
    console.log("Updated addresses:", updatedAddresses);
    console.log("Selected address ID:", addressId);
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    } else if (typeof price === 'string' && !isNaN(parseFloat(price))) {
      return parseFloat(price).toFixed(2);
    } else {
      return '0.00';
    }
  };

  const calculateSavings = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => {
      if (item.discount_price && item.price > item.discount_price) {
        return total + ((item.price - item.discount_price) * item.quantity);
      }
      return total;
    }, 0);
  };

  const getTotalItems = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="loading">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#667eea' }}>
            Loading your cart...
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          <div style={{ 
            fontSize: '48px', 
            color: '#ef4444',
            marginBottom: '10px' 
          }}>
            ⚠️
          </div>
          <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🛒</div>
        <h2>Your cart is empty</h2>
        <p>Discover amazing products and add them to your cart</p>
        <button onClick={() => navigate("/products")}>
          🛍️ Start Shopping
        </button>
      </div>
    );
  }

  return (
    <>
    {/* WebSocket Connection Status */}
      {!wsConnected && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          zIndex: 1001
        }}>
          🔌 Connection Lost
        </div>
      )}
      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 
            notification.type === 'error' 
              ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
              : notification.type === 'info'
              ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
              : 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          animation: 'slideInRight 0.3s ease-out',
          maxWidth: '300px',
          fontSize: '0.95rem',
          fontWeight: '600'
        }}>
          {notification.message}
        </div>
      )}

      <div className="cart-container">
        <div className="cart-items">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px' 
          }}>
            <h2>Your Cart ({getTotalItems()} items)</h2>
            {calculateSavings() > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                💰 You save ₹{formatPrice(calculateSavings())}
              </div>
            )}
          </div>
          
          <div className="items-list">
            {cart.items.map((item, index) => (
              <div 
                key={item.cart_item_id} 
                className="cart-item"
                style={{
                  opacity: updatingItems.has(item.cart_item_id) ? 0.7 : 1,
                  transition: 'opacity 0.3s ease',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <img
                  src={productImages[item.product_id] || '/images/placeholder-product.jpg'}
                  alt={item.name}
                  className="product-image"
                />
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>
                    {item.discount_price ? (
                      <>
                        <span className="discounted-price">
                          ₹{formatPrice(item.discount_price)}
                        </span>
                        <span className="original-price">
                          ₹{formatPrice(item.price)}
                        </span>
                        <span style={{
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>
                          {Math.round(((item.price - item.discount_price) / item.price) * 100)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="discounted-price">₹{formatPrice(item.price)}</span>
                    )}
                    <span className="unit">/ {item.unit}</span>
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '16px' 
                  }}>
                    <div className="item-quantity">
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updatingItems.has(item.cart_item_id)}
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                        disabled={updatingItems.has(item.cart_item_id)}
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px' 
                    }}>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#1e293b'
                      }}>
                        ₹{formatPrice((item.discount_price || item.price) * item.quantity)}
                      </span>
                      <button
                        className="remove-item"
                        onClick={() => removeItem(item.cart_item_id)}
                        disabled={updatingItems.has(item.cart_item_id)}
                        title="Remove item"
                      >
                        {updatingItems.has(item.cart_item_id) ? '⏳' : '🗑️'} Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-section">
          <div className="delivery-address">
            <h3>📍 Delivery Address</h3>
            {addresses.length > 0 ? (
              <div className="address-list">
                {addresses.map((address) => {
                  const addressId = String(address.address_id);
                  return (
                    <div
                      key={addressId}
                      className={`address-card ${
                        String(selectedAddress) === addressId ? "selected" : ""
                      }`}
                      onClick={() => {
                        console.log("Selecting address:", addressId);
                        setSelectedAddress(addressId);
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '8px' 
                      }}>
                        <p>
                          <strong style={{ color: '#667eea' }}>
                            {address.is_default ? "🏠 Default Address" : "📍 Address"}
                          </strong>
                        </p>
                        {String(selectedAddress) === addressId && (
                          <span style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>
                        {address.city}, {address.state} - {address.postal_code}
                      </p>
                    </div>
                  );
                })}
                <button
                  className="add-address"
                  onClick={() => setShowAddressForm(true)}
                >
                  ➕ Add New Address
                </button>
              </div>
            ) : (
              <div className="no-address">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
                <p>No addresses found. Please add a delivery address.</p>
                <button
                  className="add-address"
                  onClick={() => setShowAddressForm(true)}
                >
                  ➕ Add Address
                </button>
              </div>
            )}

            {showAddressForm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}>
                  <AddressForm
                    onCancel={() => setShowAddressForm(false)}
                    onSuccess={handleAddressAdded}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="payment-method">
            <h3>💳 Payment Method</h3>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                />
                📱 UPI Payment
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                💳 Credit/Debit Card
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cash_on_delivery"
                  checked={paymentMethod === "cash_on_delivery"}
                  onChange={() => setPaymentMethod("cash_on_delivery")}
                />
                💵 Cash on Delivery
              </label>
            </div>
          </div>

          <div className="order-summary">
            <h3>📋 Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({getTotalItems()} items)</span>
              <span>₹{formatPrice(cart.total - (cart.delivery_fee || 0))}</span>
            </div>
            {calculateSavings() > 0 && (
              <div className="summary-row" style={{ color: '#10b981' }}>
                <span>You Save</span>
                <span>-₹{formatPrice(calculateSavings())}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>
                {cart.delivery_fee
                  ? `₹${formatPrice(cart.delivery_fee)}`
                  : "🎉 Free"}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>₹{formatPrice(cart.total)}</span>
            </div>
            <button
              className="place-order"
              onClick={handlePlaceOrder}
              disabled={selectedAddress === null || placingOrder}
              style={{
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {placingOrder ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Processing Order...
                </span>
              ) : (
                `🚀 Place Order • ₹${formatPrice(cart.total)}`
              )}
            </button>
            
            {selectedAddress === null && (
              <p style={{
                textAlign: 'center',
                color: '#ef4444',
                fontSize: '0.9rem',
                marginTop: '12px',
                fontWeight: '500'
              }}>
                ⚠️ Please select a delivery address to continue
              </p>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default Cart;