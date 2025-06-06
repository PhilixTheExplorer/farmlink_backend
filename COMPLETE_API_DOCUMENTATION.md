# Farm Link Backend - Complete API Documentation for Frontend Development

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URLs and Headers](#base-urls-and-headers)
- [API Endpoints](#api-endpoints)
  - [System Endpoints](#system-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [User Management](#user-management)
  - [Farmer Management](#farmer-management)
  - [Buyer Management](#buyer-management)
  - [Product Management](#product-management)
  - [Cart Management](#cart-management)
  - [Order Management](#order-management)
- [Error Handling](#error-handling)
- [Data Models](#data-models)
- [Examples](#examples)

## Overview

The Farm Link Backend API is a comprehensive REST API that connects farmers with buyers through a digital marketplace platform. This documentation provides all the information needed for frontend development.

**Base URL:** `http://localhost:3000/api`
**API Version:** `1.0.0`
**Authentication:** JWT Bearer Token

## Authentication

### JWT Token Authentication

- All authenticated endpoints require a JWT token in the Authorization header
- Tokens are obtained through login and are valid for 7 days
- Format: `Authorization: Bearer <your-jwt-token>`

### User Roles

- **farmer**: Can create and manage products, view orders containing their products
- **buyer**: Can add items to cart, place orders, view their order history
- **admin**: Full system access (currently not implemented in registration)

## Base URLs and Headers

```javascript
// Base configuration for API calls
const API_BASE_URL = "http://localhost:3000/api";

// Common headers
const headers = {
  "Content-Type": "application/json",
  // Add for authenticated requests:
  Authorization: `Bearer ${token}`,
};
```

## API Endpoints

### System Endpoints

#### Health Check

```http
GET /health
```

**Description:** Check server health status
**Authentication:** None
**Response:**

```json
{
  "status": "OK",
  "message": "Farm Link Backend is running",
  "timestamp": "2025-06-04T10:30:00Z",
  "version": "1.0.0"
}
```

#### Database Test

```http
GET /test-db
```

**Description:** Test database connection
**Authentication:** None

#### API Dashboard

```http
GET /dashboard
```

**Description:** Complete API documentation and statistics
**Authentication:** None

---

### Authentication Endpoints

#### Register User

```http
POST /users/register
```

**Description:** Register a new farmer or buyer
**Authentication:** None
**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890",
  "location": "California, USA",
  "role": "farmer" // or "buyer"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "farmer"
    },
    "profile": {
      "user_id": "uuid",
      "farm_name": null,
      "is_verified": false
    },
    "token": "jwt-token"
  }
}
```

#### Login User

```http
POST /users/login
```

**Description:** Login user and receive JWT token
**Authentication:** None
**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "farmer"
    },
    "profile": {
      "farm_name": "Green Valley Farm",
      "is_verified": true
    },
    "token": "jwt-token"
  }
}
```

---

### User Management

#### Get All Users (Admin Only)

```http
GET /users?page=1&limit=10&search=john&role=farmer
```

**Description:** Get paginated list of users with search and filtering
**Authentication:** Required (Admin)
**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search in name, email, location
- `role` (optional): Filter by role (farmer, buyer)

#### Get User by ID

```http
GET /users/{userId}
```

**Description:** Get specific user information
**Authentication:** Required (Own profile or Admin)

#### Update User

```http
PUT /users/{userId}
```

**Description:** Update user information
**Authentication:** Required (Own profile or Admin)
**Request Body:**

```json
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "location": "New Location",
  "profile_image_url": "https://example.com/image.jpg"
}
```

#### Delete User

```http
DELETE /users/{userId}
```

**Description:** Delete user account
**Authentication:** Required (Own profile or Admin)

---

### Farmer Management

#### Get All Farmers

```http
GET /farmers?page=1&limit=10&search=farm&verified=true
```

**Description:** Get paginated list of farmers
**Authentication:** None
**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search in farm name, address
- `verified` (optional): Filter by verification status

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "farm_name": "Green Valley Farm",
      "farm_address": "123 Farm Road",
      "is_verified": true,
      "total_sales": 1500.0,
      "users": {
        "id": "uuid",
        "name": "John Farmer",
        "email": "john@farm.com",
        "location": "California"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Get Farmer by ID

```http
GET /farmers/{farmerId}
```

**Description:** Get farmer profile with user information
**Authentication:** None

#### Get Farmer by User ID

```http
GET /farmers/user/{userId}
```

**Description:** Get farmer profile by user ID
**Authentication:** None

#### Update Farmer Profile

```http
PUT /farmers/{userId}
```

**Description:** Update farmer profile information
**Authentication:** Required (Own profile or Admin)
**Request Body:**

```json
{
  "farm_name": "Updated Farm Name",
  "farm_address": "Updated Address",
  "farm_description": "Description of the farm"
}
```

#### Verify Farmer (Admin Only)

```http
PATCH /farmers/{userId}/verify
```

**Description:** Verify or unverify a farmer
**Authentication:** Required (Admin)
**Request Body:**

```json
{
  "is_verified": true
}
```

#### Get Farmer Statistics

```http
GET /farmers/{userId}/stats
```

**Description:** Get comprehensive farmer statistics
**Authentication:** Required (Own profile or Admin)
**Response:**

```json
{
  "success": true,
  "data": {
    "totalProducts": 15,
    "availableProducts": 12,
    "outOfStockProducts": 2,
    "totalSales": 2500.0,
    "totalOrders": 45,
    "productsByCategory": {
      "vegetables": 8,
      "fruits": 4,
      "herbs": 3
    },
    "isVerified": true
  }
}
```

---

### Buyer Management

#### Get All Buyers

```http
GET /buyers?page=1&limit=10&search=john
```

**Description:** Get paginated list of buyers
**Authentication:** None

#### Get Buyer by User ID

```http
GET /buyers/user/{userId}
```

**Description:** Get buyer profile by user ID
**Authentication:** None

#### Update Buyer Profile

```http
PUT /buyers/{userId}
```

**Description:** Update buyer profile
**Authentication:** Required (Own profile or Admin)
**Request Body:**

```json
{
  "delivery_address": "Updated delivery address",
  "delivery_instructions": "Updated delivery instructions",
  "preferred_payment_methods": ["credit_card", "promptpay", "mobile_banking"]
}
```

**Note:** `preferred_payment_methods` should be an array of valid payment methods:

- `cash_on_delivery`
- `bank_transfer`
- `mobile_banking`
- `credit_card`
- `promptpay`
- `qr_code_payment`

#### Get Available Payment Methods

```http
GET /buyers/config/payment-methods
```

**Description:** Get list of available payment methods with descriptions
**Authentication:** None
**Response:**

```json
{
  "success": true,
  "data": [
    {
      "value": "cash_on_delivery",
      "label": "Cash on Delivery",
      "description": "Pay when your order is delivered"
    },
    {
      "value": "bank_transfer",
      "label": "Bank Transfer",
      "description": "Direct bank transfer"
    },
    {
      "value": "mobile_banking",
      "label": "Mobile Banking",
      "description": "Mobile banking app transfer"
    },
    {
      "value": "credit_card",
      "label": "Credit Card",
      "description": "Credit or debit card payment"
    },
    {
      "value": "promptpay",
      "label": "PromptPay",
      "description": "Thailand PromptPay instant payment"
    },
    {
      "value": "qr_code_payment",
      "label": "QR Code Payment",
      "description": "Scan QR code to pay"
    }
  ]
}
```

#### Get Buyer Statistics

```http
GET /buyers/{userId}/stats
```

**Description:** Get buyer order and spending statistics
**Authentication:** Required (Own profile or Admin)
**Response:**

```json
{
  "success": true,
  "data": {
    "totalSpent": 450.5,
    "totalOrders": 12,
    "averageOrderValue": 37.54,
    "hasDeliveryAddress": true,
    "deliveryAddress": "123 Main St, City",
    "preferredPaymentMethods": ["credit_card", "promptpay"]
  }
}
```

#### Get Top Buyers

```http
GET /buyers/top/spenders?limit=10
```

**Description:** Get top buyers by total spending
**Authentication:** None

---

### Product Management

#### Get All Products

```http
GET /products?page=1&limit=10&search=tomato&category=vegetables&status=available&farmer_id=uuid&min_price=5&max_price=20
```

**Description:** Get paginated list of products with advanced filtering
**Authentication:** None
**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search in title, description
- `category` (optional): Product category
- `status` (optional): Product status (available, outOfStock, discontinued)
- `farmer_id` (optional): Filter by farmer
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Fresh Tomatoes",
      "description": "Organic red tomatoes",
      "price": "12.50",
      "category": "vegetables",
      "quantity": 100,
      "unit": "kg",
      "image_url": "https://example.com/tomato.jpg",
      "status": "available",
      "farmer_user": {
        "id": "uuid",
        "name": "John Farmer",
        "farmers": {
          "farm_name": "Green Valley Farm",
          "is_verified": true
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

#### Get Product by ID

```http
GET /products/{productId}
```

**Description:** Get detailed product information with farmer details
**Authentication:** None

#### Get Products by Farmer

```http
GET /products/farmer/{farmerId}?page=1&limit=10&status=available
```

**Description:** Get products by specific farmer
**Authentication:** None

#### Get Products by Category

```http
GET /products/category/{category}?page=1&limit=10&status=available
```

**Description:** Get products by category
**Authentication:** None

#### Get Popular/Featured Products

```http
GET /products/featured/popular?limit=10
```

**Description:** Get most ordered/popular products
**Authentication:** None

#### Get Product Categories

```http
GET /products/meta/categories
```

**Description:** Get list of available product categories
**Authentication:** None
**Response:**

```json
{
  "success": true,
  "data": [
    "rice",
    "fruits",
    "vegetables",
    "herbs",
    "handmade",
    "dairy",
    "meat",
    "other"
  ]
}
```

#### Get Product Units

```http
GET /products/meta/units
```

**Description:** Get list of available product units
**Authentication:** None
**Response:**

```json
{
  "success": true,
  "data": ["kg", "g", "pcs", "pack", "bag", "box", "bottle", "bunch", "dozen"]
}
```

#### Create Product (Farmer Only)

```http
POST /products
```

**Description:** Create a new product
**Authentication:** Required (Farmer)
**Request Body:**

```json
{
  "title": "Fresh Tomatoes",
  "description": "Organic red tomatoes grown in our farm",
  "price": 12.5,
  "category": "vegetables",
  "quantity": 100,
  "unit": "kg",
  "image_url": "https://example.com/tomato.jpg"
}
```

#### Update Product (Farmer Only)

```http
PUT /products/{productId}
```

**Description:** Update product information
**Authentication:** Required (Product Owner)

#### Update Product Status (Farmer Only)

```http
PATCH /products/{productId}/status
```

**Description:** Update product availability status
**Authentication:** Required (Product Owner)
**Request Body:**

```json
{
  "status": "available" // or "outOfStock", "discontinued"
}
```

#### Update Product Quantity (Farmer Only)

```http
PATCH /products/{productId}/quantity
```

**Description:** Update product quantity
**Authentication:** Required (Product Owner)
**Request Body:**

```json
{
  "quantity": 50
}
```

#### Delete Product (Farmer Only)

```http
DELETE /products/{productId}
```

**Description:** Delete a product
**Authentication:** Required (Product Owner)

---

### Cart Management

#### Get Cart Items (Buyer Only)

```http
GET /cart
```

**Description:** Get current user's cart items with product details and totals
**Authentication:** Required (Buyer)
**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "quantity": 2,
        "created_at": "2025-06-04T10:00:00Z",
        "products": {
          "id": "uuid",
          "title": "Fresh Tomatoes",
          "price": "12.50",
          "unit": "kg",
          "image_url": "https://example.com/tomato.jpg",
          "farmer_user": {
            "name": "John Farmer",
            "farmers": {
              "farm_name": "Green Valley Farm"
            }
          }
        }
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": 25.0,
      "total": 25.0
    }
  }
}
```

#### Add Item to Cart (Buyer Only)

```http
POST /cart/items
```

**Description:** Add a product to cart
**Authentication:** Required (Buyer)
**Request Body:**

```json
{
  "product_id": "uuid",
  "quantity": 2
}
```

#### Update Cart Item Quantity (Buyer Only)

```http
PUT /cart/items/{itemId}
```

**Description:** Update quantity of item in cart
**Authentication:** Required (Buyer)
**Request Body:**

```json
{
  "quantity": 3
}
```

#### Remove Item from Cart (Buyer Only)

```http
DELETE /cart/items/{itemId}
```

**Description:** Remove specific item from cart
**Authentication:** Required (Buyer)

#### Clear Cart (Buyer Only)

```http
DELETE /cart/clear
```

**Description:** Remove all items from cart
**Authentication:** Required (Buyer)

#### Get Cart Summary (Buyer Only)

```http
GET /cart/summary
```

**Description:** Get cart item count and total amount
**Authentication:** Required (Buyer)
**Response:**

```json
{
  "success": true,
  "data": {
    "itemCount": 3,
    "subtotal": 45.0,
    "total": 45.0
  }
}
```

---

### Order Management

#### Get Orders

```http
GET /orders?page=1&limit=10&status=pending&farmer_id=uuid
```

**Description:** Get orders (buyers see their orders, farmers see orders with their products)
**Authentication:** Required
**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by order status
- `farmer_id` (optional): Filter by farmer (admin only)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-1717502400-ABC12",
      "total_amount": "45.00",
      "delivery_address": "123 Main St, City",
      "payment_method": "cash_on_delivery",
      "payment_status": "pending",
      "status": "pending",
      "created_at": "2025-06-04T10:00:00Z",
      "order_items": [
        {
          "quantity": 2,
          "unit_price": "12.50",
          "subtotal": "25.00",
          "products": {
            "title": "Fresh Tomatoes",
            "unit": "kg"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### Get Order by ID

```http
GET /orders/{orderId}
```

**Description:** Get detailed order information
**Authentication:** Required (Order owner, farmer with products in order, or admin)

#### Checkout (Create Order from Cart)

```http
POST /orders/checkout
```

**Description:** Create order from current cart items
**Authentication:** Required (Buyer)
**Request Body:**

```json
{
  "delivery_address": "123 Main St, City, State",
  "payment_method": "cash_on_delivery", // or "bank_transfer", "gcash", "paypal"
  "notes": "Please deliver in the morning"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "ORD-1717502400-ABC12",
      "total_amount": "45.00",
      "status": "pending"
    },
    "order_items": [...],
    "summary": {
      "item_count": 3,
      "total_amount": 45.00,
      "order_number": "ORD-1717502400-ABC12"
    }
  }
}
```

#### Update Order Status

```http
PATCH /orders/{orderId}/status
```

**Description:** Update order status (farmers can update orders with their products, buyers can cancel pending orders)
**Authentication:** Required
**Request Body:**

```json
{
  "status": "confirmed" // pending, confirmed, preparing, ready_for_pickup, out_for_delivery, delivered, cancelled
}
```

#### Update Payment Status (Admin Only)

```http
PATCH /orders/{orderId}/payment
```

**Description:** Update payment status
**Authentication:** Required (Admin)
**Request Body:**

```json
{
  "payment_status": "completed" // pending, completed, failed, refunded
}
```

#### Get Order Statistics

```http
GET /orders/stats/summary
```

**Description:** Get order statistics for current user
**Authentication:** Required
**Response:**

```json
{
  "success": true,
  "data": {
    "totalOrders": 15,
    "totalSpent": 450.0, // for buyers
    "totalRevenue": 1200.0, // for farmers
    "pendingOrders": 2,
    "completedOrders": 12,
    "cancelledOrders": 1,
    "ordersByStatus": {
      "pending": 2,
      "confirmed": 1,
      "delivered": 12
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific error 1", "Specific error 2"], // for validation errors
  "error": "Technical error details" // for server errors
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate email, etc.)
- `429` - Too many requests (rate limiting)
- `500` - Internal server error

---

## Data Models

### User

```javascript
{
  id: "uuid",
  email: "string (unique)",
  name: "string (optional)",
  phone: "string (optional)",
  location: "string (optional)",
  role: "farmer | buyer",
  profile_image_url: "string (optional)",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Farmer Profile

```javascript
{
  user_id: "uuid (references users.id)",
  farm_name: "string (optional)",
  farm_address: "string (optional)",
  farm_description: "string (optional)",
  total_sales: "decimal",
  is_verified: "boolean",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Buyer Profile

```javascript
{
  user_id: "uuid (references users.id)",
  total_spent: "decimal",
  total_orders: "integer",
  delivery_address: "string (optional)",
  delivery_instructions: "string (optional)",
  preferred_payment_methods: "array of payment_method (optional)",
  loyalty_points: "integer",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

**Available Payment Methods:**

- `cash_on_delivery` - Cash on Delivery
- `bank_transfer` - Bank Transfer
- `mobile_banking` - Mobile Banking
- `credit_card` - Credit Card
- `promptpay` - PromptPay
- `qr_code_payment` - QR Code Payment

### Product

```javascript
{
  id: "uuid",
  farmer_id: "uuid (references users.id)",
  title: "string",
  description: "string",
  price: "decimal",
  category: "rice | fruits | vegetables | herbs | handmade | dairy | meat | other",
  quantity: "integer",
  unit: "kg | g | pcs | pack | bag | box | bottle | bunch | dozen",
  image_url: "string (optional)",
  status: "available | outOfStock | discontinued",
  order_count: "integer",
  created_date: "timestamp",
  last_updated: "timestamp",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Cart Item

```javascript
{
  id: "uuid",
  buyer_id: "uuid (references users.id)",
  product_id: "uuid (references products.id)",
  quantity: "integer",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Order

```javascript
{
  id: "uuid",
  buyer_id: "uuid (references users.id)",
  order_number: "string (unique)",
  total_amount: "decimal",
  delivery_address: "string",
  payment_method: "cash_on_delivery | bank_transfer | mobile_banking | credit_card | promptpay | qr_code_payment",
  payment_status: "pending | completed | failed | refunded",
  status: "pending | confirmed | preparing | ready_for_pickup | out_for_delivery | delivered | cancelled",
  notes: "string (optional)",
  created_at: "timestamp",
  updated_at: "timestamp",
  confirmed_at: "timestamp (optional)",
  delivered_at: "timestamp (optional)",
  cancelled_at: "timestamp (optional)"
}
```

### Order Item

```javascript
{
  id: "uuid",
  order_id: "uuid (references orders.id)",
  product_id: "uuid (references products.id)",
  quantity: "integer",
  unit_price: "decimal",
  subtotal: "decimal",
  created_at: "timestamp"
}
```

---

## Examples

### Complete User Registration and Login Flow

```javascript
// 1. Register a new farmer
const registerResponse = await fetch("/api/users/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "farmer@example.com",
    password: "password123",
    name: "John Farmer",
    role: "farmer",
    location: "California, USA",
  }),
});

const { data: registerData } = await registerResponse.json();
const token = registerData.token;

// 2. Update farmer profile
await fetch(`/api/farmers/${registerData.user.id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    farm_name: "Green Valley Farm",
    farm_address: "123 Farm Road, Valley City",
  }),
});

// 3. Create a product
await fetch("/api/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Fresh Tomatoes",
    description: "Organic red tomatoes",
    price: 12.5,
    category: "vegetables",
    quantity: 100,
    unit: "kg",
  }),
});
```

### Complete Shopping Flow for Buyers

```javascript
// 1. Register buyer
const buyerResponse = await fetch("/api/users/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "buyer@example.com",
    password: "password123",
    name: "Jane Buyer",
    role: "buyer",
  }),
});

const { data: buyerData } = await buyerResponse.json();
const buyerToken = buyerData.token;

// 2. Browse products
const productsResponse = await fetch(
  "/api/products?category=vegetables&status=available"
);
const { data: products } = await productsResponse.json();

// 3. Add to cart
await fetch("/api/cart/items", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${buyerToken}`,
  },
  body: JSON.stringify({
    product_id: products[0].id,
    quantity: 2,
  }),
});

// 4. Get cart summary
const cartResponse = await fetch("/api/cart/summary", {
  headers: { Authorization: `Bearer ${buyerToken}` },
});

// 5. Checkout
const orderResponse = await fetch("/api/orders/checkout", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${buyerToken}`,
  },
  body: JSON.stringify({
    delivery_address: "456 Buyer Street, City",
    payment_method: "cash_on_delivery",
  }),
});
```

### Pagination and Filtering Examples

```javascript
// Get products with pagination and filters
const params = new URLSearchParams({
  page: 1,
  limit: 20,
  search: "tomato",
  category: "vegetables",
  min_price: 10,
  max_price: 50,
  status: "available",
});

const response = await fetch(`/api/products?${params}`);
const { data, pagination } = await response.json();

console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
console.log(`Total products: ${pagination.total}`);
```

---

## Rate Limiting

The API implements rate limiting:

- **100 requests per 15 minutes** per IP address
- Rate limit headers are included in responses
- HTTP 429 status returned when limit exceeded

---

## Development Notes

### Environment Setup

```bash
# Required environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Testing

- Use the provided PowerShell testing script: `test_endpoints.ps1`
- Postman collection available: `Farm_Link_API.postman_collection.json`
- Health check endpoint: `GET /health`
- Database test endpoint: `GET /api/test-db`

### Error Debugging

- Check server logs for detailed error information
- Verify JWT token validity and format
- Ensure proper Content-Type headers for JSON requests
- Validate required fields and data types

This documentation covers all available endpoints and provides practical examples for frontend integration. The API is designed to be RESTful and follows consistent patterns for easy integration.
