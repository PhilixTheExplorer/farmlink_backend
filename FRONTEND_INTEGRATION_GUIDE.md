# Farm Link API - Frontend Integration Guide

## Quick Start for Frontend Developers

### Base Configuration

```javascript
// api.js - API Configuration
const API_CONFIG = {
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
};

// Headers helper
const getHeaders = (token = null) => ({
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` }),
});

// Base API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(localStorage.getItem("authToken")),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API call failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
```

### Authentication Service

```javascript
// auth.js - Authentication Service
class AuthService {
  static async register(userData) {
    const response = await apiCall("/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.success) {
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  }

  static async login(email, password) {
    const response = await apiCall("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success) {
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("profile", JSON.stringify(response.data.profile));
    }

    return response;
  }

  static logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
  }

  static getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  static getToken() {
    return localStorage.getItem("authToken");
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static isFarmer() {
    const user = this.getCurrentUser();
    return user?.role === "farmer";
  }

  static isBuyer() {
    const user = this.getCurrentUser();
    return user?.role === "buyer";
  }
}
```

### Product Service

```javascript
// products.js - Product Management Service
class ProductService {
  // Get all products with filtering
  static async getProducts(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, value);
      }
    });

    return apiCall(`/products?${params.toString()}`);
  }

  // Get product by ID
  static async getProduct(productId) {
    return apiCall(`/products/${productId}`);
  }

  // Get products by category
  static async getProductsByCategory(category, filters = {}) {
    const params = new URLSearchParams(filters);
    return apiCall(`/products/category/${category}?${params.toString()}`);
  }

  // Get popular products
  static async getPopularProducts(limit = 10) {
    return apiCall(`/products/featured/popular?limit=${limit}`);
  }

  // Get product categories
  static async getCategories() {
    return apiCall("/products/meta/categories");
  }

  // Get product units
  static async getUnits() {
    return apiCall("/products/meta/units");
  }

  // Farmer-only: Create product
  static async createProduct(productData) {
    return apiCall("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  // Farmer-only: Update product
  static async updateProduct(productId, productData) {
    return apiCall(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  // Farmer-only: Update product status
  static async updateProductStatus(productId, status) {
    return apiCall(`/products/${productId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Farmer-only: Update product quantity
  static async updateProductQuantity(productId, quantity) {
    return apiCall(`/products/${productId}/quantity`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  // Farmer-only: Delete product
  static async deleteProduct(productId) {
    return apiCall(`/products/${productId}`, {
      method: "DELETE",
    });
  }
}
```

### Cart Service

```javascript
// cart.js - Cart Management Service
class CartService {
  // Get cart items
  static async getCart() {
    return apiCall("/cart");
  }

  // Get cart summary
  static async getCartSummary() {
    return apiCall("/cart/summary");
  }

  // Add item to cart
  static async addToCart(productId, quantity) {
    return apiCall("/cart/items", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  // Update cart item quantity
  static async updateCartItem(itemId, quantity) {
    return apiCall(`/cart/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  }

  // Remove item from cart
  static async removeFromCart(itemId) {
    return apiCall(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
  }

  // Clear entire cart
  static async clearCart() {
    return apiCall("/cart/clear", {
      method: "DELETE",
    });
  }
}
```

### Order Service

```javascript
// orders.js - Order Management Service
class OrderService {
  // Get orders
  static async getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiCall(`/orders?${params.toString()}`);
  }

  // Get order by ID
  static async getOrder(orderId) {
    return apiCall(`/orders/${orderId}`);
  }

  // Checkout (create order from cart)
  static async checkout(orderData) {
    return apiCall("/orders/checkout", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    return apiCall(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Get order statistics
  static async getOrderStats() {
    return apiCall("/orders/stats/summary");
  }
}
```

### Farmer Service

```javascript
// farmers.js - Farmer Management Service
class FarmerService {
  // Get all farmers
  static async getFarmers(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiCall(`/farmers?${params.toString()}`);
  }

  // Get farmer by user ID
  static async getFarmerByUserId(userId) {
    return apiCall(`/farmers/user/${userId}`);
  }

  // Update farmer profile
  static async updateProfile(userId, profileData) {
    return apiCall(`/farmers/${userId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // Get farmer statistics
  static async getFarmerStats(userId) {
    return apiCall(`/farmers/${userId}/stats`);
  }
}
```

## React Hooks Examples

### Authentication Hook

```javascript
// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const savedUser = AuthService.getCurrentUser();
      if (savedUser && AuthService.isAuthenticated()) {
        setUser(savedUser);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await AuthService.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await AuthService.register(userData);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isFarmer: user?.role === "farmer",
    isBuyer: user?.role === "buyer",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Products Hook

```javascript
// hooks/useProducts.js
import { useState, useEffect } from "react";

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await ProductService.getProducts(filters);
        setProducts(response.data);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [JSON.stringify(filters)]);

  return {
    products,
    pagination,
    isLoading,
    error,
    refetch: () => fetchProducts(),
  };
};

export const useProduct = (productId) => {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await ProductService.getProduct(productId);
        setProduct(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return { product, isLoading, error };
};
```

### Cart Hook

```javascript
// hooks/useCart.js
import { useState, useEffect } from "react";

export const useCart = () => {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const response = await CartService.getCart();
      setCart(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId, quantity) => {
    try {
      await CartService.addToCart(productId, quantity);
      await fetchCart(); // Refresh cart
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await CartService.updateCartItem(itemId, quantity);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const removeItem = async (itemId) => {
    try {
      await CartService.removeFromCart(itemId);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearCart = async () => {
    try {
      await CartService.clearCart();
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refetch: fetchCart,
  };
};
```

## React Component Examples

### Product List Component

```jsx
// components/ProductList.jsx
import React, { useState } from "react";
import { useProducts } from "../hooks/useProducts";

const ProductList = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: "",
    search: "",
    status: "available",
  });

  const { products, pagination, isLoading, error } = useProducts(filters);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const loadMore = () => {
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  if (isLoading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="product-list">
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
        />
        <select
          value={filters.category}
          onChange={(e) => updateFilters({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="vegetables">Vegetables</option>
          <option value="fruits">Fruits</option>
          <option value="herbs">Herbs</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.page < pagination.totalPages && (
        <button onClick={loadMore} className="load-more">
          Load More Products
        </button>
      )}
    </div>
  );
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isBuyer } = useAuth();

  const handleAddToCart = async () => {
    const result = await addToCart(product.id, 1);
    if (result.success) {
      alert("Added to cart!");
    } else {
      alert("Failed to add to cart: " + result.error);
    }
  };

  return (
    <div className="product-card">
      <img src={product.image_url} alt={product.title} />
      <h3>{product.title}</h3>
      <p>{product.description}</p>
      <div className="price">
        ₱{product.price} per {product.unit}
      </div>
      <div className="farmer">
        by {product.farmer_user.farmers.farm_name}
        {product.farmer_user.farmers.is_verified && (
          <span className="verified">✓</span>
        )}
      </div>
      {isBuyer && product.status === "available" && (
        <button onClick={handleAddToCart} className="add-to-cart">
          Add to Cart
        </button>
      )}
    </div>
  );
};
```

### Cart Component

```jsx
// components/Cart.jsx
import React from "react";
import { useCart } from "../hooks/useCart";
import { OrderService } from "../services/orders";

const Cart = () => {
  const { cart, isLoading, updateQuantity, removeItem, clearCart } = useCart();

  const handleCheckout = async () => {
    const orderData = {
      delivery_address: "123 Main St", // Get from form
      payment_method: "cash_on_delivery",
      notes: "",
    };

    try {
      const response = await OrderService.checkout(orderData);
      if (response.success) {
        alert("Order placed successfully!");
        // Redirect to orders page
      }
    } catch (error) {
      alert("Checkout failed: " + error.message);
    }
  };

  if (isLoading) return <div>Loading cart...</div>;
  if (!cart || cart.items.length === 0) {
    return <div>Your cart is empty</div>;
  }

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>

      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.id} className="cart-item">
            <img src={item.products.image_url} alt={item.products.title} />
            <div className="item-details">
              <h4>{item.products.title}</h4>
              <p>
                ₱{item.products.price} per {item.products.unit}
              </p>
              <div className="quantity-controls">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="item-total">
              ₱{(parseFloat(item.products.price) * item.quantity).toFixed(2)}
            </div>
            <button onClick={() => removeItem(item.id)} className="remove">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="total">Total: ₱{cart.summary.total.toFixed(2)}</div>
        <button onClick={handleCheckout} className="checkout-btn">
          Proceed to Checkout
        </button>
        <button onClick={clearCart} className="clear-cart">
          Clear Cart
        </button>
      </div>
    </div>
  );
};
```

## Error Handling Best Practices

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  console.error("API Error:", error);

  // Handle network errors
  if (!navigator.onLine) {
    return "No internet connection. Please check your network.";
  }

  // Handle authentication errors
  if (
    error.message?.includes("401") ||
    error.message?.includes("Unauthorized")
  ) {
    AuthService.logout();
    window.location.href = "/login";
    return "Your session has expired. Please log in again.";
  }

  // Handle validation errors
  if (error.message?.includes("validation")) {
    return "Please check your input and try again.";
  }

  // Default error message
  return error.message || "Something went wrong. Please try again.";
};

// Usage in components
const handleSubmit = async (data) => {
  try {
    await ProductService.createProduct(data);
    // Success handling
  } catch (error) {
    const errorMessage = handleApiError(error);
    setErrorState(errorMessage);
  }
};
```

## Environment Configuration

```javascript
// config/environment.js
const config = {
  development: {
    API_BASE_URL: "http://localhost:3000/api",
    DEBUG: true,
  },
  production: {
    API_BASE_URL: "https://your-api-domain.com/api",
    DEBUG: false,
  },
};

export default config[process.env.NODE_ENV || "development"];
```

This integration guide provides practical, ready-to-use code for frontend developers to quickly integrate with the Farm Link Backend API.
