import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/config';

const CompareContext = createContext();

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export const CompareProvider = ({ children }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [pendingProduct, setPendingProduct] = useState(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('compareProducts');
    const storedCategories = localStorage.getItem('compareCategories');
    const storedSubcategories = localStorage.getItem('compareSubcategories');
    if (stored) {
      setSelectedProducts(JSON.parse(stored));
    }
    if (storedCategories) {
      setSelectedCategories(JSON.parse(storedCategories));
    }
    if (storedSubcategories) {
      setSelectedSubcategories(JSON.parse(storedSubcategories));
    }
  }, []);

  const addToCompare = async (productId, categoryId = null, subcategoryId = null, productName = null, subcategoryName = null) => {
    if (selectedProducts.length >= 2) {
      alert('You can compare maximum 2 products at a time');
      return false;
    }
    
    if (selectedProducts.includes(productId)) {
      return false;
    }

    // If this is the first product, add it
    if (selectedProducts.length === 0) {
      const updated = [...selectedProducts, productId];
      const updatedCategories = categoryId ? [categoryId] : [];
      const updatedSubcategories = subcategoryId ? [subcategoryId] : [];
      setSelectedProducts(updated);
      setSelectedCategories(updatedCategories);
      setSelectedSubcategories(updatedSubcategories);
      localStorage.setItem('compareProducts', JSON.stringify(updated));
      localStorage.setItem('compareCategories', JSON.stringify(updatedCategories));
      localStorage.setItem('compareSubcategories', JSON.stringify(updatedSubcategories));
      return true;
    }

    // If this is the second product, check category compatibility
    if (selectedCategories.length > 0 && categoryId && selectedCategories[0] !== categoryId) {
      alert('You can only compare products from the same category. Please select products from the same category.');
      return false;
    }

    // Check subcategory compatibility
    if (selectedSubcategories.length > 0 && subcategoryId && selectedSubcategories[0] !== subcategoryId) {
      // Get the current subcategory name
      const currentSubcategoryName = await getSubcategoryName(selectedSubcategories[0]);
      
      // Store pending product for confirmation
      setPendingProduct({
        productId,
        categoryId,
        subcategoryId,
        productName,
        subcategoryName,
        currentSubcategoryName
      });
      return 'confirm'; // Return special value to indicate confirmation needed
    }

    // Add the product (same subcategory)
    const updated = [...selectedProducts, productId];
    const updatedCategories = categoryId ? [...selectedCategories, categoryId] : selectedCategories;
    const updatedSubcategories = subcategoryId ? [...selectedSubcategories, subcategoryId] : selectedSubcategories;
    setSelectedProducts(updated);
    setSelectedCategories(updatedCategories);
    setSelectedSubcategories(updatedSubcategories);
    localStorage.setItem('compareProducts', JSON.stringify(updated));
    localStorage.setItem('compareCategories', JSON.stringify(updatedCategories));
    localStorage.setItem('compareSubcategories', JSON.stringify(updatedSubcategories));
    return true;
  };

  const confirmAddToCompare = () => {
    if (!pendingProduct) return false;
    
    const { productId, categoryId, subcategoryId } = pendingProduct;
    const updated = [...selectedProducts, productId];
    const updatedCategories = categoryId ? [...selectedCategories, categoryId] : selectedCategories;
    const updatedSubcategories = subcategoryId ? [...selectedSubcategories, subcategoryId] : selectedSubcategories;
    
    setSelectedProducts(updated);
    setSelectedCategories(updatedCategories);
    setSelectedSubcategories(updatedSubcategories);
    localStorage.setItem('compareProducts', JSON.stringify(updated));
    localStorage.setItem('compareCategories', JSON.stringify(updatedCategories));
    localStorage.setItem('compareSubcategories', JSON.stringify(updatedSubcategories));
    
    setPendingProduct(null);
    return true;
  };

  const cancelAddToCompare = () => {
    setPendingProduct(null);
  };

  const removeFromCompare = (productId) => {
    const updated = selectedProducts.filter(id => id !== productId);
    setSelectedProducts(updated);
    localStorage.setItem('compareProducts', JSON.stringify(updated));
    
    // Clear categories and subcategories if no products selected
    if (updated.length === 0) {
      setSelectedCategories([]);
      setSelectedSubcategories([]);
      localStorage.removeItem('compareCategories');
      localStorage.removeItem('compareSubcategories');
    }
  };

  const clearCompare = () => {
    setSelectedProducts([]);
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setPendingProduct(null);
    localStorage.removeItem('compareProducts');
    localStorage.removeItem('compareCategories');
    localStorage.removeItem('compareSubcategories');
  };

  const isSelected = (productId) => {
    return selectedProducts.includes(productId);
  };

  // Helper function to get subcategory name from API
  const getSubcategoryName = async (subcategoryId) => {
    try {
      const response = await axios.get(`${apiUrl}/subcategories/name/${subcategoryId}`);
      return response.data.name;
    } catch (error) {
      console.error('Error fetching subcategory name:', error);
      // If subcategories are not available, return a generic name
      if (error.response?.status === 404) {
        return 'General';
      }
      return 'Unknown Subcategory';
    }
  };

  const value = {
    selectedProducts,
    selectedCategories,
    selectedSubcategories,
    pendingProduct,
    addToCompare,
    confirmAddToCompare,
    cancelAddToCompare,
    removeFromCompare,
    clearCompare,
    isSelected
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}; 