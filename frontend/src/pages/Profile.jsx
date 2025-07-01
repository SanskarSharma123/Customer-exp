import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import AddressForm from "../components/AddressForm";
import "../css/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiUrl}/profile`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setUser(data.user);
        setAddresses(data.addresses);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAddressAdded = (newAddress) => {
    setAddresses([...addresses, newAddress]);
    setShowAddressForm(false);
  };

  const handleAddressUpdated = (updatedAddress) => {
    setAddresses(addresses.map(addr => 
      addr.address_id === updatedAddress.address_id ? updatedAddress : addr
    ));
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await fetch(`${apiUrl}/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete address");
      }

      setAddresses(addresses.filter(addr => addr.address_id !== addressId));
    } catch (error) {
      console.error("Error deleting address:", error);
      setError(`Failed to delete address: ${error.message}`);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancelForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-error">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button 
          className="retry-button" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Hero Section */}
      <div className="profile-hero">
        <div className="hero-content">
          <div className="welcome-section">
            <h1>
              Welcome back, <span className="user-name">{user?.name}</span>! 👋
            </h1>
            <p className="hero-subtitle">Manage your profile and delivery addresses</p>
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-icon">📍</div>
              <div className="stat-info">
                <span className="stat-number">{addresses.length}</span>
                <span className="stat-label">Saved Addresses</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <span className="stat-number">
                  {user?.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}
                </span>
                <span className="stat-label">Member Since</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button 
              className="dismiss-error"
              onClick={() => setError("")}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="profile-content">
        {/* Personal Information Card */}
        <div className="user-info-card">
          <div className="card-header">
            <div className="header-icon">👤</div>
            <div className="header-content">
              <h2>Personal Information</h2>
              <p className="card-subtitle">Your account details and contact information</p>
            </div>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">🏷️</div>
              <div className="info-content">
                <label>Full Name</label>
                <span>{user?.name}</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <label>Email Address</label>
                <span>{user?.email}</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <label>Phone Number</label>
                <span>{user?.phone}</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🗓️</div>
              <div className="info-content">
                <label>Member Since</label>
                <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="addresses-card">
          <div className="card-header">
            <div className="header-icon">📍</div>
            <div className="header-content">
              <h2>Delivery Addresses</h2>
              <p className="card-subtitle">Manage your saved delivery locations</p>
            </div>
            <button 
              className="add-address-btn"
              onClick={() => setShowAddressForm(true)}
            >
              <span className="btn-icon">+</span>
              Add New Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="no-addresses-state">
              <div className="empty-state-icon">🏠</div>
              <h3>No addresses saved yet</h3>
              <p>Add your first delivery address to get started with faster checkout</p>
              <button 
                className="add-first-address-btn"
                onClick={() => setShowAddressForm(true)}
              >
                <span className="btn-icon">+</span>
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="addresses-grid">
              {addresses.map((address, index) => (
                <div 
                  key={address.address_id} 
                  className={`address-card ${address.is_default ? 'default-address' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {address.is_default && (
                    <div className="default-badge">
                      <span className="badge-icon">⭐</span>
                      Default
                    </div>
                  )}
                  
                  <div className="address-content">
                    <div className="address-icon">🏠</div>
                    <div className="address-details">
                      <p className="address-line primary">{address.address_line1}</p>
                      {address.address_line2 && (
                        <p className="address-line secondary">{address.address_line2}</p>
                      )}
                      <p className="address-location">
                        <span className="location-icon">📍</span>
                        {address.city}, {address.state} - {address.postal_code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="address-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleEditAddress(address)}
                      title="Edit Address"
                    >
                      <span className="btn-icon">✏️</span>
                      Edit
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteAddress(address.address_id)}
                      title="Delete Address"
                    >
                      <span className="btn-icon">🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="address-form-overlay">
          <div className="address-form-modal">
            <AddressForm 
              onCancel={handleCancelForm}
              onSuccess={editingAddress ? handleAddressUpdated : handleAddressAdded}
              existingAddress={editingAddress}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;