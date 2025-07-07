// Enhanced React component with proper charts and Indian map
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "../css/AdminInsights.css";
const AdminInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
const mapRef = useRef(null);
const leafletMapRef = useRef(null);
 useEffect(() => {
  // Small delay to ensure localStorage is ready
  setTimeout(() => {
    fetchInsights();
  }, 100);
}, []);
const initializeMap = useCallback(() => {
  if (!mapRef.current || !insights?.deliveryLocations) return;
  
  // Clear existing map
  if (leafletMapRef.current) {
  try {
    leafletMapRef.current.remove();
  } catch (error) {
    console.log('Map already removed');
  }
  leafletMapRef.current = null;
}
  
  // Initialize map centered on India
  leafletMapRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(leafletMapRef.current);
  
  // Add markers for delivery locations
  insights.deliveryLocations.forEach(location => {
    const markerSize = Math.max(20, Math.min(50, location.count * 3));
    
    // Create custom icon based on delivery count
    const customIcon = L.divIcon({
      html: `
        <div style="
          background: #ff4444;
          border-radius: 50%;
          width: ${markerSize}px;
          height: ${markerSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${Math.max(10, markerSize/3)}px;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${location.count}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [markerSize, markerSize],
      iconAnchor: [markerSize/2, markerSize/2]
    });
    
    const marker = L.marker([location.latitude, location.longitude], {
      icon: customIcon
    }).addTo(leafletMapRef.current);
    
    // Add popup with location details
    marker.bindPopup(`
      <div style="text-align: center;">
        <h4 style="margin: 0 0 5px 0;">${location.city}</h4>
        <p style="margin: 0;"><strong>${location.count}</strong> deliveries</p>
      </div>
    `);
  });
},[insights]);
useEffect(() => {
  if (insights && insights.deliveryLocations) {
    initializeMap();
  }
  
  // Cleanup function
  return () => {
  if (leafletMapRef.current) {
    try {
      leafletMapRef.current.remove();
    } catch (error) {
      console.log('Map cleanup: already removed');
    }
    leafletMapRef.current = null;
  }
};
}, [insights,initializeMap]);

  const fetchInsights = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = user.token || localStorage.getItem('token');

console.log('Token:', token);
console.log('User:', user);
console.log('Is Admin:', user.isAdmin);

if (!token) {
  console.error('No token found in localStorage');
  setInsights(null);
  return;
}

if (!user.isAdmin) {
  console.error('User is not admin');
  setInsights(null);
  return;
}

    const response = await fetch('http://localhost:5000/api/admin/insights', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setInsights(data);
  } catch (error) {
    console.error('Error fetching insights:', error);
  } finally {
    setLoading(false);
  }
};


  // Color schemes for charts
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
  const statusColors = {
    'pending': '#ffc107',
    'processing': '#17a2b8',
    'shipped': '#28a745',
    'delivered': '#007bff',
    'cancelled': '#dc3545'
  };

//   // Indian states coordinates for mapping
//   const indianStates = {
//     'Maharashtra': { lat: 19.7515, lng: 75.7139 },
//     'Delhi': { lat: 28.7041, lng: 77.1025 },
//     'Karnataka': { lat: 15.3173, lng: 75.7139 },
//     'Tamil Nadu': { lat: 11.1271, lng: 78.6569 },
//     'Gujarat': { lat: 23.0225, lng: 72.5714 },
//     'Rajasthan': { lat: 27.0238, lng: 74.2179 },
//     'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
//     'West Bengal': { lat: 22.9868, lng: 87.8550 },
//     'Andhra Pradesh': { lat: 15.9129, lng: 79.7400 },
//     'Madhya Pradesh': { lat: 22.9734, lng: 78.6569 },
//     'Odisha': { lat: 20.9517, lng: 85.0985 },
//     'Telangana': { lat: 18.1124, lng: 79.0193 },
//     'Bihar': { lat: 25.0961, lng: 85.3131 },
//     'Assam': { lat: 26.2006, lng: 92.9376 },
//     'Jharkhand': { lat: 23.6102, lng: 85.2799 },
//     'Haryana': { lat: 29.0588, lng: 76.0856 },
//     'Punjab': { lat: 31.1471, lng: 75.3412 },
//     'Himachal Pradesh': { lat: 31.1048, lng: 77.1734 },
//     'Uttarakhand': { lat: 30.0668, lng: 79.0193 },
//     'Chhattisgarh': { lat: 21.2787, lng: 81.8661 },
//     'Goa': { lat: 15.2993, lng: 74.1240 },
//     'Kerala': { lat: 10.8505, lng: 76.2711 },
//     'Manipur': { lat: 24.6637, lng: 93.9063 },
//     'Meghalaya': { lat: 25.4670, lng: 91.3662 },
//     'Mizoram': { lat: 23.1645, lng: 92.9376 },
//     'Nagaland': { lat: 26.1584, lng: 94.5624 },
//     'Sikkim': { lat: 27.5330, lng: 88.5122 },
//     'Tripura': { lat: 23.9408, lng: 91.9882 },
//     'Arunachal Pradesh': { lat: 28.2180, lng: 94.7278 }
//   };

  if (loading) {
    return <div className="loading">Loading insights...</div>;
  }

  if (!insights) {
    return <div className="error">Failed to load insights</div>;
  }

  return (
    <div className="insights-admin">
      <h2>📊 Advanced Analytics Dashboard</h2>
      
      <div className="insights-grid">
        {/* Sales Performance with Line Chart */}
        <div className="chart-card large-card">
          <h3>💰 Sales Performance</h3>
          <div className="metrics-row">
            <div className="metric">
              <div className="metric-value">₹{insights.totalRevenue.toLocaleString()}</div>
              <div className="metric-label">Total Revenue</div>
            </div>
            <div className="metric">
              <div className="metric-value">{insights.totalOrders.toLocaleString()}</div>
              <div className="metric-label">Total Orders</div>
            </div>
            <div className="metric">
              <div className="metric-value">₹{insights.avgOrderValue.toFixed(2)}</div>
              <div className="metric-label">Avg Order Value</div>
            </div>
          </div>
          
          <div className="chart-container">
            <h4>Revenue Trends (Last 7 Days)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={insights.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
  dataKey="period" 
  tickFormatter={(value) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric' 
    });
  }}
/>
                <YAxis />
                <Tooltip 
  formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, 'Revenue']}
  labelFormatter={(label) => {
    const date = new Date(label);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }}
/>
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="chart-card">
          <h3>🏆 Top Products</h3>
          <ResponsiveContainer width="100%" height={350}>
  <BarChart data={insights.topProducts?.slice(0, 6) || []} layout="vertical">
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis type="number" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
    <YAxis 
      dataKey="name" 
      type="category" 
      width={100} 
      tick={{ fontSize: 11 }}
      tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
    />
    <Tooltip 
      formatter={(value, name) => {
        if (name === 'revenue') return [`₹${parseFloat(value).toLocaleString()}`, 'Revenue'];
        if (name === 'quantity') return [value, 'Units Sold'];
        return [value, name];
      }}
      labelFormatter={(label) => `Product: ${label}`}
    />
    <Bar dataKey="revenue" fill="#82ca9d" radius={[0, 4, 4, 0]} />
    <Bar dataKey="quantity" fill="#8884d8" radius={[0, 4, 4, 0]} />
  </BarChart>
</ResponsiveContainer>

<div className="top-products-summary">
  <h4>Revenue Breakdown</h4>
  <div className="products-list">
    {insights.topProducts?.slice(0, 3).map((product, i) => (
      <div key={i} className="product-summary">
        <span className="rank">#{i + 1}</span>
        <span className="product-name">{product.name}</span>
        <span className="product-revenue">₹{parseFloat(product.revenue).toLocaleString()}</span>
      </div>
    ))}
  </div>
</div>
        </div>

        {/* User Engagement */}
        {/* User Engagement & Growth Analytics - Enhanced */}
<div className="chart-card large-card">
  <h3>👥 User Engagement & Growth Analytics</h3>
  
  {/* User Metrics Dashboard */}
  <div className="user-metrics-dashboard">
    <div className="metric-card primary">
      <div className="metric-icon">👤</div>
      <div className="metric-content">
        <div className="metric-value">{insights.newUsers}</div>
        <div className="metric-label">New Users (7 days)</div>
        <div className="metric-change">
          +{Math.round((insights.newUsers / 7) * 100) / 100} avg/day
        </div>
      </div>
    </div>
    
    <div className="metric-card success">
      <div className="metric-icon">🔄</div>
      <div className="metric-content">
        <div className="metric-value">{insights.activeUsers}</div>
        <div className="metric-label">Active Users (30 days)</div>
        <div className="metric-change">
          {((insights.activeUsers / insights.totalUsers) * 100).toFixed(1)}% of total
        </div>
      </div>
    </div>
    
    <div className="metric-card warning">
      <div className="metric-icon">📊</div>
      <div className="metric-content">
        <div className="metric-value">{insights.retentionRate.toFixed(1)}%</div>
        <div className="metric-label">Retention Rate</div>
        <div className="metric-change">
          {insights.retentionRate >= 50 ? 'Excellent' : insights.retentionRate >= 30 ? 'Good' : 'Needs Improvement'}
        </div>
      </div>
    </div>
    
    <div className="metric-card info">
      <div className="metric-icon">📈</div>
      <div className="metric-content">
        <div className="metric-value">{insights.totalUsers}</div>
        <div className="metric-label">Total Users</div>
        <div className="metric-change">
          {((insights.newUsers30d / insights.totalUsers) * 100).toFixed(1)}% growth (30d)
        </div>
      </div>
    </div>
  </div>

  {/* User Growth Charts */}
  <div className="user-growth-charts">
    {/* Growth Comparison Chart */}
    <div className="growth-chart-section">
      <h4>📈 User Growth Comparison</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={[
          { 
            name: 'New (7d)', 
            value: insights.newUsers,
            target: Math.round(insights.newUsers * 1.2),
            color: '#8884d8' 
          },
          { 
            name: 'New (30d)', 
            value: insights.newUsers30d || insights.newUsers * 4,
            target: Math.round((insights.newUsers30d || insights.newUsers * 4) * 1.15),
            color: '#82ca9d' 
          },
          { 
            name: 'Active (30d)', 
            value: insights.activeUsers,
            target: Math.round(insights.activeUsers * 1.1),
            color: '#ffc658' 
          }
        ]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'value') return [value, 'Current'];
              if (name === 'target') return [value, 'Target'];
              return [value, name];
            }}
          />
          <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Current" />
          <Bar dataKey="target" fill="#e0e0e0" radius={[4, 4, 0, 0]} name="Target" opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* User Activity Funnel */}
    <div className="activity-funnel-section">
      <h4>🔍 User Activity Funnel</h4>
      <div className="funnel-container">
        <div className="funnel-step">
          <div className="funnel-bar total-users" style={{ width: '100%' }}>
            <span className="funnel-label">Total Users</span>
            <span className="funnel-value">{insights.totalUsers}</span>
          </div>
        </div>
        <div className="funnel-step">
          <div 
            className="funnel-bar active-users" 
            style={{ width: `${(insights.activeUsers / insights.totalUsers) * 100}%` }}
          >
            <span className="funnel-label">Active (30d)</span>
            <span className="funnel-value">{insights.activeUsers}</span>
          </div>
        </div>
        <div className="funnel-step">
          <div 
            className="funnel-bar recent-users" 
            style={{ width: `${(insights.activeUsers7d / insights.totalUsers) * 100}%` }}
          >
            <span className="funnel-label">Active (7d)</span>
            <span className="funnel-value">{insights.activeUsers7d}</span>
          </div>
        </div>
        <div className="funnel-step">
          <div 
            className="funnel-bar new-users" 
            style={{ width: `${(insights.newUsers / insights.totalUsers) * 100}%` }}
          >
            <span className="funnel-label">New (7d)</span>
            <span className="funnel-value">{insights.newUsers}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* User Engagement Insights */}
  <div className="engagement-insights">
    <div className="insights-grid">
      <div className="insight-card">
        <h5>🎯 User Activation</h5>
        <div className="insight-metric">
          <span className="insight-percentage">
            {((insights.activeUsers / insights.totalUsers) * 100).toFixed(1)}%
          </span>
          <span className="insight-description">
            of users are active monthly
          </span>
        </div>
        <div className="insight-trend">
          <span className={`trend-indicator ${insights.activeUsers > insights.newUsers30d ? 'positive' : 'negative'}`}>
            {insights.activeUsers > insights.newUsers30d ? '↗' : '↘'}
          </span>
          <span className="trend-text">
            {insights.activeUsers > insights.newUsers30d ? 'Growing' : 'Declining'} user base
          </span>
        </div>
      </div>

      <div className="insight-card">
        <h5>⚡ Daily Growth Rate</h5>
        <div className="insight-metric">
          <span className="insight-percentage">
            {(insights.newUsers / 7).toFixed(1)}
          </span>
          <span className="insight-description">
            new users per day
          </span>
        </div>
        <div className="insight-trend">
          <span className="trend-indicator positive">📈</span>
          <span className="trend-text">
            {insights.newUsers > 0 ? 'Active' : 'Stagnant'} acquisition
          </span>
        </div>
      </div>

      <div className="insight-card">
        <h5>🔄 Retention Health</h5>
        <div className="insight-metric">
          <span className="insight-percentage">
            {insights.retentionRate.toFixed(1)}%
          </span>
          <span className="insight-description">
            user retention rate
          </span>
        </div>
        <div className="insight-trend">
          <span className={`trend-indicator ${insights.retentionRate >= 30 ? 'positive' : 'negative'}`}>
            {insights.retentionRate >= 30 ? '💚' : '🔴'}
          </span>
          <span className="trend-text">
            {insights.retentionRate >= 50 ? 'Excellent' : insights.retentionRate >= 30 ? 'Good' : 'Poor'} retention
          </span>
        </div>
      </div>

      <div className="insight-card">
        <h5>📊 Growth Velocity</h5>
        <div className="insight-metric">
          <span className="insight-percentage">
            {((insights.newUsers30d / insights.totalUsers) * 100).toFixed(1)}%
          </span>
          <span className="insight-description">
            monthly growth rate
          </span>
        </div>
        <div className="insight-trend">
          <span className="trend-indicator positive">🚀</span>
          <span className="trend-text">
            {insights.newUsers30d > insights.totalUsers * 0.05 ? 'Fast' : 'Steady'} growth
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* User Engagement Timeline */}
  <div className="engagement-timeline">
    <h4>📅 User Engagement Timeline</h4>
    <div className="timeline-container">
      <div className="timeline-item">
        <div className="timeline-date">Last 7 Days</div>
        <div className="timeline-content">
          <div className="timeline-metric">
            <span className="metric-number">{insights.newUsers}</span>
            <span className="metric-text">New Users</span>
          </div>
          <div className="timeline-metric">
            <span className="metric-number">{insights.activeUsers7d}</span>
            <span className="metric-text">Active Users</span>
          </div>
        </div>
      </div>
      
      <div className="timeline-item">
        <div className="timeline-date">Last 30 Days</div>
        <div className="timeline-content">
          <div className="timeline-metric">
            <span className="metric-number">{insights.newUsers30d}</span>
            <span className="metric-text">New Users</span>
          </div>
          <div className="timeline-metric">
            <span className="metric-number">{insights.activeUsers}</span>
            <span className="metric-text">Active Users</span>
          </div>
        </div>
      </div>
      
      <div className="timeline-item">
        <div className="timeline-date">Total</div>
        <div className="timeline-content">
          <div className="timeline-metric">
            <span className="metric-number">{insights.totalUsers}</span>
            <span className="metric-text">Total Users</span>
          </div>
          <div className="timeline-metric">
            <span className="metric-number">{insights.retentionRate.toFixed(1)}%</span>
            <span className="metric-text">Retention</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Indian Map with Delivery Locations */}
<div className="chart-card large-card">
  <h3>🗺️ Delivery Locations - India</h3>
  <div 
    ref={mapRef} 
    className="leaflet-map-container"
    style={{ 
      height: '400px', 
      width: '100%', 
      borderRadius: '8px',
      overflow: 'hidden'
    }}
  ></div>
  
  <div className="location-stats">
    <h4>Top Delivery Cities</h4>
    <div className="city-list">
      {insights.topCities.map((city, i) => (
        <div key={i} className="city-item">
          <span className="city-name">{city.city}</span>
          <span className="city-count">{city.count} deliveries</span>
          <div className="city-bar">
            <div 
              className="city-bar-fill"
              style={{ width: `${(city.count / insights.topCities[0].count) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
        

        {/* Order Status Pie Chart */}
        {/* Order Status Distribution - Enhanced */}
<div className="chart-card large-card">
  <h3>📦 Order Status Distribution & Analytics</h3>
  
  {/* Status Summary Cards */}
  <div className="status-summary-grid">
    {Object.entries(insights.orderStatus).map(([status, count]) => {
      const percentage = (count / insights.totalOrders * 100).toFixed(1);
      return (
        <div key={status} className="status-summary-card">
          <div className="status-header">
            <div 
              className="status-indicator" 
              style={{ backgroundColor: statusColors[status] || '#8884d8' }}
            ></div>
            <span className="status-name">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div className="status-count">{count}</div>
          <div className="status-percentage">{percentage}%</div>
        </div>
      );
    })}
  </div>

  <div className="status-charts-container">
    {/* Pie Chart */}
    <div className="pie-chart-section">
      <h4>Status Distribution</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={Object.entries(insights.orderStatus).map(([status, count]) => ({
              name: status.charAt(0).toUpperCase() + status.slice(1),
              value: count,
              color: statusColors[status] || '#8884d8'
            }))}
            cx="50%"
            cy="50%"
            outerRadius={70}
            dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {Object.entries(insights.orderStatus).map(([status, count], index) => (
              <Cell key={status} fill={statusColors[status] || chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Status Progress Bars */}
    <div className="status-bars-section">
      <h4>Order Processing Pipeline</h4>
      <div className="status-bars">
        {Object.entries(insights.orderStatus)
          .sort(([a], [b]) => {
            const order = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            return order.indexOf(a) - order.indexOf(b);
          })
          .map(([status, count]) => {
            const percentage = (count / insights.totalOrders * 100);
            return (
              <div key={status} className="status-bar-item">
                <div className="status-bar-header">
                  <span className="status-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <span className="status-value">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="status-bar-track">
                  <div 
                    className="status-bar-fill"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: statusColors[status] || '#8884d8'
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  </div>

  {/* Status Insights */}
  <div className="status-insights">
    <div className="insight-item">
      <span className="insight-label">Completion Rate</span>
      <span className="insight-value success">
        {((insights.orderStatus.delivered || 0) / insights.totalOrders * 100).toFixed(1)}%
      </span>
    </div>
    <div className="insight-item">
      <span className="insight-label">Processing Orders</span>
      <span className="insight-value warning">
        {(insights.orderStatus.processing || 0) + (insights.orderStatus.shipped || 0)}
      </span>
    </div>
    <div className="insight-item">
      <span className="insight-label">Cancellation Rate</span>
      <span className="insight-value danger">
        {((insights.orderStatus.cancelled || 0) / insights.totalOrders * 100).toFixed(1)}%
      </span>
    </div>
  </div>
</div>

        {/* Peak Hours Chart */}
        <div className="chart-card large-card">
  <h3>⏰ Peak Hours Analysis & Traffic Patterns</h3>
  
  {/* Peak Hours Summary */}
  <div className="peak-hours-summary">
    <div className="peak-metric">
      <div className="peak-icon">🔥</div>
      <div className="peak-content">
        <div className="peak-value">
          {insights.peakHours.reduce((max, hour) => hour.orders > max.orders ? hour : max, {orders: 0}).hour}:00
        </div>
        <div className="peak-label">Peak Hour</div>
      </div>
    </div>
    
    <div className="peak-metric">
      <div className="peak-icon">📊</div>
      <div className="peak-content">
        <div className="peak-value">
          {Math.max(...insights.peakHours.map(h => h.orders))}
        </div>
        <div className="peak-label">Max Orders/Hour</div>
      </div>
    </div>
    
    <div className="peak-metric">
      <div className="peak-icon">⚡</div>
      <div className="peak-content">
        <div className="peak-value">
          {(insights.peakHours.reduce((sum, hour) => sum + hour.orders, 0) / insights.peakHours.length).toFixed(1)}
        </div>
        <div className="peak-label">Avg Orders/Hour</div>
      </div>
    </div>
    
    <div className="peak-metric">
      <div className="peak-icon">🎯</div>
      <div className="peak-content">
        <div className="peak-value">
          {insights.peakHours.filter(h => h.orders > (insights.peakHours.reduce((sum, hour) => sum + hour.orders, 0) / insights.peakHours.length)).length}
        </div>
        <div className="peak-label">High Traffic Hours</div>
      </div>
    </div>
  </div>

  {/* Enhanced Chart */}
  <div className="peak-hours-chart">
    <h4>Hourly Order Distribution</h4>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={insights.peakHours}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="hour" 
          tickFormatter={(value) => `${value}:00`}
        />
        <YAxis />
        <Tooltip 
          formatter={(value) => [value, 'Orders']}
          labelFormatter={(label) => `${label}:00 - ${label}:59`}
        />
        <Bar 
          dataKey="orders" 
          fill="#ffc658"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* Time Periods Analysis */}
  <div className="time-periods-analysis">
    <h4>Traffic Analysis by Time Periods</h4>
    <div className="time-periods-grid">
      <div className="time-period-card">
        <div className="period-header">
          <span className="period-icon">🌅</span>
          <span className="period-name">Morning (6-12)</span>
        </div>
        <div className="period-stats">
          <div className="period-orders">
            {insights.peakHours.filter(h => h.hour >= 6 && h.hour < 12).reduce((sum, h) => sum + h.orders, 0)}
          </div>
          <div className="period-percentage">
            {((insights.peakHours.filter(h => h.hour >= 6 && h.hour < 12).reduce((sum, h) => sum + h.orders, 0) / insights.peakHours.reduce((sum, h) => sum + h.orders, 0)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="time-period-card">
        <div className="period-header">
          <span className="period-icon">☀️</span>
          <span className="period-name">Afternoon (12-18)</span>
        </div>
        <div className="period-stats">
          <div className="period-orders">
            {insights.peakHours.filter(h => h.hour >= 12 && h.hour < 18).reduce((sum, h) => sum + h.orders, 0)}
          </div>
          <div className="period-percentage">
            {((insights.peakHours.filter(h => h.hour >= 12 && h.hour < 18).reduce((sum, h) => sum + h.orders, 0) / insights.peakHours.reduce((sum, h) => sum + h.orders, 0)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="time-period-card">
        <div className="period-header">
          <span className="period-icon">🌆</span>
          <span className="period-name">Evening (18-24)</span>
        </div>
        <div className="period-stats">
          <div className="period-orders">
            {insights.peakHours.filter(h => h.hour >= 18 && h.hour <= 23).reduce((sum, h) => sum + h.orders, 0)}
          </div>
          <div className="period-percentage">
            {((insights.peakHours.filter(h => h.hour >= 18 && h.hour <= 23).reduce((sum, h) => sum + h.orders, 0) / insights.peakHours.reduce((sum, h) => sum + h.orders, 0)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="time-period-card">
        <div className="period-header">
          <span className="period-icon">🌙</span>
          <span className="period-name">Night (0-6)</span>
        </div>
        <div className="period-stats">
          <div className="period-orders">
            {insights.peakHours.filter(h => h.hour >= 0 && h.hour < 6).reduce((sum, h) => sum + h.orders, 0)}
          </div>
          <div className="period-percentage">
            {((insights.peakHours.filter(h => h.hour >= 0 && h.hour < 6).reduce((sum, h) => sum + h.orders, 0) / insights.peakHours.reduce((sum, h) => sum + h.orders, 0)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Peak Hours Insights */}
  <div className="peak-insights">
    <div className="insight-card">
      <h5>🎯 Business Insights</h5>
      <div className="insight-list">
        <div className="insight-item">
          <span className="insight-bullet">•</span>
          <span>Peak traffic occurs at {insights.peakHours.reduce((max, hour) => hour.orders > max.orders ? hour : max, {orders: 0, hour: 0}).hour}:00</span>
        </div>
        <div className="insight-item">
          <span className="insight-bullet">•</span>
          <span>
            {insights.peakHours.filter(h => h.hour >= 12 && h.hour < 18).reduce((sum, h) => sum + h.orders, 0) > 
             insights.peakHours.filter(h => h.hour >= 18 && h.hour <= 23).reduce((sum, h) => sum + h.orders, 0) ? 
             'Afternoon' : 'Evening'} period has highest activity
          </span>
        </div>
        <div className="insight-item">
          <span className="insight-bullet">•</span>
          <span>Night hours account for {((insights.peakHours.filter(h => h.hour >= 0 && h.hour < 6).reduce((sum, h) => sum + h.orders, 0) / insights.peakHours.reduce((sum, h) => sum + h.orders, 0)) * 100).toFixed(1)}% of total orders</span>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Monthly Revenue Trend */}
        {/* Monthly Revenue Trend - Enhanced */}
<div className="chart-card large-card">
  <h3>📈 Monthly Revenue & Growth Analytics</h3>
  
  {/* Monthly Summary Cards */}
  <div className="monthly-summary-grid">
    <div className="summary-card">
      <div className="summary-icon">💰</div>
      <div className="summary-content">
        <div className="summary-value">
          ₹{insights.monthlyTrend.reduce((sum, month) => sum + month.revenue, 0).toLocaleString()}
        </div>
        <div className="summary-label">Total Revenue (6 months)</div>
      </div>
    </div>
    
    <div className="summary-card">
      <div className="summary-icon">📊</div>
      <div className="summary-content">
        <div className="summary-value">
          ₹{(insights.monthlyTrend.reduce((sum, month) => sum + month.revenue, 0) / insights.monthlyTrend.length).toLocaleString()}
        </div>
        <div className="summary-label">Average Monthly Revenue</div>
      </div>
    </div>
    
    <div className="summary-card">
      <div className="summary-icon">🎯</div>
      <div className="summary-content">
        <div className="summary-value">
          ₹{Math.max(...insights.monthlyTrend.map(m => m.revenue)).toLocaleString()}
        </div>
        <div className="summary-label">Highest Month</div>
      </div>
    </div>
    
    <div className="summary-card">
      <div className="summary-icon">📈</div>
      <div className="summary-content">
        <div className="summary-value growth">
          {insights.monthlyTrend.length > 1 ? 
            ((insights.monthlyTrend[insights.monthlyTrend.length - 1].revenue - insights.monthlyTrend[insights.monthlyTrend.length - 2].revenue) / insights.monthlyTrend[insights.monthlyTrend.length - 2].revenue * 100).toFixed(1) + '%' 
            : '0%'
          }
        </div>
        <div className="summary-label">Last Month Growth</div>
      </div>
    </div>
  </div>

  {/* Charts Container */}
  <div className="monthly-charts-container">
    {/* Revenue Line Chart */}
    <div className="revenue-chart-section">
      <h4>Revenue Trend</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={insights.monthlyTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-IN', { 
                month: 'short', 
                year: '2-digit' 
              });
            }}
          />
          <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
          <Tooltip 
            formatter={(value) => [`₹${parseFloat(value).toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-IN', { 
                month: 'long', 
                year: 'numeric' 
              });
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#82ca9d" 
            strokeWidth={3}
            dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Orders Bar Chart */}
    <div className="orders-chart-section">
      <h4>Monthly Orders</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={insights.monthlyTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-IN', { 
                month: 'short' 
              });
            }}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value, 'Orders']}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-IN', { 
                month: 'long', 
                year: 'numeric' 
              });
            }}
          />
          <Bar dataKey="orders" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Monthly Breakdown Table */}
  <div className="monthly-breakdown">
    <h4>Monthly Performance Breakdown</h4>
    <div className="breakdown-table">
      <div className="breakdown-header">
        <span>Month</span>
        <span>Revenue</span>
        <span>Orders</span>
        <span>Avg Order</span>
        <span>Growth</span>
      </div>
      {insights.monthlyTrend.map((month, index) => {
        const prevMonth = index > 0 ? insights.monthlyTrend[index - 1] : null;
        const growth = prevMonth ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue * 100) : 0;
        const avgOrder = month.orders > 0 ? month.revenue / month.orders : 0;
        
        return (
          <div key={index} className="breakdown-row">
            <span className="month-name">
              {new Date(month.month).toLocaleDateString('en-IN', { 
                month: 'short', 
                year: '2-digit' 
              })}
            </span>
            <span className="revenue-value">₹{month.revenue.toLocaleString()}</span>
            <span className="orders-value">{month.orders}</span>
            <span className="avg-order-value">₹{avgOrder.toFixed(0)}</span>
            <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>
              {growth.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  </div>

  {/* Performance Indicators */}
  <div className="performance-indicators">
    <div className="indicator-item">
      <div className="indicator-label">Best Performing Month</div>
      <div className="indicator-value">
        {insights.monthlyTrend.reduce((best, current) => 
          current.revenue > best.revenue ? current : best
        ).month ? new Date(insights.monthlyTrend.reduce((best, current) => 
          current.revenue > best.revenue ? current : best
        ).month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}
      </div>
    </div>
    
    <div className="indicator-item">
      <div className="indicator-label">Revenue Consistency</div>
      <div className="indicator-value">
        {insights.monthlyTrend.length > 1 ? 
          (insights.monthlyTrend.filter((month, index) => 
            index === 0 || month.revenue >= insights.monthlyTrend[index - 1].revenue
          ).length / insights.monthlyTrend.length * 100).toFixed(0) + '%' 
          : '100%'
        }
      </div>
    </div>
    
    <div className="indicator-item">
      <div className="indicator-label">Total Orders (6 months)</div>
      <div className="indicator-value">
        {insights.monthlyTrend.reduce((sum, month) => sum + month.orders, 0).toLocaleString()}
      </div>
    </div>
  </div>
</div>

        {/* Inventory Health */}
        <div className="chart-card large-card">
  <h3>📦 Inventory Health & Stock Management</h3>
  
  {/* Inventory Overview Dashboard */}
  <div className="inventory-overview">
    <div className="inventory-metric-card critical">
      <div className="metric-header">
        <div className="metric-icon">🚨</div>
        <span className="metric-title">Critical Stock</span>
      </div>
      <div className="metric-value">{insights.outOfStockItems}</div>
      <div className="metric-subtitle">Out of Stock</div>
      <div className="metric-trend">
        <span className="trend-indicator negative">⚠️</span>
        Requires immediate action
      </div>
    </div>
    
    <div className="inventory-metric-card warning">
      <div className="metric-header">
        <div className="metric-icon">⚡</div>
        <span className="metric-title">Low Stock</span>
      </div>
      <div className="metric-value">{insights.lowStockItems}</div>
      <div className="metric-subtitle">Need Restocking</div>
      <div className="metric-trend">
        <span className="trend-indicator warning">📉</span>
        Reorder soon
      </div>
    </div>
    
    <div className="inventory-metric-card healthy">
      <div className="metric-header">
        <div className="metric-icon">✅</div>
        <span className="metric-title">Healthy Stock</span>
      </div>
      <div className="metric-value">{insights.healthyStockItems}</div>
      <div className="metric-subtitle">Well Stocked</div>
      <div className="metric-trend">
        <span className="trend-indicator positive">📈</span>
        Optimal levels
      </div>
    </div>
    
    <div className="inventory-metric-card info">
      <div className="metric-header">
        <div className="metric-icon">📊</div>
        <span className="metric-title">Stock Health</span>
      </div>
      <div className="metric-value">
        {((insights.healthyStockItems / (insights.outOfStockItems + insights.lowStockItems + insights.healthyStockItems)) * 100).toFixed(1)}%
      </div>
      <div className="metric-subtitle">Overall Health</div>
      <div className="metric-trend">
        <span className="trend-indicator positive">💚</span>
        Good condition
      </div>
    </div>
  </div>

  {/* Stock Distribution Chart */}
  <div className="stock-distribution">
    <h4>Stock Distribution Overview</h4>
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={[
            { name: 'Healthy Stock', value: insights.healthyStockItems, color: '#28a745' },
            { name: 'Low Stock', value: insights.lowStockItems, color: '#ffc107' },
            { name: 'Out of Stock', value: insights.outOfStockItems, color: '#dc3545' }
          ]}
          cx="50%"
          cy="50%"
          outerRadius={70}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          <Cell fill="#28a745" />
          <Cell fill="#ffc107" />
          <Cell fill="#dc3545" />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

  {/* Critical Stock Alerts */}
  <div className="critical-stock-section">
  <h4>🚨 Critical Stock Alerts</h4>
  <table className="stock-alerts-table">
    <thead>
      <tr>
        <th>Product Name</th>
        <th>Stock Quantity</th>
        <th>Status</th>
        <th>Priority</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {insights.lowStockProducts.slice(0, 8).map((product, i) => (
        <tr key={`${product.name}-${i}`}>
          <td className="product-name">{product.name}</td>
          <td className="current-stock">{product.stock_quantity} {product.unit}</td>
          <td className={`stock-status ${product.stock_quantity === 0 ? 'out-of-stock' : 'low-stock'}`}>
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
          </td>
          <td className={`alert-priority ${product.stock_quantity === 0 ? 'URGENT' : 'HIGH'}`}>
            {product.stock_quantity === 0 ? 'URGENT' : 'HIGH'}
          </td>
          <td>
            <button className="reorder-btn">
              {product.stock_quantity === 0 ? 'Reorder Now' : 'Restock Soon'}
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

  {/* Inventory Insights */}
  <div className="inventory-insights">
    <div className="insights-grid">
      <div className="insight-card">
        <h5>📈 Stock Performance</h5>
        <div className="insight-metrics">
          <div className="insight-metric">
            <span className="metric-label">Stock Turnover</span>
            <span className="metric-value">
              {(insights.totalOrders / (insights.healthyStockItems + insights.lowStockItems + insights.outOfStockItems)).toFixed(1)}x
            </span>
          </div>
          <div className="insight-metric">
            <span className="metric-label">Reorder Frequency</span>
            <span className="metric-value">
              {Math.ceil(insights.lowStockItems / 7)} per week
            </span>
          </div>
        </div>
      </div>

      <div className="insight-card">
        <h5>⚡ Action Required</h5>
        <div className="action-items">
          <div className="action-item urgent">
            <span className="action-count">{insights.outOfStockItems}</span>
            <span className="action-text">items need immediate restocking</span>
          </div>
          <div className="action-item warning">
            <span className="action-count">{insights.lowStockItems}</span>
            <span className="action-text">items need reordering soon</span>
          </div>
        </div>
      </div>

      <div className="insight-card">
        <h5>💡 Recommendations</h5>
        <div className="recommendations">
          <div className="recommendation">
            <span className="rec-icon">🎯</span>
            <span className="rec-text">
              {insights.outOfStockItems > 0 ? 'Focus on restocking critical items' : 'Maintain current stock levels'}
            </span>
          </div>
          <div className="recommendation">
            <span className="rec-icon">📊</span>
            <span className="rec-text">
              Stock health is {((insights.healthyStockItems / (insights.outOfStockItems + insights.lowStockItems + insights.healthyStockItems)) * 100).toFixed(0)}% - 
              {insights.healthyStockItems > (insights.outOfStockItems + insights.lowStockItems) ? ' Good' : ' Needs attention'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Stock Timeline */}
  <div className="stock-timeline">
    <h4>📅 Stock Management Timeline</h4>
    <div className="timeline-items">
      <div className="timeline-item immediate">
        <div className="timeline-marker urgent"></div>
        <div className="timeline-content">
          <div className="timeline-title">Immediate Action</div>
          <div className="timeline-description">
            {insights.outOfStockItems} items out of stock - reorder immediately
          </div>
        </div>
      </div>
      
      <div className="timeline-item soon">
        <div className="timeline-marker warning"></div>
        <div className="timeline-content">
          <div className="timeline-title">Next 7 Days</div>
          <div className="timeline-description">
            {insights.lowStockItems} items will need restocking
          </div>
        </div>
      </div>
      
      <div className="timeline-item future">
        <div className="timeline-marker healthy"></div>
        <div className="timeline-content">
          <div className="timeline-title">Well Stocked</div>
          <div className="timeline-description">
            {insights.healthyStockItems} items have healthy stock levels
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
      </div>
    </div>
  );
};

export default AdminInsights;