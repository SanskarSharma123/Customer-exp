import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import ProductCard from "../components/ProductCard";
import "../css/Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for accurate counting
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const processImageUrl = (url) => {
    if (!url) return "/images/placeholder-product.jpg";
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/')) return `${apiUrl}${url}`;
    if (!url.startsWith('/')) return `/${url}`;
    return url;
  };

  const processProducts = (productsData) => {
    const processed = productsData.map(product => ({
      ...product,
      image_url: processImageUrl(product.image_url),
      average_rating: product.average_rating || 0,
      review_count: product.review_count || 0
    }));
    setProducts(processed);
  };

  const fetchProducts = async (categoryId, searchParam) => {
    let url = `${apiUrl}/products`; // Default to all products
    
    if (categoryId) {
      url = `${apiUrl}/products/category/${categoryId}`;
    } else if (searchParam) {
      url = `${apiUrl}/products/search?q=${encodeURIComponent(searchParam)}`;
    }
    // Remove the featured endpoint as it might be limiting results
    
    return fetch(url);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const categoryId = queryParams.get("category");
        const searchParam = queryParams.get("search");
        
        if (searchParam) setSearchTerm(searchParam);
        if (categoryId) setSelectedCategory(parseInt(categoryId));

        // Fetch categories and all products in parallel
        const [categoriesRes, productsRes, allProductsRes] = await Promise.all([
          fetch(`${apiUrl}/categories`),
          fetchProducts(categoryId, searchParam),
          fetch(`${apiUrl}/products`) // Fetch ALL products for accurate counting
        ]);

        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();
        const allProductsData = await allProductsRes.json();

        // Process all products data for counting
        const processedAllProducts = allProductsData.map(product => ({
          ...product,
          image_url: processImageUrl(product.image_url),
          average_rating: product.average_rating || 0,
          review_count: product.review_count || 0
        }));
        setAllProducts(processedAllProducts);

        // Update categories with accurate product counts
        const categoriesWithCounts = categoriesData.map(category => ({
          ...category,
          product_count: processedAllProducts.filter(product => 
            product.category_id === category.category_id
          ).length
        }));
        setCategories(categoriesWithCounts);

        processProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
    } else {
      // If search is empty, show all products
      navigate("/products");
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchTerm(""); // Clear search when changing category
    if (categoryId) {
      navigate(`/products?category=${categoryId}`);
    } else {
      navigate("/products");
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get total product count for "All Products"
  const getTotalProductCount = () => {
    if (!selectedCategory && !searchTerm) {
      return allProducts.length;
    }
    return products.length;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Mobile Filter Toggle */}
      <button className="mobile-filter-toggle" onClick={toggleFilters}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="21" x2="4" y2="14"></line>
          <line x1="4" y1="10" x2="4" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="3"></line>
          <line x1="20" y1="21" x2="20" y2="16"></line>
          <line x1="20" y1="12" x2="20" y2="3"></line>
          <line x1="1" y1="14" x2="7" y2="14"></line>
          <line x1="9" y1="8" x2="15" y2="8"></line>
          <line x1="17" y1="16" x2="23" y2="16"></line>
        </svg>
        Filters
      </button>

      {/* Sidebar */}
      <div className={`products-sidebar ${showFilters ? 'show-mobile' : ''}`}>
        <div className="sidebar-header">
          <h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="7" y1="8" x2="17" y2="8"></line>
              <line x1="7" y1="12" x2="17" y2="12"></line>
              <line x1="7" y1="16" x2="17" y2="16"></line>
            </svg>
            Categories
          </h3>
          <button className="mobile-close" onClick={toggleFilters}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="categories-container">
          <ul className="categories-list">
            <li
              className={!selectedCategory ? "active" : ""}
              onClick={() => handleCategoryChange(null)}
            >
              <span className="category-icon">🏠</span>
              <span className="category-name">All Products</span>
              <span className="category-count">{allProducts.length}</span>
            </li>
            {categories.map((category) => (
              <li
                key={category.category_id}
                className={selectedCategory === category.category_id ? "active" : ""}
                onClick={() => handleCategoryChange(category.category_id)}
              >
                <span className="category-icon">📦</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.product_count || 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="promo-banner">
            <div className="promo-icon">🎉</div>
            <div className="promo-text">
              <h4>Special Offer!</h4>
              <p>Get 20% off on your first order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="products-main">
        {/* Search Section */}
        <div className="products-search">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search for products, brands, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => {
                    setSearchTerm("");
                    navigate("/products");
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" className="search-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Search
            </button>
          </form>
        </div>

        {/* Products Header */}
        <div className="products-header">
          <div className="header-left">
            <h2>
              {selectedCategory
                ? categories.find((c) => c.category_id === selectedCategory)?.name
                : "All Products"}
            </h2>
            <p className="results-count">
              <span className="count-number">{getTotalProductCount()}</span> 
              {getTotalProductCount() === 1 ? ' product' : ' products'} found
              {searchTerm && (
                <span className="search-term"> for "{searchTerm}"</span>
              )}
            </p>
          </div>
          <div className="header-right">
            <div className="view-controls">
              <button className="sort-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18"></path>
                  <path d="M7 12h10"></path>
                  <path d="M10 18h4"></path>
                </svg>
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {products.length > 0 ? (
            products.map((product, index) => {
              console.log('DEBUG ProductCard product:', product);
              return (
                <div key={product.product_id} className="product-card-wrapper" style={{animationDelay: `${index * 0.1}s`}}>
                  <ProductCard product={product} />
                </div>
              );
            })
          ) : (
            <div className="no-products">
              <div className="no-products-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 9 6 6"></path>
                  <path d="m15 9-6 6"></path>
                </svg>
              </div>
              <h3>No products found</h3>
              <p>
                {searchTerm 
                  ? `We couldn't find any products matching "${searchTerm}". Try different keywords or browse our categories.`
                  : "No products available in this category at the moment."
                }
              </p>
              <div className="no-products-actions">
                {searchTerm && (
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      navigate("/products");
                    }}
                    className="clear-search-btn"
                  >
                    Clear Search
                  </button>
                )}
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    navigate("/products");
                  }}
                  className="browse-all-btn"
                >
                  Browse All Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {showFilters && <div className="mobile-overlay" onClick={toggleFilters}></div>}
    </div>
  );
};

export default Products;