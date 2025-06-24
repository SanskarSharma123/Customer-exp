import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/DeliveryTracking.css";
// import productImages from "../components/ProductImages";

const DeliveryTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const mapRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Helper function to estimate route information
  const estimateRouteInfo = (storeLocation, currentLocation, deliveryLocation) => {
    // Haversine formula to calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    };

    let totalDistance = 0;
    let totalTime = 0;
    const avgSpeed = 30; // km/h for urban travel

    if (currentLocation) {
      // Calculate store to current location
      const dist1 = calculateDistance(
        storeLocation.lat, storeLocation.lng,
        currentLocation.lat, currentLocation.lng
      );
      
      // Calculate current location to delivery
      const dist2 = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        deliveryLocation.lat, deliveryLocation.lng
      );
      
      totalDistance = dist1 + dist2;
    } else {
      // Direct distance from store to delivery
      totalDistance = calculateDistance(
        storeLocation.lat, storeLocation.lng,
        deliveryLocation.lat, deliveryLocation.lng
      );
    }
    
    // Calculate time based on average speed (in minutes)
    totalTime = (totalDistance / avgSpeed) * 60;
    
    setRouteInfo({
      distance: totalDistance.toFixed(1),
      duration: Math.round(totalTime)
    });
  };

  // Define drawRoute with useCallback
  const drawRoute = useCallback((currentLocation = null, storeLocation = null, deliveryLocation = null) => {
    if (!mapRef.current) return;
    
    console.log("Drawing route with:", {
      currentLocation,
      storeLocation,
      deliveryLocation
    });
    
    // If storeLocation or deliveryLocation are not provided, try to get them from the order
    if (!storeLocation || !deliveryLocation) {
      if (!order) return; // Exit if order is not available
      
      storeLocation = order.storeLocation;
      deliveryLocation = order.deliveryLocation;
      
      // Additional safety check
      if (!storeLocation || !deliveryLocation) {
        console.error("Missing location data in order:", order);
        return;
      }
    }
    
    // Remove existing route if any
    if (routeLayerRef.current) {
      if (routeLayerRef.current.remove) {
        routeLayerRef.current.remove();
      } else if (mapRef.current.hasLayer(routeLayerRef.current)) {
        mapRef.current.removeLayer(routeLayerRef.current);
      }
      routeLayerRef.current = null;
    }
  
    // Log route information for debugging
    console.log("Route points:", {
      store: [storeLocation.lat, storeLocation.lng],
      delivery: [deliveryLocation.lat, deliveryLocation.lng],
      current: currentLocation ? [currentLocation.lat, currentLocation.lng] : null
    });
  
    // Draw route based on whether we have current location
    if (currentLocation && window.L.Routing) {
      console.log("Using Routing Machine with current location");
      
      // Use Routing Machine if available
      try {
        const routingControl = window.L.Routing.control({
          waypoints: [
            window.L.latLng(storeLocation.lat, storeLocation.lng),
            window.L.latLng(currentLocation.lat, currentLocation.lng),
            window.L.latLng(deliveryLocation.lat, deliveryLocation.lng)
          ],
          router: window.L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          }),
          lineOptions: {
            styles: [{color: '#FF6D00', opacity: 0.7, weight: 5}]
          },
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false,
          showAlternatives: false,
          show: false, // Hide the instruction panel
          createMarker: () => null
        }).addTo(mapRef.current);
        
        // Debug logging for route
        routingControl.on('routesfound', function(e) {
          console.log("Routes found:", e.routes);
          const routes = e.routes;
          if (routes && routes.length > 0) {
            const totalDistance = routes[0].summary.totalDistance / 1000; // km
            const totalTime = routes[0].summary.totalTime / 60; // minutes
            console.log(`Route info: ${totalDistance.toFixed(1)}km, ${Math.round(totalTime)}min`);
            setRouteInfo({
              distance: totalDistance.toFixed(1),
              duration: Math.round(totalTime)
            });
          }
        });
        
        // Debug logging for errors
        routingControl.on('routingerror', function(e) {
          console.error("Routing error:", e.error);
        });
        
        routeLayerRef.current = routingControl;
        
      } catch (err) {
        console.error("Error with Routing Machine:", err);
        // Fallback to simple polyline
        const polyline = window.L.polyline([
          [storeLocation.lat, storeLocation.lng],
          [currentLocation.lat, currentLocation.lng],
          [deliveryLocation.lat, deliveryLocation.lng]
        ], {color: '#FF6D00', weight: 5, opacity: 0.7}).addTo(mapRef.current);
        
        routeLayerRef.current = polyline;
        
        // Estimate distance and time (rough calculation when routing service unavailable)
        estimateRouteInfo(storeLocation, currentLocation, deliveryLocation);
      }
    } else if (window.L.Routing) {
      console.log("Using Routing Machine for direct route");
      
      // Ensure the coordinates are noticeably different for testing
      if (Math.abs(storeLocation.lat - deliveryLocation.lat) < 0.001 && 
          Math.abs(storeLocation.lng - deliveryLocation.lng) < 0.001) {
        console.log("Warning: Store and delivery locations are very close - adjusting for visibility");
        deliveryLocation = {
          ...deliveryLocation,
          lat: storeLocation.lat + 0.003,
          lng: storeLocation.lng - 0.003
        };
      }
      
      // Direct route from store to delivery
      try {
        const routingControl = window.L.Routing.control({
          waypoints: [
            window.L.latLng(storeLocation.lat, storeLocation.lng),
            window.L.latLng(deliveryLocation.lat, deliveryLocation.lng)
          ],
          router: window.L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          }),
          lineOptions: {
            styles: [{color: '#4285F4', opacity: 0.7, weight: 5}]
          },
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false,
          showAlternatives: false,
          show: false, // Hide the instruction panel
          createMarker: () => null
        }).addTo(mapRef.current);
        
        // Debug logging for route
        routingControl.on('routesfound', function(e) {
          console.log("Direct routes found:", e.routes);
          const routes = e.routes;
          if (routes && routes.length > 0) {
            const totalDistance = routes[0].summary.totalDistance / 1000; // km
            const totalTime = routes[0].summary.totalTime / 60; // minutes
            console.log(`Direct route info: ${totalDistance.toFixed(1)}km, ${Math.round(totalTime)}min`);
            setRouteInfo({
              distance: totalDistance.toFixed(1),
              duration: Math.round(totalTime)
            });
          }
        });
        
        // Debug logging for errors
        routingControl.on('routingerror', function(e) {
          console.error("Direct routing error:", e.error);
          // Fall back to polyline on routing error
          drawFallbackPolyline(storeLocation, deliveryLocation);
        });
        
        routeLayerRef.current = routingControl;
      } catch (err) {
        console.error("Error with direct Routing Machine:", err);
        // Fallback to simple line
        drawFallbackPolyline(storeLocation, deliveryLocation);
      }
    } else {
      console.log("Using fallback simple polyline");
      // Fallback: simple line
      drawFallbackPolyline(storeLocation, deliveryLocation);
    }
    
    function drawFallbackPolyline(start, end) {
      console.log("Drawing fallback polyline between:", 
        [start.lat, start.lng], 
        [end.lat, end.lng]
      );
      
      const polyline = window.L.polyline([
        [start.lat, start.lng],
        [end.lat, end.lng]
      ], {color: '#4285F4', weight: 5, opacity: 0.7}).addTo(mapRef.current);
      
      routeLayerRef.current = polyline;
      
      // Estimate distance and time (rough calculation when routing service unavailable)
      estimateRouteInfo(start, null, end);
    }
  }, [order]);

  // Define updateRoute with useCallback 
  const updateRoute = useCallback((newLocation) => {
    if (!mapRef.current || !routeLayerRef.current || !order) return;
    
    const storeLocation = order.storeLocation;
    const deliveryLocation = order.deliveryLocation;
    
    // Check if we have valid locations
    if (!storeLocation || !deliveryLocation) {
      console.error("Missing location data in order:", order);
      return;
    }
    
    if (routeLayerRef.current.setWaypoints) {
      // Using Routing Machine - update waypoints
      routeLayerRef.current.setWaypoints([
        window.L.latLng(storeLocation.lat, storeLocation.lng),
        window.L.latLng(newLocation.lat, newLocation.lng),
        window.L.latLng(deliveryLocation.lat, deliveryLocation.lng)
      ]);
    } else {
      // Using simple polyline - redraw
      drawRoute(newLocation, storeLocation, deliveryLocation);
    }
  }, [order, drawRoute]);

  // Define startLocationUpdates using useCallback
  const startLocationUpdates = useCallback(() => {
    // Update every 30 seconds for real-time tracking
    updateIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/orders/${orderId}/tracking`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Location update received:", data);
          
          // Update delivery person's location if changed
          if (data.currentDeliveryLocation && deliveryMarkerRef.current) {
            const newLatLng = new window.L.LatLng(
              data.currentDeliveryLocation.lat,
              data.currentDeliveryLocation.lng
            );
            deliveryMarkerRef.current.setLatLng(newLatLng);
            
            // Update route if needed
            updateRoute(data.currentDeliveryLocation);
          }
          
          // Update order state with new data
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to update location:", err);
      }
    }, 30000); // 30 seconds
  }, [orderId, updateRoute]);

  // Load Leaflet resources
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Load CSS
        const leafletCss = document.createElement("link");
        leafletCss.rel = "stylesheet";
        leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        leafletCss.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        leafletCss.crossOrigin = "";
        document.head.appendChild(leafletCss);

        // Load JS
        await new Promise((resolve, reject) => {
          const leafletScript = document.createElement("script");
          leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          leafletScript.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
          leafletScript.crossOrigin = "";
          leafletScript.onload = resolve;
          leafletScript.onerror = reject;
          document.head.appendChild(leafletScript);
        });

        // Load Routing Machine
        await new Promise((resolve, reject) => {
          const routingScript = document.createElement("script");
          routingScript.src = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js";
          routingScript.onload = resolve;
          routingScript.onerror = reject;
          document.head.appendChild(routingScript);
        });

        // Load Routing Machine CSS
        const routingCss = document.createElement("link");
        routingCss.rel = "stylesheet";
        routingCss.href = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
        document.head.appendChild(routingCss);
      } catch (err) {
        console.error("Failed to load Leaflet resources:", err);
        setError("Failed to load map resources. Please try refreshing the page.");
      }
    };

    loadLeaflet();

    return () => {
      // Cleanup
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Define create bike icon function
  const createBikeIcon = () => {
    // Create a custom bike icon using SVG
    return window.L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="#00AA00">
          <path d="M5,20.5A3.5,3.5 0 0,1 1.5,17A3.5,3.5 0 0,1 5,13.5A3.5,3.5 0 0,1 8.5,17A3.5,3.5 0 0,1 5,20.5M5,12A5,5 0 0,0 0,17A5,5 0 0,0 5,22A5,5 0 0,0 10,17A5,5 0 0,0 5,12M14.8,10H19V8.2H15.8L13.8,4.8C13.5,4.3 12.8,4 12,4C11.2,4 10.5,4.3 10.2,4.8L8,8H5V10H8.2L12.3,5H13.5L14.8,10M19,20.5A3.5,3.5 0 0,1 15.5,17A3.5,3.5 0 0,1 19,13.5A3.5,3.5 0 0,1 22.5,17A3.5,3.5 0 0,1 19,20.5M19,12A5,5 0 0,0 14,17A5,5 0 0,0 19,22A5,5 0 0,0 24,17A5,5 0 0,0 19,12M16,6H11.5L10.5,4H14A2,2 0 0,1 16,6Z"/>
        </svg>
      `,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  // Define initializeMap with useCallback
  const initializeMap = useCallback(() => {
    if (!order) return; // Safety check to ensure order exists
    
    // Get locations from order
    const isValidCoordinate = (coord) => 
    typeof coord === 'number' && !isNaN(coord) && Math.abs(coord) <= 90;
  
    const storeLat = order.storeLocation.lat;
    const storeLng = order.storeLocation.lng;
    const deliveryLat = order.deliveryLocation.lat;
    const deliveryLng = order.deliveryLocation.lng;
    if (!isValidCoordinate(storeLat) || !isValidCoordinate(storeLng) ||
      !isValidCoordinate(deliveryLat) || !isValidCoordinate(deliveryLng)) {
        console.log(deliveryLng);
    console.error('Invalid coordinates:', order);
    setError('Invalid map coordinates - please contact support');
    return;
  }  
    const storeLocation = order.storeLocation;
    const deliveryLocation = order.deliveryLocation;
    const currentDeliveryLocation = order.currentDeliveryLocation;
    
    // Safety check for valid locations
    if (!storeLocation || !deliveryLocation) {
      console.error("Missing location data in order:", order);
      setError("Error loading map: Missing location data");
      return;
    }
  
    console.log("Initializing map with delivery location:", deliveryLocation);
    
    // Create map instance
    const mapInstance = window.L.map('delivery-map').setView(
      [(storeLocation.lat + deliveryLocation.lat)/2, (storeLocation.lng + deliveryLocation.lng)/2], 
      12
    );
    
    // Save map reference
    mapRef.current = mapInstance;
    
    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);
  
    // Add store marker
    const storeIcon = window.L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    
    window.L.marker([storeLocation.lat, storeLocation.lng], {icon: storeIcon})
      .addTo(mapInstance)
      .bindPopup(`<b>${storeLocation.name || "Store"}</b><br>${storeLocation.address || ""}`);
  
    // Add delivery marker
    const deliveryIcon = window.L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    
    window.L.marker([deliveryLocation.lat, deliveryLocation.lng], {icon: deliveryIcon})
      .addTo(mapInstance)
      .bindPopup(`<b>Delivery Address</b><br>${deliveryLocation.address || ""}`);
  
    // If out for delivery or delivered, show delivery person's location
    if ((order.status === "out_for_delivery" || order.status === "delivered") && 
        (currentDeliveryLocation || order.status === "delivered")) {
      
      // For delivered orders, set current location to delivery location
      const locationToUse = order.status === "delivered" 
    ? deliveryLocation 
    : currentDeliveryLocation;
  
  // Use bike icon for delivery person
  const bikeIcon = createBikeIcon();

  // Create popup content with delivery person info
  const popupContent = order.delivery_person_name 
    ? `<b>${order.delivery_person_name}</b>${order.delivery_person_phone ? `<br>Phone: ${order.delivery_person_phone}` : ''}`
    : "Delivery Partner";

  const marker = window.L.marker(
    [locationToUse.lat, locationToUse.lng],
    {icon: bikeIcon}
  )
    .addTo(mapInstance)
    .bindPopup(popupContent);
  
  deliveryMarkerRef.current = marker;
  
  // For "out_for_delivery", draw route through current location
  if (order.status === "out_for_delivery") {
    drawRoute(locationToUse, storeLocation, deliveryLocation);
  } else {
    // For "delivered", just draw direct route from store to delivery
    // But also draw the delivery person at the delivery location
    drawRoute(deliveryLocation, storeLocation, deliveryLocation);
  }
    } else {
      // Just draw direct route from store to delivery location
      drawRoute(null, storeLocation, deliveryLocation);
    }
  
    // Fit map to show all locations
    const bounds = window.L.latLngBounds([
      [storeLocation.lat, storeLocation.lng],
      [deliveryLocation.lat, deliveryLocation.lng]
    ]);
    
    if ((order.status === "out_for_delivery" || order.status === "delivered") && 
        (currentDeliveryLocation || order.status === "delivered")) {
      const locationToExtend = order.status === "delivered" 
        ? deliveryLocation 
        : currentDeliveryLocation;
      bounds.extend([locationToExtend.lat, locationToExtend.lng]);
    }
    
    mapInstance.fitBounds(bounds, {padding: [30, 30]});
  }, [order, drawRoute]);

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${apiUrl}/orders/${orderId}/tracking`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json(); // Get error details
          throw new Error(errorData.message || "Failed to fetch order details");
        }
    
        const data = await response.json();
        console.log("Received order data:", data);
        
        // Ensure we have valid location data
        if (!data.deliveryLocation || !data.storeLocation) {
          throw new Error("Missing location data in API response");
        }
        
        setOrder(data);
        
        // If order is out for delivery, start periodic updates
        if (data.status === "out_for_delivery") {
          startLocationUpdates();
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [orderId, startLocationUpdates]);

  // Initialize map when order data is loaded
  useEffect(() => {
    if (order && window.L && !mapRef.current) {
      console.log("Map initialization triggered with order:", order);
      initializeMap();
    }
  }, [order, initializeMap]);

  const getStatusIndex = (status) => {
    const statusOrder = [
      "pending",
      "confirmed",
      "processing",
      "out_for_delivery",
      "delivered",
    ];
    return statusOrder.indexOf(status);
  };

  if (loading) {
    return (
      <div className="tracking-loading">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-error">
        <div className="error-icon">!</div>
        <h3>Tracking Error</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="tracking-error">
        <div className="error-icon">!</div>
        <h3>Order Not Found</h3>
        <p>We couldn't find order #{orderId}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="delivery-tracking-container">
      <div className="tracking-header">
        <h1>Track Your Order <span className="order-id">#{orderId}</span></h1>
        <div className="order-summary-card">
        <div className="summary-item">
          <span className="label">Order Date:</span>
          <span className="value">
            {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'N/A'}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Total:</span>
          <span className="value">
            ₹{order.total && !isNaN(order.total) ? Number(order.total).toFixed(2) : '0.00'}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Items:</span>
          <span className="value">
            {order.items && Array.isArray(order.items) ? order.items.length : 0}
          </span>
        </div>
      </div>
      </div>
      
      {/* Map container */}
      <div className="map-section">
        <div className="map-container">
          <div id="delivery-map" className="delivery-map"></div>
          {!window.L && (
            <div className="map-fallback">
              <p>Map loading... Please wait</p>
            </div>
          )}
          
          {/* Route info display */}
          {routeInfo.distance && routeInfo.duration && (
            <div className="route-info-card">
              <div className="info-item">
                <div className="info-icon">📏</div>
                <div className="info-text">
                  <div className="info-label">Distance</div>
                  <div className="info-value">{routeInfo.distance} km</div>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">⏱️</div>
                <div className="info-text">
                  <div className="info-label">Estimated Time</div>
                  <div className="info-value">{routeInfo.duration} min</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Delivery status timeline */}
        <div className="status-timeline-container">
          <div className="status-header">
            <h2>Delivery Status</h2>
            <div className={`status-badge status-${order.status}`}>
              {order.status.replace(/_/g, " ")}
            </div>
          </div>
          
          <div className="status-timeline">
            <div className={`status-step ${currentStatusIndex >= 0 ? "active" : ""}`}>
              <div className="step-icon">
                <div className="step-number">1</div>
                <div className="step-indicator"></div>
              </div>
              <div className="step-info">
                <div className="step-label">Order Received</div>
                <div className="step-time">Today, 10:15 AM</div>
              </div>
            </div>
            <div className={`status-step ${currentStatusIndex >= 1 ? "active" : ""}`}>
              <div className="step-icon">
                <div className="step-number">2</div>
                <div className="step-indicator"></div>
              </div>
              <div className="step-info">
                <div className="step-label">Confirmed</div>
                <div className="step-time">Today, 10:30 AM</div>
              </div>
            </div>
            <div className={`status-step ${currentStatusIndex >= 2 ? "active" : ""}`}>
              <div className="step-icon">
                <div className="step-number">3</div>
                <div className="step-indicator"></div>
              </div>
              <div className="step-info">
                <div className="step-label">Processing</div>
                <div className="step-time">Today, 11:45 AM</div>
              </div>
            </div>
            <div className={`status-step ${currentStatusIndex >= 3 ? "active" : ""}`}>
              <div className="step-icon">
                <div className="step-number">4</div>
                <div className="step-indicator"></div>
              </div>
              <div className="step-info">
                <div className="step-label">Out for Delivery</div>
                <div className="step-time">Today, 12:30 PM</div>
              </div>
            </div>
            <div className={`status-step ${currentStatusIndex >= 4 ? "active" : ""}`}>
              <div className="step-icon">
                <div className="step-number">5</div>
                <div className="step-indicator"></div>
              </div>
              <div className="step-info">
                <div className="step-label">Delivered</div>
                <div className="step-time">Today, 1:15 PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery person info */}
      {(order.status === "out_for_delivery" || order.status === "delivered") && order.delivery_person_name && (
        <div className="delivery-person-card">
          <div className="delivery-header">
            <h3>{order.status === "delivered" ? "Delivered by" : "Your Delivery Partner"}</h3>
            <div className="delivery-eta">
              <span className="eta-icon">⏱️</span>
              {order.status === "out_for_delivery" ? (
                <span>ETA: <strong>{order.deliveryEta || "15"} minutes</strong></span>
              ) : (
                <span>Delivered at {new Date(order.actualDeliveryTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              )}
            </div>
          </div>
          
          <div className="delivery-person-info">
            <div className="delivery-person-avatar">
              {order.delivery_person_name.charAt(0)}
            </div>
            <div className="delivery-person-details">
              <h4 className="delivery-name">{order.delivery_person_name}</h4>
              <div className="delivery-contact">
                {order.delivery_person_phone && (
                  <a href={`tel:${order.delivery_person_phone}`} className="contact-btn call-btn">
                    <span className="btn-icon">📞</span> Call
                  </a>
                )}
                <button className="contact-btn message-btn">
                  <span className="btn-icon">💬</span> Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking updates and order details */}
      <div className="details-section">
        <div className="tracking-updates">
          <h3>Tracking Updates</h3>
          <div className="updates-list">
            {order.tracking.map((update, index) => (
              <div key={index} className="update-item">
                <div className="update-time">
                  {new Date(update.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="update-content">
                  <div className="update-status">
                    {update.status.replace(/_/g, " ")}
                  </div>
                  <div className="update-location">{update.location}</div>
                  {update.delivery_person_name && (
                    <div className="delivery-person">
                      Delivery partner: {update.delivery_person_name}
                      {update.delivery_person_phone && (
                        <span> ({update.delivery_person_phone})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-details">
          <h3>Order Details</h3>
          <div className="order-items">
            {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <span className="item-quantity">{item.quantity || 1}x</span>
                  <span className="item-name">{item.name || 'Unknown Item'}</span>
                  <span className="item-price">
                    ₹{item.price && !isNaN(item.price) ? Number(item.price).toFixed(2) : '0.00'}
                  </span>
                </div>
              ))
            ) : (
              <div className="no-items">
                <p>No items found for this order</p>
                <small>Please contact support if this seems incorrect</small>
              </div>
            )}
          </div>
          <div className="order-summary">
    <div className="summary-row">
      <span>Subtotal:</span>
      <span>₹{order.subtotal && !isNaN(order.subtotal) ? Number(order.subtotal).toFixed(2) : '0.00'}</span>
    </div>
    <div className="summary-row">
      <span>Delivery Fee:</span>
      <span>₹{order.deliveryFee && !isNaN(order.deliveryFee) ? Number(order.deliveryFee).toFixed(2) : '0.00'}</span>
    </div>
    <div className="summary-row">
      <span>Tax:</span>
      <span>₹{order.tax && !isNaN(order.tax) ? Number(order.tax).toFixed(2) : '0.00'}</span>
    </div>
    <div className="summary-row total">
      <span>Total:</span>
      <span>₹{order.total && !isNaN(order.total) ? Number(order.total).toFixed(2) : '0.00'}</span>
    </div>
  </div>
</div>
      </div>
    </div>
  );
};

export default DeliveryTracking;