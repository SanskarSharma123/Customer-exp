import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../config/config';
import '../css/AddressForm.css';

const AddressForm = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    addressLine1: '',
    addressLine2: '',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressFromMap, setAddressFromMap] = useState('');
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default to Bangalore
  
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

      console.log("Map initialized and ready for clicks");
      
      // Add click handler for map
      mapRef.current.on('click', handleMapClick);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  const handleMapClick = async (e) => {
    console.log("Map clicked at:", e.latlng);
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
      const response = await fetch(`${apiUrl}/addresses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add address');
      }

      // Transform the response data to match the address format used in the Cart component
      // Ensure address_id is a string to maintain consistency
      const formattedAddress = {
        address_id: String(data.address_id),
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        is_default: formData.isDefault,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      };
      
      console.log("Formatted address to pass to Cart:", formattedAddress);

      onSuccess(formattedAddress);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-form-overlay">
      <div className="address-form-container">
        <div className="form-header">
          <h2>
            <span className="location-icon">📍</span>
            Add New Address
          </h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="address-form">
          <div className="form-section">
            <h3>📋 Address Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  <span className="label-icon">🏠</span>
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="House/Flat No., Building Name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <span className="label-icon">🌆</span>
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Area, Landmark"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <span className="label-icon">🏙️</span>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <span className="label-icon">🗾</span>
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group postal-code-group">
                <label>
                  <span className="label-icon">📮</span>
                  Postal Code
                </label>
                <div className="postal-code-container">
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="Enter 6-digit pincode"
                    maxLength="6"
                    required
                  />
                  <button 
                    type="button" 
                    className="find-btn"
                    onClick={() => formData.postalCode.length === 6 && searchPostalCode(formData.postalCode)}
                    disabled={formData.postalCode.length !== 6}
                  >
                    🔍 Find
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">
                    <span className="star-icon">⭐</span>
                    Set as default address
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🗺️ Location on Map</h3>
            <p className="map-instruction">
              Click on the map to set your exact location
            </p>
            
            <div className="map-container">
              <div 
                id="address-map" 
                className="address-map"
              ></div>
              
              {!mapLoaded && (
                <div className="map-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading map...</p>
                </div>
              )}
              
              {selectedLocation && (
                <div className="location-info">
                  <div className="location-card">
                    <h4>📍 Selected Location</h4>
                    <p className="coordinates">
                      <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                    {addressFromMap && (
                      <p className="address-preview">
                        <strong>Address:</strong> {addressFromMap}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`submit-btn ${!selectedLocation ? 'disabled' : ''}`}
              disabled={loading || !selectedLocation}
            >
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="save-icon">💾</span>
                  Save Address
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;