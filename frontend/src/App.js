import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductDetails from "./pages/ProductDetails";
// import AddressForm from "./components/AddressForm";
// import ProductCard from "./components/ProductCard";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import ComparisonPage from "./pages/ComparisonPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import NotFound from "./pages/Notfound";
import DeliveryTracking from "./pages/DeliveryTracking";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import "./css/App.css";


export const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          credentials: "include",
        });
        const data = await response.json();

        if (data.message === "Logged in") {
          setIsLoggedIn(true);
          fetchProfile();
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiUrl}/profile`, {
          credentials: "include",
        });
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      });
      setIsLoggedIn(false);
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ThemeProvider>
    <div className="app">
      <Navbar isLoggedIn={isLoggedIn} user={user} handleLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/tracking/:orderId" element={<DeliveryTracking />} />
          <Route path="/admin" element={<AdminPanel />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/products/:productId" element={<ProductDetails />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/products" element={<Products />} />
  
          {/* Add this line for comparison */}
          <Route path="/compare" element={<ComparisonPage />} />
  
          <Route path="/cart" element={<Cart />} />
          {/* ... other routes ... */}
        </Routes>
      </main>
      <Footer />
    </div>
    </ThemeProvider>
  );
}

export default App;