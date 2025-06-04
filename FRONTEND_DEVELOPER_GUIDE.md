# Farm Link API - Frontend Developer Quick Reference

## 🚀 Quick Start

### Setup & Configuration

```javascript
// config/api.js
export const API_CONFIG = {
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Base API call function
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const config = {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API call failed");
  }

  return data;
};
```

## 🔐 Authentication

### Register & Login

```javascript
// Register new user
const register = async (userData) => {
  return await apiCall("/users/register", {
    method: "POST",
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123",
      role: "buyer", // or 'farmer'
    }),
  });
};

// Login user
const login = async (email, password) => {
  const response = await apiCall("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Store token
  localStorage.setItem("authToken", response.data.token);
  localStorage.setItem("user", JSON.stringify(response.data.user));

  return response;
};

// Logout
const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};
```

## 🛒 Products

### Get Products with Filters

```javascript
const getProducts = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    ...(filters.search && { search: filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.status && { status: filters.status }),
    ...(filters.min_price && { min_price: filters.min_price }),
    ...(filters.max_price && { max_price: filters.max_price }),
  });

  return await apiCall(`/products?${params}`);
};

// Get product by ID
const getProduct = async (id) => {
  return await apiCall(`/products/${id}`);
};

// Get products by category
const getProductsByCategory = async (category, page = 1) => {
  return await apiCall(`/products/category/${category}?page=${page}`);
};

// Get featured/popular products
const getFeaturedProducts = async (limit = 10) => {
  return await apiCall(`/products/featured/popular?limit=${limit}`);
};
```

### Create/Update Products (Farmers Only)

```javascript
// Create new product
const createProduct = async (productData) => {
  return await apiCall("/products", {
    method: "POST",
    body: JSON.stringify({
      title: "Fresh Tomatoes",
      description: "Organic red tomatoes",
      price: 12.5,
      category: "vegetables",
      quantity: 100,
      unit: "kg",
      image_url: "https://example.com/tomato.jpg", // optional
    }),
  });
};

// Update product
const updateProduct = async (id, updates) => {
  return await apiCall(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

// Update product status
const updateProductStatus = async (id, status) => {
  return await apiCall(`/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }), // 'available', 'outOfStock', 'discontinued'
  });
};
```

## 🛍️ Shopping Cart (Buyers Only)

```javascript
// Get cart items
const getCart = async () => {
  return await apiCall("/cart");
};

// Add item to cart
const addToCart = async (productId, quantity) => {
  return await apiCall("/cart/items", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      quantity: quantity,
    }),
  });
};

// Update cart item quantity
const updateCartItem = async (itemId, quantity) => {
  return await apiCall(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
};

// Remove item from cart
const removeFromCart = async (itemId) => {
  return await apiCall(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
};

// Get cart summary
const getCartSummary = async () => {
  return await apiCall("/cart/summary");
};

// Clear entire cart
const clearCart = async () => {
  return await apiCall("/cart/clear", {
    method: "DELETE",
  });
};
```

## 📦 Orders

```javascript
// Get user's orders
const getOrders = async (page = 1, status = "") => {
  const params = new URLSearchParams({ page });
  if (status) params.append("status", status);

  return await apiCall(`/orders?${params}`);
};

// Get specific order
const getOrder = async (orderId) => {
  return await apiCall(`/orders/${orderId}`);
};

// Checkout (create order from cart)
const checkout = async (orderData) => {
  return await apiCall("/orders/checkout", {
    method: "POST",
    body: JSON.stringify({
      delivery_address: "Complete delivery address",
      payment_method: "cash_on_delivery", // or 'bank_transfer', 'gcash', 'paypal'
      notes: "Optional delivery notes",
    }),
  });
};

// Update order status (farmers/admins)
const updateOrderStatus = async (orderId, status) => {
  return await apiCall(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status, // 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'
    }),
  });
};
```

## 👤 User Profile Management

```javascript
// Get current user profile
const getCurrentUser = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role === "farmer") {
    return await apiCall(`/farmers/user/${user.id}`);
  } else if (user.role === "buyer") {
    return await apiCall(`/buyers/user/${user.id}`);
  }
  return await apiCall(`/users/${user.id}`);
};

// Update farmer profile
const updateFarmerProfile = async (userId, updates) => {
  return await apiCall(`/farmers/${userId}`, {
    method: "PUT",
    body: JSON.stringify({
      farm_name: "My Farm",
      farm_address: "Farm location",
      ...updates,
    }),
  });
};

// Update buyer profile
const updateBuyerProfile = async (userId, updates) => {
  return await apiCall(`/buyers/${userId}`, {
    method: "PUT",
    body: JSON.stringify({
      delivery_address: "Preferred delivery address",
      ...updates,
    }),
  });
};
```

## 📊 Statistics & Metadata

```javascript
// Get product categories
const getCategories = async () => {
  return await apiCall("/products/meta/categories");
};

// Get product units
const getUnits = async () => {
  return await apiCall("/products/meta/units");
};

// Get farmer statistics
const getFarmerStats = async (userId) => {
  return await apiCall(`/farmers/${userId}/stats`);
};

// Get buyer statistics
const getBuyerStats = async (userId) => {
  return await apiCall(`/buyers/${userId}/stats`);
};

// Get order statistics
const getOrderStats = async () => {
  return await apiCall("/orders/stats/summary");
};
```

## 🔧 React Hooks Examples

### useAuth Hook

```javascript
import { useState, useEffect, useContext, createContext } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiCall("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("authToken", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    setUser(response.data.user);

    return response;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### useProducts Hook

```javascript
import { useState, useEffect } from "react";

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await getProducts(filters);
      setProducts(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [JSON.stringify(filters)]);

  return { products, pagination, isLoading, error, refetch: fetchProducts };
};
```

### useCart Hook

```javascript
import { useState, useEffect } from "react";

export const useCart = () => {
  const [cart, setCart] = useState({ items: [], itemCount: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const response = await getCart();
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (productId, quantity) => {
    await addToCart(productId, quantity);
    await fetchCart();
  };

  const updateItem = async (itemId, quantity) => {
    await updateCartItem(itemId, quantity);
    await fetchCart();
  };

  const removeItem = async (itemId) => {
    await removeFromCart(itemId);
    await fetchCart();
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return {
    cart,
    addItem,
    updateItem,
    removeItem,
    refetch: fetchCart,
    isLoading,
  };
};
```

## 🎨 Component Examples

### Product List Component

```javascript
import React from "react";
import { useProducts } from "../hooks/useProducts";

const ProductList = ({ category, searchTerm }) => {
  const { products, pagination, isLoading, error } = useProducts({
    category,
    search: searchTerm,
    page: 1,
    limit: 12,
  });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <img
            src={product.image_url || "/default-product.png"}
            alt={product.title}
          />
          <h3>{product.title}</h3>
          <p>{product.description}</p>
          <div className="price">
            ₱{product.price} per {product.unit}
          </div>
          <div className="farmer">by {product.farmer_user?.name}</div>
          {product.farmer_user?.farmers?.is_verified && (
            <span className="verified">✓ Verified Farmer</span>
          )}
          <button onClick={() => addToCart(product.id, 1)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
};
```

### Cart Component

```javascript
import React from "react";
import { useCart } from "../hooks/useCart";

const CartComponent = () => {
  const { cart, updateItem, removeItem, isLoading } = useCart();

  if (isLoading) return <div>Loading cart...</div>;

  return (
    <div className="cart">
      <h2>Shopping Cart ({cart.itemCount} items)</h2>

      {cart.items.map((item) => (
        <div key={item.id} className="cart-item">
          <img
            src={item.products.image_url || "/default-product.png"}
            alt={item.products.title}
          />
          <div className="item-details">
            <h4>{item.products.title}</h4>
            <p>
              ₱{item.products.price} per {item.products.unit}
            </p>
            <p>by {item.products.farmer_user?.name}</p>
          </div>
          <div className="quantity-controls">
            <button onClick={() => updateItem(item.id, item.quantity - 1)}>
              -
            </button>
            <span>{item.quantity}</span>
            <button onClick={() => updateItem(item.id, item.quantity + 1)}>
              +
            </button>
          </div>
          <div className="item-total">
            ₱{(item.products.price * item.quantity).toFixed(2)}
          </div>
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}

      <div className="cart-total">
        <strong>Total: ₱{cart.total.toFixed(2)}</strong>
      </div>

      <button className="checkout-btn">Proceed to Checkout</button>
    </div>
  );
};
```

## ⚠️ Error Handling

```javascript
// Global error handler
const handleApiError = (error) => {
  console.error("API Error:", error);

  // Handle different error types
  if (error.message.includes("401")) {
    // Unauthorized - redirect to login
    logout();
    window.location.href = "/login";
  } else if (error.message.includes("403")) {
    // Forbidden - show access denied message
    alert("Access denied. You do not have permission for this action.");
  } else if (error.message.includes("404")) {
    // Not found
    alert("Requested resource not found.");
  } else if (error.message.includes("500")) {
    // Server error
    alert("Server error. Please try again later.");
  } else {
    // Generic error
    alert(error.message || "An unexpected error occurred.");
  }
};

// Use in components
try {
  const result = await apiCall("/some/endpoint");
  // Handle success
} catch (error) {
  handleApiError(error);
}
```

## 📱 Environment Configuration

```javascript
// .env.local
REACT_APP_API_BASE_URL=http://localhost:3000/api
REACT_APP_JWT_TOKEN_KEY=authToken

// config/environment.js
export const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
  tokenKey: process.env.REACT_APP_JWT_TOKEN_KEY || 'authToken'
};
```

## 🚀 Common Workflows

### Complete User Registration & Product Purchase Flow

```javascript
// 1. Register as buyer
const registerBuyer = async () => {
  try {
    const response = await register({
      email: "buyer@example.com",
      password: "password123",
      role: "buyer",
    });

    // Automatically log in after registration
    localStorage.setItem("authToken", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

// 2. Browse and add products to cart
const addProductToCart = async (productId, quantity) => {
  try {
    await addToCart(productId, quantity);
    console.log("Product added to cart successfully");
  } catch (error) {
    if (error.message.includes("stock")) {
      alert("Not enough stock available");
    } else {
      console.error("Failed to add to cart:", error);
    }
  }
};

// 3. Checkout process
const processCheckout = async (deliveryAddress, paymentMethod) => {
  try {
    const order = await checkout({
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      notes: "Please handle with care",
    });

    console.log("Order created:", order.data);
    return order;
  } catch (error) {
    if (error.message.includes("cart is empty")) {
      alert("Your cart is empty");
    } else if (error.message.includes("unavailable")) {
      alert("Some items in your cart are no longer available");
    } else {
      console.error("Checkout failed:", error);
    }
    throw error;
  }
};
```

This guide provides everything you need to integrate with the Farm Link API. For complete endpoint documentation, see `COMPLETE_API_DOCUMENTATION.md`. For additional React examples and advanced usage, see `FRONTEND_INTEGRATION_GUIDE.md`.
