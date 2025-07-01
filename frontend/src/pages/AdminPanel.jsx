import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/AdminPanel.css";
import productImages from "../components/ProductImages";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [reviews, setReviews] = useState([]);
  
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
    image_url: '',
    stock_quantity: 0,
    unit: 'pieces',
    is_featured: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileResponse = await fetch(`${apiUrl}/profile`, {
          credentials: "include",
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

        const [productsRes, ordersRes, usersRes, categoriesRes, personnelRes, reviewsRes] = await Promise.all([
  fetch(`${apiUrl}/admin/products`, { credentials: "include" }),
  fetch(`${apiUrl}/admin/orders`, { credentials: "include" }),
  fetch(`${apiUrl}/admin/users`, { credentials: "include" }),
  fetch(`${apiUrl}/categories`),
  fetch(`${apiUrl}/admin/delivery-personnel`, { credentials: "include" }),
  fetch(`${apiUrl}/admin/reviews`, { credentials: "include" })
]);

        const [productsData, ordersData, usersData, categoriesData, personnelData, reviewsData] = await Promise.all([
          productsRes.json(),
          ordersRes.json(),
          usersRes.json(),
          categoriesRes.json(),
          personnelRes.json(),
          reviewsRes.json()
        ]);

        setProducts(productsData);
        setOrders(ordersData);
        setUsers(usersData);
        setCategories(categoriesData);
        setPersonnel(personnelData);
        setReviews(reviewsData);
        setLoading(false);

      } catch (error) {
        console.error('Admin panel error:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Product Handlers
  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (editingProduct) {
      setEditingProduct(prev => ({ ...prev, [name]: val }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: val }));
    }
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
  
      // Update local state
      const updatedUsers = users.map(user => 
        user.user_id === userId ? { ...user, is_admin: isAdmin } : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error updating admin status:", error);
      setError(error.message);
    }
  };

  // Personnel Handlers
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
          
          // Handle specific error cases
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

  // Order Handlers
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

      // Refresh orders and personnel lists
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
    reviews: '⭐'
  };
  return icons[tab] || '';
};

  const getTabCount = (tab) => {
  const counts = {
    products: Array.isArray(products) ? products.length : 0,
    orders: Array.isArray(orders) ? orders.length : 0,
    users: Array.isArray(users) ? users.length : 0,
    personnel: Array.isArray(personnel) ? personnel.length : 0,
    reviews: Array.isArray(reviews) ? reviews.length : 0
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
         {["products", "orders", "users", "personnel", "reviews"].map(tab => (
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
        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="products-admin">
            <h2>
              📦 Manage Products
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
                    image_url: '',
                    stock_quantity: 0,
                    unit: 'pieces',
                    is_featured: false
                  });
                }}
              >
                ➕ Add Product
              </button>
            </h2>
            
            <div className="product-form">
              <h3>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
              
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

        {/* Orders Tab */}
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

        {/* Users Tab */}
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

        {/* Personnel Tab */}
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
        {/* Reviews Tab */}
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
      </div>
    </div>
  );
};

export default AdminPanel;