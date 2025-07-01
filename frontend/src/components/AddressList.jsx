import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config/config';
import EditAddressForm from './EditAddressForm';
// import '../css/AddressList.css';

const AddressList = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/addresses`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }
      
      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = (newAddressData) => {
    // Since we're using the delete-then-create approach, we need to refresh the entire list
    // to get the new addressId and other updated information
    
    // Close the edit form
    setEditingAddress(null);
    
    // Refresh the addresses list
    fetchAddresses();
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete address');
      }
      
      // Remove from local state
      setAddresses(prevAddresses => 
        prevAddresses.filter(addr => addr.addressId !== addressId)
      );
    } catch (err) {
      alert(`Error deleting address: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading addresses...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (editingAddress) {
    return (
      <EditAddressForm 
        address={editingAddress}
        onCancel={() => setEditingAddress(null)}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div className="address-list-container">
      <h2>Your Addresses</h2>
      
      {addresses.length === 0 ? (
        <div className="no-addresses">
          <p>You don't have any saved addresses yet.</p>
        </div>
      ) : (
        <div className="address-list">
          {addresses.map(address => (
            <div key={address.addressId} className={`address-card ${address.isDefault ? 'default-address' : ''}`}>
              <div className="address-details">
                <p className="address-line">{address.addressLine1}</p>
                {address.addressLine2 && <p className="address-line">{address.addressLine2}</p>}
                <p className="address-city-state">{address.city}, {address.state} {address.postalCode}</p>
                {address.isDefault && <span className="default-badge">Default</span>}
              </div>
              <div className="address-actions">
                <button 
                  className="edit-button"
                  onClick={() => setEditingAddress(address)}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(address.addressId)}
                  disabled={address.isDefault}
                  title={address.isDefault ? "Cannot delete default address" : ""}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressList;