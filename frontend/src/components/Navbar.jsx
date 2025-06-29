import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useCompare } from "../contexts/CompareContext";
import "../css/Navbar.css";

const Navbar = ({ isLoggedIn, user, handleLogout }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { selectedProducts, clearCompare } = useCompare();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const goToComparison = () => {
    navigate(`/compare?ids=${selectedProducts.join(',')}`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleDropdownItemClick = () => {
    setIsDropdownOpen(false);
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : 'light'}`}>
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">🛒</span>
            Quick Commerce
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="navbar-links desktop-only">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link">
                <span className="nav-icon">🏠</span>
                Home
              </Link>
              <Link to="/products" className="nav-link">
                <span className="nav-icon">📦</span>
                Products
              </Link>
              <Link to="/cart" className="nav-link cart-link">
                <span className="nav-icon">🛒</span>
                Cart
              </Link>
              {selectedProducts.length > 0 && (
                <button
                  onClick={goToComparison}
                  className="compare-nav-button"
                >
                  <span className="compare-icon">⚖️</span>
                  Compare ({selectedProducts.length}/2)
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/products" className="nav-link">
                <span className="nav-icon">📦</span>
                Products
              </Link>
            </>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          <button onClick={toggleDarkMode} className="theme-toggle" title="Toggle theme">
            <span className="theme-icon">{darkMode ? '☀️' : '🌙'}</span>
          </button>

          {isLoggedIn ? (
            <div className="user-menu" ref={dropdownRef}>
              <button 
                className="user-button"
                onClick={toggleDropdown}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-name">{user?.name || "Account"}</span>
                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={handleDropdownItemClick}
                  >
                    <span className="dropdown-icon">👤</span>
                    Profile
                  </Link>
                  <Link 
                    to="/orders" 
                    className="dropdown-item"
                    onClick={handleDropdownItemClick}
                  >
                    <span className="dropdown-icon">📋</span>
                    My Orders
                  </Link>
                  {user?.isAdmin && (
                    <Link 
                      to="/admin" 
                      className="dropdown-item admin-link"
                      onClick={handleDropdownItemClick}
                    >
                      <span className="dropdown-icon">⚙️</span>
                      Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout"
                    onClick={() => {
                      handleLogout();
                      handleDropdownItemClick();
                    }}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links desktop-only">
              <Link to="/login" className="nav-link login-link">
                Login
              </Link>
              <Link to="/signup" className="nav-link signup-link">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">🏠</span>
                Home
              </Link>
              <Link to="/products" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">📦</span>
                Products
              </Link>
              <Link to="/cart" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">🛒</span>
                Cart
              </Link>
              {selectedProducts.length > 0 && (
                <button
                  onClick={() => {
                    goToComparison();
                    toggleMobileMenu();
                  }}
                  className="mobile-compare-button"
                >
                  <span className="mobile-icon">⚖️</span>
                  Compare ({selectedProducts.length}/2)
                </button>
              )}
              <Link to="/profile" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">👤</span>
                Profile
              </Link>
              <Link to="/orders" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">📋</span>
                My Orders
              </Link>
              {user?.isAdmin && (
                <Link to="/admin" className="mobile-link admin-link" onClick={toggleMobileMenu}>
                  <span className="mobile-icon">⚙️</span>
                  Admin Panel
                </Link>
              )}
              <button
                className="mobile-link logout"
                onClick={() => {
                  handleLogout();
                  toggleMobileMenu();
                }}
              >
                <span className="mobile-icon">🚪</span>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/products" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">📦</span>
                Products
              </Link>
              <Link to="/login" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">🔑</span>
                Login
              </Link>
              <Link to="/signup" className="mobile-link" onClick={toggleMobileMenu}>
                <span className="mobile-icon">📝</span>
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;