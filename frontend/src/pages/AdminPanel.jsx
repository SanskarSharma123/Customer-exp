import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/AdminPanel.css";
import productImages from "../components/ProductImages";
import AdminInsights from "./AdminInsights";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [newPersonnel, setNewPersonnel] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    discount_price: 0,
    category_id: '',
    subcategory_id: '',
    image_url: '',
    stock_quantity: 0,
    unit: 'pieces',
    is_featured: false
  });
  const navigate = useNavigate();
  const [productQuery, setProductQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [previewPrices, setPreviewPrices] = useState([]);
const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const profileResponse = await fetch(`${apiUrl}/profile`, {
          credentials: "include",
          signal: controller.signal
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || 'Failed to fetch profile');
        }

        const profileData = await profileResponse.json();
        if (!profileData.user?.isAdmin) {
          navigate("/");
          return;
        }

        const endpoints = [
          `${apiUrl}/admin/products`,
          `${apiUrl}/admin/orders`,
          `${apiUrl}/admin/users`,
          `${apiUrl}/categories`,
          `${apiUrl}/subcategories`,
          `${apiUrl}/admin/delivery-personnel`,
          `${apiUrl}/admin/reviews`,
          `${apiUrl}/admin/recommendations`,
          `${apiUrl}/admin/insights`
        ];

        const fetchPromises = endpoints.map(endpoint => 
          fetch(endpoint, {
            credentials: "include",
            signal: controller.signal
          }).then(response => {
            if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
            return response.json();
          })
        );

        const [
          productsData,
          ordersData,
          usersData,
          categoriesData,
          subcategoriesData,
          personnelData,
          reviewsData,
          recommendationsData,
          insightsData
        ] = await Promise.all(fetchPromises);

        setProducts(productsData);
        setOrders(ordersData);
        setUsers(usersData);
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
        setPersonnel(personnelData);
        setReviews(reviewsData);
        setRecommendations(Array.isArray(recommendationsData) ? recommendationsData : []);
        setInsights(insightsData);
        setLoading(false);
      } catch (error) {
        console.error('Admin panel error:', error);
        setError(error.name === 'AbortError' ? 'Request timed out (60s)' : error.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (editingProduct) {
      setEditingProduct(prev => ({ ...prev, [name]: val }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: val }));
    }
  };

  const generateProductSuggestions = async () => {
    if (!productQuery.trim()) {
      setError('Please enter a product name');
      return;
    }
    
    setGenerating(true);
    setError('');
    
    try {
      console.log('Generating suggestions for:', productQuery.trim());
      const response = await fetch(`${apiUrl}/admin/generate-product-suggestions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ productName: productQuery.trim() }),
        credentials: 'include'
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Actual response:', responseText.substring(0, 200) + '...');
        throw new Error('Server returned non-JSON response.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format received');
      }
      
      if (!data.name || !data.description || !data.category) {
        console.error('Incomplete suggestion data:', data);
        throw new Error('Incomplete suggestion data received from server');
      }
      
      const validatedData = {
        name: data.name || productQuery.trim(),
        description: data.description || `Quality ${productQuery.trim()} product`,
        price: parseFloat(data.price) || 100,
        category: data.category || 'General',
        subcategory: data.subcategory || '',
        unit: data.unit || 'pieces',
       stock_quantity: parseInt(data.stock_quantity) || 10,
        image_url: data.image_url || ''
      };
      
      setSuggestions(validatedData);
      console.log('Successfully generated suggestions:', validatedData);
    alert('✅ Suggestions generated successfully!');
    } catch (error) {
      console.error('Product suggestion error:', error);
      let userMessage = 'Failed to generate product suggestions. ';
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        userMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('non-JSON response')) {
        userMessage += 'Server error detected. Please try again in a few moments.';
      } else if (error.message.includes('authentication') || error.message.includes('401')) {
        userMessage += 'Authentication failed. Please refresh the page and try again.';
      } else if (error.message.includes('Server error: 500')) {
        userMessage += 'Internal server error. Please try again later.';
      } else if (error.message.includes('timeout')) {
        userMessage += 'Request timed out. Please try again.';
      } else {
        userMessage += error.message || 'Please try again.';
      }
      
      setError(userMessage);
      alert(`❌ ${userMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const applySuggestions = () => {
    if (!suggestions) return;
    
    const categoryMatch = categories.find(cat => 
      cat.name.toLowerCase().includes(suggestions.category.toLowerCase()) ||
      suggestions.category.toLowerCase().includes(cat.name.toLowerCase())
    );
    
    const subcategoryMatch = subcategories.find(sub =>
      sub.name.toLowerCase().includes(suggestions.subcategory?.toLowerCase() || '') &&
      (!categoryMatch || sub.category_id === categoryMatch.category_id)
    );
    
    const suggestionData = {
      name: suggestions.name || '',
      description: suggestions.description || '',
      price: suggestions.price || 0,
      category_id: categoryMatch?.category_id || '',
      subcategory_id: subcategoryMatch?.subcategory_id || '',
      stock_quantity: suggestions.stock_quantity || 10,
      unit: suggestions.unit || 'pieces',
      image_url: suggestions.image_url || '',
      discount_price: 0,
      is_featured: false
    };
    
    if (editingProduct) {
      setEditingProduct(prev => ({ ...prev, ...suggestionData }));
    } else {
      setNewProduct(prev => ({ ...prev, ...suggestionData }));
    }
    
    setSuggestions(null);
    setProductQuery('');
    alert('✅ AI suggestions applied! Please review and adjust as needed.');
  };

  const handleAddProduct = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      const productsRes = await fetch(`${apiUrl}/admin/products`, { credentials: "include" });
      setProducts(await productsRes.json());
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        discount_price: 0,
        category_id: '',
        subcategory_id: '',
        image_url: '',
        stock_quantity: 0,
        unit: 'pieces',
        is_featured: false
      });
    } catch (error) {
      console.error("Error adding product:", error);
      setError(error.message);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/products/${editingProduct.product_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      const productsRes = await fetch(`${apiUrl}/admin/products`, { credentials: "include" });
      setProducts(await productsRes.json());
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      setError(error.message);
    }
  };

 const handlePreviewPricing = async () => {
  setPricingLoading(true);
  setError('');
  
  try {
    const response = await fetch(`${apiUrl}/admin/dynamic-pricing/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to preview dynamic pricing');
    }
    
    const previewData = await response.json();
setPreviewPrices(previewData.data);  // <-- Extract the 'data' property
setShowPreview(true);
  } catch (error) {
    console.error('Preview pricing error:', error);
    setError(error.message);
    alert(`❌ ${error.message}`);
  } finally {
    setPricingLoading(false);
  }
};

const handleApplyPricing = async () => {
  if (!window.confirm('Are you sure you want to apply these price changes?')) return;
  
  setPricingLoading(true);
  setError('');
  
  try {
    const response = await fetch(`${apiUrl}/admin/dynamic-pricing/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to apply dynamic pricing');
    }
    
    const updatedProducts = await response.json();
    setProducts(updatedProducts);
    setShowPreview(false);
    setPreviewPrices([]);
    alert('✅ Dynamic pricing applied successfully!');
  } catch (error) {
    console.error('Apply pricing error:', error);
    setError(error.message);
    alert(`❌ ${error.message}`);
  } finally {
    setPricingLoading(false);
  }
};

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${apiUrl}/admin/products/${productId}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete product');
        }

        setProducts(products.filter(product => product.product_id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
        setError(error.message);
      }
    }
  };

  const handleToggleAdmin = async (userId, isAdmin) => {
    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
        credentials: "include"
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update admin status');
      }
  
      const updatedUsers = users.map(user => 
        user.user_id === userId ? { ...user, is_admin: isAdmin } : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error updating admin status:", error);
      setError(error.message);
    }
  };

  const handleAddPersonnel = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/delivery-personnel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPersonnel),
        credentials: "include"
      });

      const data = await response.json();
      setPersonnel([...personnel, data]);
      setNewPersonnel({ name: '', email: '', phone: '', password: '' });
    } catch (error) {
      console.error("Error adding personnel:", error);
      setError(error.message);
    }
  };

  const handleDeletePersonnel = async (id) => {
    if (window.confirm('Are you sure you want to delete this personnel?')) {
      try {
        const response = await fetch(`${apiUrl}/admin/delivery-personnel/${id}`, {
          method: "DELETE",
          credentials: "include"
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          
          if (errorData.details?.hasActiveOrders) {
            alert('Cannot delete personnel with active deliveries');
            return;
          }
          
          throw new Error(errorData.message || 'Failed to delete personnel');
        }
  
        setPersonnel(personnel.filter(p => p.personnel_id !== id));
      } catch (error) {
        console.error("Deletion error:", error);
        setError(error.message);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, personnelId) => {
    try {
      const response = await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          ...(personnelId && { personnelId }) 
        }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update order status");
      }

      const [ordersRes, personnelRes] = await Promise.all([
        fetch(`${apiUrl}/admin/orders`, { credentials: "include" }),
        fetch(`${apiUrl}/admin/delivery-personnel`, { credentials: "include" })
      ]);
      
      setOrders(await ordersRes.json());
      setPersonnel(await personnelRes.json());
    } catch (error) {
      console.error("Error updating order status:", error);
      setError(error.message);
    }
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

  const getTabIcon = (tab) => {
    const icons = {
      products: '📦',
      orders: '📋',
      users: '👥',
      personnel: '🚚',
      reviews: '⭐',
      recommendations: '🎯',
      dynamic_pricing: '💰',
      insights: '📊'
      
    };
    return icons[tab] || '';
  };

  const getTabCount = (tab) => {
    const counts = {
      products: Array.isArray(products) ? products.length : 0,
      orders: Array.isArray(orders) ? orders.length : 0,
      users: Array.isArray(users) ? users.length : 0,
      personnel: Array.isArray(personnel) ? personnel.length : 0,
      reviews: Array.isArray(reviews) ? reviews.length : 0,
      recommendations: Array.isArray(recommendations) ? recommendations.length : 0,
      dynamic_pricing: previewPrices.length,
      insights: insights ? 1 : 0
    };
    return counts[tab] || 0;
  };

  if (loading) return <div className="loading">Loading admin panel...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <h2>🎛️ Admin Panel</h2>
        <ul>
          {["products", "orders", "users", "personnel", "reviews", "recommendations", "dynamic_pricing", "insights"].map(tab => (
            <li
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              <span>
                {getTabIcon(tab)} {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                <span style={{ 
                  float: 'right', 
                  background: activeTab === tab ? 'rgba(255,255,255,0.3)' : 'var(--primary-gradient)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {getTabCount(tab)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-content">
        {activeTab === "products" && (
          <div className="products-admin">
            <h2>
              📦 Manage Products
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="add-product"
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      description: '',
                      price: 0,
                      discount_price: 0,
                      category_id: '',
                      subcategory_id: '',
                      image_url: '',
                      stock_quantity: 0,
                      unit: 'pieces',
                      is_featured: false
                    });
                  }}
                >
                  ➕ Add Product
                </button>
                
              </div>
            </h2>
            
            <div className="product-form">
              <h3>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
              <div className="ai-product-section" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                color: 'white'
              }}>
                <h4>🤖 AI Product Suggestions</h4>
                <p>Type a product name and get AI-powered suggestions for details!</p>
                
                <div className="product-suggestion-container">
                  <div className="input-group" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      placeholder="Enter product name (e.g., 'Organic Apples', 'Wireless Headphones')"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <button 
                      onClick={generateProductSuggestions}
                      disabled={!productQuery.trim() || generating}
                      className="suggest-btn"
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {generating ? '🤖 Generating...' : '✨ Get Suggestions'}
                    </button>
                  </div>
                  
                  {generating && (
                    <div className="generating" style={{ textAlign: 'center', padding: '10px' }}>
                      🤖 AI is generating product suggestions...
                    </div>
                  )}
                  
                  {suggestions && (
                    <div className="suggestions-preview" style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '15px',
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <h5>✨ AI Suggestions Preview:</h5>
                      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Name:</strong> {suggestions.name}<br/>
                        <strong>Category:</strong> {suggestions.category}<br/>
                        <strong>Subcategory:</strong> {suggestions.subcategory}<br/>
                        <strong>Price:</strong> ₹{suggestions.price}<br/>
                        <strong>Description:</strong> {suggestions.description?.substring(0, 100)}...
                      </div>
                      <button 
                        onClick={applySuggestions}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          background: 'var(--success-color)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Apply Suggestions
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label>📝 Product Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    value={editingProduct?.name || newProduct.name}
                    onChange={handleProductChange}
                  />
                </div>
                <div>
                  <label>🏷️ Category</label>
                  <select
                    name="category_id"
                    value={editingProduct?.category_id || newProduct.category_id}
                    onChange={handleProductChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>📂 Subcategory</label>
                  <select
                    name="subcategory_id"
                    value={editingProduct?.subcategory_id || newProduct.subcategory_id}
                    onChange={handleProductChange}
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories
                      .filter(sub => {
                        const selectedCategoryId = editingProduct?.category_id || newProduct.category_id;
                        return selectedCategoryId && String(sub.category_id) === String(selectedCategoryId);
                      })
                      .map(subcategory => (
                        <option key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                          {subcategory.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label>💰 Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    value={editingProduct?.price || newProduct.price}
                    onChange={handleProductChange}
                  />
                </div>
                <div>
                  <label>🏷️ Discount Price (₹)</label>
                  <input
                    type="number"
                    name="discount_price"
                    placeholder="0.00"
                    value={editingProduct?.discount_price || newProduct.discount_price}
                    onChange={handleProductChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label>📊 Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    placeholder="0"
                    value={editingProduct?.stock_quantity || newProduct.stock_quantity}
                    onChange={handleProductChange}
                  />
                </div>
                <div>
                  <label>📏 Unit</label>
                  <select
                    name="unit"
                    value={editingProduct?.unit || newProduct.unit}
                    onChange={handleProductChange}
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="liters">Liters</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label>🖼️ Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    placeholder="https://example.com/image.jpg"
                    value={editingProduct?.image_url || newProduct.image_url}
                    onChange={handleProductChange}
                  />
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={editingProduct?.is_featured || newProduct.is_featured}
                      onChange={handleProductChange}
                    />
                    ⭐ Featured Product
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>📄 Product Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter detailed product description..."
                    value={editingProduct?.description || newProduct.description}
                    onChange={handleProductChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="save-btn"
                >
                  {editingProduct ? '💾 Update Product' : '➕ Add Product'}
                </button>
                {editingProduct && (
                  <button 
                    onClick={() => setEditingProduct(null)}
                    className="cancel-btn"
                  >
                    ❌ Cancel
                  </button>
                )}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Min Price</th>
                  <th>Max Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(products) && products.map(product => (
                  <tr key={product.product_id}>
                    <td>#{product.product_id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {product.image_url && (
                          <img 
                            src={productImages[product.product_id] || product.image_url || '/images/placeholder-product.jpg'}
                            alt={product.name}
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '8px', 
                              objectFit: 'cover' 
                            }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: '600' }}>{product.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {product.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>₹{formatPrice(product.price)}</div>
                        {product.discount_price > 0 && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--success-color)',
                            fontWeight: '500'
                          }}>
                            ₹{formatPrice(product.discount_price)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>₹{formatPrice(product.min_price)}</td>
                    <td>₹{formatPrice(product.max_price)}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: product.stock_quantity > 10 ? 'var(--success-color)' : 
                                   product.stock_quantity > 0 ? 'var(--warning-color)' : 'var(--error-color)',
                        color: 'white'
                      }}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: product.is_featured ? 'var(--primary-gradient)' : 'var(--border-color)',
                        color: product.is_featured ? 'white' : 'var(--text-secondary)'
                      }}>
                        {product.is_featured ? "⭐ Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="edit-btn"
                        onClick={() => setEditingProduct(product)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteProduct(product.product_id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           
          </div>
        )}

        {activeTab === "orders" && (
          <div className="orders-admin">
            <h2>📋 Manage Orders</h2>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                        #{order.order_id}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>👤 {order.user_name}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', fontSize: '16px' }}>
                        ₹{formatPrice(order.total_amount)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-${order.status}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px' }}>
                        📅 {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'out_for_delivery') {
                            try {
                              const personnelRes = await fetch(
                                `${apiUrl}/admin/delivery-personnel?available=true`,
                                { credentials: "include" }
                              );
                              if (!personnelRes.ok) {
                                throw new Error('Failed to fetch available personnel');
                              }
                              const availablePersonnel = await personnelRes.json();
                              if (availablePersonnel.length === 0) {
                                alert('No available delivery personnel');
                                return;
                              }
                              const personnelList = availablePersonnel
                                .map(p => `${p.personnel_id}: ${p.name}`)
                                .join('\n');
                              const selectedId = prompt(
                                `Available personnel:\n${personnelList}\nEnter personnel ID:`
                              );
                              if (selectedId) {
                                await handleUpdateOrderStatus(
                                  order.order_id, 
                                  newStatus, 
                                  selectedId
                                );
                              }
                            } catch (error) {
                              console.error("Error:", error);
                              setError(error.message);
                            }
                          } else {
                            await handleUpdateOrderStatus(order.order_id, newStatus);
                          }
                        }}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="processing">⚙️ Processing</option>
                        <option value="out_for_delivery">🚚 Out for Delivery</option>
                        <option value="delivered">📦✅ Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-admin">
            <h2>👥 Manage Users</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Admin</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                        #{user.user_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>
                        👤 {user.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📧 {user.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📱 {user.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={user.is_admin}
                          onChange={(e) => {
                            if (!user.is_admin) {
                              handleToggleAdmin(user.user_id, e.target.checked);
                            }
                          }}
                          disabled={user.is_admin}
                          title={user.is_admin ? "Cannot remove admin privileges" : "Make admin"}
                        />
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: user.is_admin ? 'var(--primary-gradient)' : 'var(--border-color)',
                          color: user.is_admin ? 'white' : 'var(--text-secondary)'
                        }}>
                          {user.is_admin ? '👑 Admin' : '👤 User'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px' }}>
                        📅 {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "personnel" && (
          <div className="personnel-admin">
            <h2>🚚 Manage Delivery Personnel</h2>
            
            <div className="personnel-form">
              <h3>➕ Add New Personnel</h3>
              <div className="form-row">
                <div>
                  <label>👤 Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newPersonnel.name}
                    onChange={(e) => setNewPersonnel({...newPersonnel, name: e.target.value})}
                  />
                </div>
                <div>
                  <label>📧 Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newPersonnel.email}
                    onChange={(e) => setNewPersonnel({...newPersonnel, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>📱 Phone</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    value={newPersonnel.phone}
                    onChange={(e) => setNewPersonnel({...newPersonnel, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label>🔒 Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={newPersonnel.password}
                    onChange={(e) => setNewPersonnel({...newPersonnel, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button onClick={handleAddPersonnel} className="save-btn">
                  ➕ Add Personnel
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {personnel.map(p => (
                  <tr key={p.personnel_id}>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                        #{p.personnel_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>
                        🚚 {p.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📧 {p.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📱 {p.phone}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: p.is_available ? 'var(--success-color)' : 'var(--error-color)',
                        color: 'white'
                      }}>
                        {p.is_available ? '✅ Available' : '❌ Busy'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeletePersonnel(p.personnel_id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="reviews-admin">
            <h2>⭐ Manage Reviews</h2>
            <table>
              <thead>
                <tr>
                  <th>Review ID</th>
                  <th>Product</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Sentiment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.review_id}>
                    <td>#{review.review_id}</td>
                    <td>{review.product_name}</td>
                    <td>{review.user_name}</td>
                    <td>
                      <span style={{color: 'gold'}}>
                        {'⭐'.repeat(review.rating)}
                      </span>
                    </td>
                    <td>{review.comment}</td>
                    <td>
                      <div>
                        <span className={`sentiment-${review.sentiment_label?.replace(' ', '-')}`}>
                          {review.sentiment_label}
                        </span>
                        <div style={{fontSize: '12px'}}>
                          Score: {review.sentiment_score}/10
                        </div>
                      </div>
                    </td>
                    <td>{new Date(review.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "recommendations" && (
          <div className="recommendations-admin">
            <h2>🎯 Product Recommendations</h2>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Based On</th>
                  <th>Source Item</th>
                  <th>Recommended Products</th>
                  <th>Confidence</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(recommendations) && recommendations.map((rec) => (
                  <tr key={rec.recommendation_id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>
                        👤 {rec.user_name}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: rec.recommendation_type === 'review' ? 'var(--primary-gradient)' : 'var(--success-color)',
                        color: 'white'
                      }}>
                        {rec.recommendation_type === 'review' ? '⭐ Review' : '🛒 Purchase'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>{rec.source_product_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {rec.recommendation_type === 'review' ? 
                            `${rec.source_rating}⭐ rating` : 
                            rec.source_order_id ? `Order #${rec.source_order_id}` : ''
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px' }}>
                        {rec.recommended_products?.split(',').map((product, idx) => (
                          <span key={idx} style={{
                            display: 'inline-block',
                            margin: '2px',
                            padding: '2px 6px',
                            background: 'var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}>
                            {product.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: rec.confidence_score > 0.7 ? 'var(--success-color)' : 
                                   rec.confidence_score > 0.5 ? 'var(--warning-color)' : 'var(--error-color)',
                        color: 'white'
                      }}>
                        {Math.round(rec.confidence_score * 100)}%
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px' }}>
                        📅 {new Date(rec.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
{activeTab === "dynamic_pricing" && (
  <div className="dynamic-pricing-admin">
    <h2>💰 Advanced Dynamic Pricing Engine</h2>

    <div
      className="pricing-info-section"
      style={{
  // background: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  marginBottom: '20px',
  color: '#333',
}}
    >
    <h3 style={{
  color: '#1a365d',
  fontSize: '1.5rem',
  fontWeight: '700',
  marginBottom: '1.5rem',
  paddingBottom: '0.75rem',
  borderBottom: '3px solid #3182ce',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
}}>
  🧠 Hybrid ML-Driven Pricing with Advanced Market Intelligence
</h3>

<ul style={{
  marginLeft: '0px',
  lineHeight: '1.8',
  listStyle: 'none',
  padding: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
}}>
  <li style={{
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #3182ce',
    borderRadius: '0 8px 8px 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#2d3748', fontSize: '1.05rem' }}>Model Selection:</strong> 
    <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
      Random Forest (100 trees) vs Gradient Boosting (100 trees) chosen via performance metrics (R² + MAE)
    </span>
  </li>

  <li style={{
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f0fff4',
    borderLeft: '4px solid #38a169',
    borderRadius: '0 8px 8px 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#2d3748', fontSize: '1.05rem' }}>Hybrid Pricing Logic:</strong> 
    <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
      ML prediction weight (confidence-based) + Conservative market-aware logic (confidence-based)
    </span>
  </li>

  <li style={{
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#fffaf0',
    borderLeft: '4px solid #ed8936',
    borderRadius: '0 8px 8px 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#2d3748', fontSize: '1.05rem' }}>Adjustment Limits:</strong> 
    <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
      Max increase: ±15% | Max decrease: ±20% | Confidence threshold: 0.3
    </span>
  </li>

  <li style={{
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f7fafc',
    borderLeft: '4px solid #805ad5',
    borderRadius: '0 8px 8px 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#2d3748', fontSize: '1.05rem' }}>Confidence Score:</strong> 
    <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
      Model performance (40%) + Prediction reasonableness (30%) + Data quality (20%) + Market confidence (10%)
    </span>
  </li>

  <li style={{
    marginBottom: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#1a202c', fontSize: '1.1rem', display: 'block', marginBottom: '0.75rem' }}>
      Core ML Features (25+):
    </strong>
    <ul style={{
      marginLeft: '0',
      listStyle: 'none',
      padding: '0'
    }}>
      <li style={{
        marginBottom: '0.75rem',
        padding: '0.75rem',
        backgroundColor: '#edf2f7',
        borderRadius: '6px',
        border: '1px solid #cbd5e0'
      }}>
        <strong style={{ color: '#2b6cb0' }}>Quality Metrics:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Rating + Sentiment Score • Review Count + Recent Reviews • Quality Score (Combined)
        </span>
      </li>
      <li style={{
        marginBottom: '0.75rem',
        padding: '0.75rem',
        backgroundColor: '#e6fffa',
        borderRadius: '6px',
        border: '1px solid #81e6d9'
      }}>
        <strong style={{ color: '#00a3c4' }}>Market Position:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Price Z-score vs Category • Sales vs Category Performance • Market Segment (Budget/Mid/Premium)
        </span>
      </li>
      <li style={{
        marginBottom: '0.75rem',
        padding: '0.75rem',
        backgroundColor: '#fef5e7',
        borderRadius: '6px',
        border: '1px solid #fbd38d'
      }}>
        <strong style={{ color: '#c05621' }}>Competitive Intelligence:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Price Deviation from Category • Competitive Pressure Score • Category Quartile Position
        </span>
      </li>
      <li style={{
        marginBottom: '0.5rem',
        padding: '0.75rem',
        backgroundColor: '#f0f4ff',
        borderRadius: '6px',
        border: '1px solid #a3bffa'
      }}>
        <strong style={{ color: '#3c366b' }}>Demand Signals:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Sales Trend (7d vs 30d) • Inventory Turnover Rate • Product Maturity Score
        </span>
      </li>
    </ul>
  </li>

  <li style={{
    marginBottom: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#1a202c', fontSize: '1.1rem', display: 'block', marginBottom: '0.75rem' }}>
      Conservative Market-Aware Rules:
    </strong>
    <ul style={{
      marginLeft: '0',
      listStyle: 'none',
      padding: '0'
    }}>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#f0fff4',
        borderRadius: '6px',
        borderLeft: '3px solid #48bb78'
      }}>
        <strong style={{ color: '#22543d' }}>Quality Adjustment:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          High quality (&gt;0.7): +5% max | Low quality (&lt;0.5): -8% max
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#f7fafc',
        borderRadius: '6px',
        borderLeft: '3px solid #4299e1'
      }}>
        <strong style={{ color: '#2a4365' }}>Market Position:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Below optimal range: +10% max | Above optimal: -12% max
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#fffaf0',
        borderRadius: '6px',
        borderLeft: '3px solid #ed8936'
      }}>
        <strong style={{ color: '#744210' }}>Demand Performance:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          High performers (&gt;0.5): +6% max | Poor performers (&lt;-0.3): -10% max
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#f0f4ff',
        borderRadius: '6px',
        borderLeft: '3px solid #805ad5'
      }}>
        <strong style={{ color: '#44337a' }}>Inventory Health:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          High turnover (&gt;1.5): +4% max | Low turnover (&lt;0.3): -8% max
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#fed7e2',
        borderRadius: '6px',
        borderLeft: '3px solid #f56565'
      }}>
        <strong style={{ color: '#742a2a' }}>Competitive Pressure:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          High competition (&gt;0.3): -6% max pressure response
        </span>
      </li>
      <li style={{
        marginBottom: '0.5rem',
        padding: '0.6rem',
        backgroundColor: '#e6fffa',
        borderRadius: '6px',
        borderLeft: '3px solid #38b2ac'
      }}>
        <strong style={{ color: '#234e52' }}>Sales Trends:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Strong trend (&gt;1.3): +3% max | Weak trend (&lt;0.7): -5% max
        </span>
      </li>
    </ul>
  </li>

  <li style={{
    marginBottom: '1rem',
    padding: '1.25rem',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    border: '1px solid #a78bfa',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(167, 139, 250, 0.2)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#553c9a', fontSize: '1.05rem' }}>Market Equilibrium Calculation:</strong> 
    <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
      Segment-based optimal price ranges from top-performing products (70th percentile) • Dynamic elasticity calculation per market segment (-2.0 to -0.2 range) • Confidence dampening based on market uncertainty
    </span>
  </li>

  <li style={{
    marginBottom: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#1a202c', fontSize: '1.1rem', display: 'block', marginBottom: '0.75rem' }}>
      Advanced Features:
    </strong>
    <ul style={{
      marginLeft: '0',
      listStyle: 'none',
      padding: '0'
    }}>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#f7fafc',
        borderRadius: '6px',
        borderLeft: '3px solid #718096'
      }}>
        <strong style={{ color: '#2d3748' }}>Robust Scaling:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          RobustScaler for outlier handling
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#e6fffa',
        borderRadius: '6px',
        borderLeft: '3px solid #38b2ac'
      }}>
        <strong style={{ color: '#234e52' }}>Model Confidence:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Weighted combination based on individual model performance
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#fffaf0',
        borderRadius: '6px',
        borderLeft: '3px solid #ed8936'
      }}>
        <strong style={{ color: '#744210' }}>Market Segment Elasticity:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Highly elastic (&gt;1.5): 0.7x dampening | Inelastic (&lt;0.5): 1.2x amplification
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#f0f4ff',
        borderRadius: '6px',
        borderLeft: '3px solid #805ad5'
      }}>
        <strong style={{ color: '#44337a' }}>Data Quality Weighting:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Products with sales history get higher confidence
        </span>
      </li>
      <li style={{
        marginBottom: '0.5rem',
        padding: '0.6rem',
        backgroundColor: '#f0fff4',
        borderRadius: '6px',
        borderLeft: '3px solid #48bb78'
      }}>
        <strong style={{ color: '#22543d' }}>Fallback Logic:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Conservative approach when ML fails or low confidence
        </span>
      </li>
    </ul>
  </li>

  <li style={{
    marginBottom: '1rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    border: '2px solid #f56565',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(245, 101, 101, 0.15)',
    transition: 'all 0.3s ease'
  }}>
    <strong style={{ color: '#c53030', fontSize: '1.1rem', display: 'block', marginBottom: '0.75rem' }}>
      🛡️ Safety Mechanisms:
    </strong>
    <ul style={{
      marginLeft: '0',
      listStyle: 'none',
      padding: '0'
    }}>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#fed7e2',
        borderRadius: '6px',
        borderLeft: '3px solid #f56565'
      }}>
        <strong style={{ color: '#742a2a' }}>Extreme Value Capping:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Sales trends (0.1-3.0), Z-scores (±3), Performance ratios (±2)
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#fed7e2',
        borderRadius: '6px',
        borderLeft: '3px solid #f56565'
      }}>
        <strong style={{ color: '#742a2a' }}>Minimum Change Threshold:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Adjustments &lt;₹0.01 are ignored
        </span>
      </li>
      <li style={{
        marginBottom: '0.6rem',
        padding: '0.6rem',
        backgroundColor: '#fed7e2',
        borderRadius: '6px',
        borderLeft: '3px solid #f56565'
      }}>
        <strong style={{ color: '#742a2a' }}>Low Confidence Override:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          &lt;0.3 confidence forces price maintenance
        </span>
      </li>
      <li style={{
        marginBottom: '0.5rem',
        padding: '0.6rem',
        backgroundColor: '#fed7e2',
        borderRadius: '6px',
        borderLeft: '3px solid #f56565'
      }}>
        <strong style={{ color: '#742a2a' }}>Price Bounds:</strong> 
        <span style={{ color: '#4a5568', marginLeft: '0.5rem' }}>
          Strict adherence to min_price and max_price constraints
        </span>
      </li>
    </ul>
  </li>
</ul>


    </div>

    <div className="pricing-controls" style={{ marginBottom: '20px' }}>
      {!showPreview ? (
        <button
          onClick={handlePreviewPricing}
          disabled={pricingLoading}
          style={{
            padding: '15px 30px',
            background: pricingLoading ? '#ccc' : 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: pricingLoading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          {pricingLoading ? '🔄 Analyzing Products...' : '🧠 Generate ML Price Preview'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={handleApplyPricing}
            disabled={pricingLoading}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: pricingLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            ✅ Apply Dynamic Prices
          </button>
          <button
            onClick={() => {
              setShowPreview(false);
              setPreviewPrices([]);
            }}
            disabled={pricingLoading}
            style={{
              padding: '15px 30px',
              background: '#ff4b5c',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            ❌ Cancel
          </button>
        </div>
      )}
    </div>

    {showPreview && previewPrices.length > 0 && (
      <div
        className="pricing-preview"
        style={{
  
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  color: '#333',
}}

      >
        <h3>📊 ML Pricing Preview</h3>
        <div style={{ marginBottom: '15px', display: 'flex', gap: '20px' }}>
          <div><strong>Products:</strong> {previewPrices.length}</div>
          <div><strong>Increased:</strong> {previewPrices.filter(p => p.new_price > p.current_price).length}</div>
          <div><strong>Decreased:</strong> {previewPrices.filter(p => p.new_price < p.current_price).length}</div>
          <div><strong>No Change:</strong> {previewPrices.filter(p => p.new_price === p.current_price).length}</div>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <thead>
  <tr>
    <th>🛍 Product</th>
    <th>Old ₹</th>
    <th>New ₹</th>
    <th>Δ ₹</th>
    <th>% Change</th>
    <th>Conf.</th>
    <th>Segment</th>
    <th>Revenue Δ</th>
    <th>🧠 Algorithm</th> {/* ✅ New Column */}
  </tr>
</thead>
<tbody>
  {previewPrices.map(price => (
    <tr key={price.product_id}>
      <td>{price.product_name || `ID ${price.product_id}`}</td>
      <td>₹{price.current_price?.toFixed(2) ?? 'N/A'}</td>
      <td>₹{price.new_price?.toFixed(2) ?? 'N/A'}</td>
      <td style={{ color: price.new_price > price.current_price ? '#4CAF50' : price.new_price < price.current_price ? '#f44336' : 'white' }}>
        {price.new_price && price.current_price
          ? `${price.new_price > price.current_price ? '+' : ''}₹${(price.new_price - price.current_price).toFixed(2)}`
          : 'N/A'}
      </td>
      <td>
        {price.new_price && price.current_price && price.current_price !== 0
          ? `${(((price.new_price - price.current_price) / price.current_price) * 100).toFixed(2)}%`
          : 'N/A'}
      </td>
      <td>{price.confidence_score !== undefined ? `${(price.confidence_score * 100).toFixed(1)}%` : 'N/A'}</td>
      <td>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '12px',
            background:
              price.market_segment === 'premium'
                ? '#ff9800'
                : price.market_segment === 'budget'
                ? '#2196F3'
                : '#9c27b0',
            color: 'white',
            fontSize: '12px',
          }}
        >
          {price.market_segment || 'Unknown'}
        </span>
      </td>
      <td>
        ₹{price.expected_revenue_change !== undefined ? price.expected_revenue_change.toFixed(2) : 'N/A'}
      </td>
      <td>
        <span className={`algorithm-badge ${price.algorithm?.toLowerCase() === 'randomforest' ? 'rf' : 'gbdt'}`}>
  {price.algorithm || 'N/A'}
</span>
      </td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      </div>
    )}
  </div>
)}

        {activeTab === "insights" && <AdminInsights />}
      </div>
    </div>
  );
};

export default AdminPanel;