import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../config/config';
// import '../css/AddressForm.css';

const EditAddressForm = ({ address, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    city: address?.city || 'Bangalore',
    state: address?.state || 'Karnataka',
    postalCode: address?.postalCode || '',
    isDefault: address?.isDefault || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    address?.latitude && address?.longitude 
      ? { lat: address.latitude, lng: address.longitude } 
      : null
  );
  const [addressFromMap, setAddressFromMap] = useState('');
  const [mapCenter, setMapCenter] = useState(
    address?.latitude && address?.longitude 
      ? [address.latitude, address.longitude] 
      : [12.9716, 77.5946] // Default to Bangalore
  );
  
  // Refs for map and marker
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Load Leaflet for map
    const loadLeaflet = () => {
      if (window.L) {
        setMapLoaded(true);
        return;
      }

      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);

      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.onload = () => setMapLoaded(true);
      document.head.appendChild(leafletScript);
    };

    loadLeaflet();

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapLoaded && window.L) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [mapLoaded, mapCenter]);

  const initializeMap = () => {
    const mapContainer = document.getElementById('address-map');
    
    if (!mapContainer || mapRef.current) return;

    try {
      // Force map container to have dimensions
      mapContainer.style.height = '300px';
      mapContainer.style.width = '100%';
      
      // Initialize map with current center coordinates
      mapRef.current = window.L.map('address-map', {
        center: mapCenter,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        tap: true
      });
      
      // Make sure the map knows its container size
      mapRef.current.invalidateSize();
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Add initial marker if we have coordinates
      if (selectedLocation) {
        markerRef.current = window.L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(mapRef.current);
      }
      
      // Add click handler for map
      mapRef.current.on('click', handleMapClick);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
    }
    
    // Store selected location
    setSelectedLocation({ lat, lng });
    
    // Attempt to reverse geocode (get address from coordinates)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddressFromMap(data.display_name);
        
        // Auto-fill address form fields if possible
        if (data.address) {
          const { road, house_number, suburb, city, state, postcode } = data.address;
          
          let addressLine1 = '';
          if (house_number) addressLine1 += house_number + ' ';
          if (road) addressLine1 += road;
          
          setFormData(prev => ({
            ...prev,
            addressLine1: addressLine1 || prev.addressLine1,
            addressLine2: suburb || prev.addressLine2,
            city: city || data.address.town || data.address.village || prev.city,
            state: state || prev.state,
            postalCode: postcode || prev.postalCode
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching address from coordinates:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // If postal code is changing and has 6 digits, try to find location
    if (name === 'postalCode' && value.length === 6 && /^\d+$/.test(value)) {
      searchPostalCode(value);
    }
  };

  // Function to search for postal code and center map
  const searchPostalCode = async (postalCode) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=India&format=json`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter = [parseFloat(lat), parseFloat(lon)];
        
        setMapCenter(newCenter);
        
        // If map is already initialized, recenter it
        if (mapRef.current) {
          mapRef.current.setView(newCenter, 15);
          
          // Clear previous marker if any
          if (markerRef.current) {
            mapRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
          }
        }
        
        // Update city and state from results if available
        if (data[0].address) {
          const { city, state, town, village } = data[0].address;
          setFormData(prev => ({
            ...prev,
            city: city || town || village || prev.city,
            state: state || prev.state
          }));
        }
      }
    } catch (error) {
      console.error('Error searching postal code:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Step 1: Delete the existing address
      const deleteResponse = await fetch(`${apiUrl}/addresses/${address.addressId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!deleteResponse.ok) {
        const deleteData = await deleteResponse.json();
        throw new Error(deleteData.message || 'Failed to delete old address');
      }

      // Step 2: Create a new address with the updated information
      const createResponse = await fetch(`${apiUrl}/addresses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          isDefault: formData.isDefault,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.message || 'Failed to create new address');
      }

      onSuccess(createData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-form-container">
      <h2>Edit Address</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Address Line 1</label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Address Line 2 (Optional)</label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Postal Code</label>
          <div className="postal-code-container" style={{ display: 'flex' }}>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              required
              style={{ flexGrow: 1 }}
              placeholder="Enter 6-digit pincode"
            />
            <button 
              type="button" 
              onClick={() => formData.postalCode.length === 6 && searchPostalCode(formData.postalCode)}
              style={{ 
                marginLeft: '10px', 
                padding: '0 10px',
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={formData.postalCode.length !== 6}
            >
              Find
            </button>
          </div>
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            id="defaultAddress"
          />
          <label htmlFor="defaultAddress">Set as default address</label>
        </div>
        
        <div className="map-container">
          <p>Click on the map to set your exact location:</p>
          <div 
            id="address-map" 
            className="address-map" 
            style={{ 
              height: '300px', 
              width: '100%', 
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1
            }}
          ></div>
          {!mapLoaded && <p>Loading map...</p>}
          
          {selectedLocation && (
            <div className="selected-location">
              <p><strong>Selected coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
              {addressFromMap && (
                <p><strong>Address:</strong> {addressFromMap}</p>
              )}
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button 
            type="submit" 
            disabled={loading || !selectedLocation}
            className={!selectedLocation ? 'disabled-btn' : ''}
          >
            {loading ? 'Updating...' : 'Update Address'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAddressForm;