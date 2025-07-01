import React, { useState } from 'react';
import AddressList from './AddressList';
import AddressForm from './AddressForm';
// import '../css/AddressesPage.css';

const AddressesPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    // Increment to trigger a re-fetch in the AddressList component
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="addresses-page">
      <div className="addresses-header">
        <h1>Manage Addresses</h1>
        {!showAddForm && (
          <button 
            className="add-address-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add New Address
          </button>
        )}
      </div>

      {showAddForm ? (
        <AddressForm 
          onCancel={() => setShowAddForm(false)} 
          onSuccess={handleAddSuccess}
        />
      ) : (
        <AddressList key={refreshTrigger} />
      )}
    </div>
  );
};

export default AddressesPage;