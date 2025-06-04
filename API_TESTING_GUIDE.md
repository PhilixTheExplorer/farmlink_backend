# Farm Link API Testing Guide - Cart & Products

## Base URL

```
http://localhost:3000/api
```

## Authentication Required

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🛍️ PRODUCTS API ENDPOINTS

### 1. Get All Products

```http
GET /products
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search term for title/description
- `category` (string): Filter by category
- `status` (string): Filter by status (available, outOfStock, discontinued)
- `farmer_id` (UUID): Filter by farmer ID
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter

**Example:**

```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10&category=fruits&status=available"
```

### 2. Get Product by ID

```http
GET /products/:id
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000"
```

### 3. Get Products by Farmer

```http
GET /products/farmer/:farmerId
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/products/farmer/123e4567-e89b-12d3-a456-426614174000"
```

### 4. Get Products by Category

```http
GET /products/category/:category
```

**Available Categories:** rice, fruits, vegetables, herbs, handmade, dairy, meat, other

**Example:**

```bash
curl -X GET "http://localhost:3000/api/products/category/vegetables?page=1&limit=5"
```

### 5. Create New Product (Farmer Only)

```http
POST /products
Authorization: Bearer <farmer_token>
```

**Request Body:**

```json
{
  "title": "Fresh Organic Apples",
  "description": "Sweet and crispy organic apples from our farm",
  "price": 150.0,
  "category": "fruits",
  "quantity": 50,
  "unit": "kg",
  "image_url": "https://example.com/apple.jpg",
}
```

**Example:**

```bash
curl -X POST "http://localhost:3000/api/products" \
  -H "Authorization: Bearer <farmer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fresh Organic Apples",
    "description": "Sweet and crispy organic apples",
    "price": 150.00,
    "category": "fruits",
    "quantity": 50,
    "unit": "kg",
  }'
```

### 6. Update Product (Farmer Only)

```http
PUT /products/:id
Authorization: Bearer <farmer_token>
```

**Request Body:** Same as create product

### 7. Update Product Status (Farmer Only)

```http
PATCH /products/:id/status
Authorization: Bearer <farmer_token>
```

**Request Body:**

```json
{
  "status": "available"
}
```

**Valid Status Values:** available, outOfStock, discontinued

### 8. Update Product Quantity (Farmer Only)

```http
PATCH /products/:id/quantity
Authorization: Bearer <farmer_token>
```

**Request Body:**

```json
{
  "quantity": 25
}
```

### 9. Delete Product (Farmer Only)

```http
DELETE /products/:id
Authorization: Bearer <farmer_token>
```

### 10. Get Product Categories

```http
GET /products/meta/categories
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/products/meta/categories"
```

### 11. Get Product Units

```http
GET /products/meta/units
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/products/meta/units"
```

### 12. Get Popular/Featured Products

```http
GET /products/featured/popular
```

**Query Parameters:**

- `limit` (number): Number of products to return (default: 10)

**Example:**

```bash
curl -X GET "http://localhost:3000/api/products/featured/popular?limit=5"
```

---

## 🛒 CART API ENDPOINTS

### 1. Get Cart Items (Buyer Only)

```http
GET /cart
Authorization: Bearer <buyer_token>
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/cart" \
  -H "Authorization: Bearer <buyer_token>"
```

### 2. Add Item to Cart (Buyer Only)

```http
POST /cart/items
Authorization: Bearer <buyer_token>
```

**Request Body:**

```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 2
}
```

**Example:**

```bash
curl -X POST "http://localhost:3000/api/cart/items" \
  -H "Authorization: Bearer <buyer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "123e4567-e89b-12d3-a456-426614174000",
    "quantity": 2
  }'
```

### 3. Update Cart Item Quantity (Buyer Only)

```http
PUT /cart/items/:itemId
Authorization: Bearer <buyer_token>
```

**Request Body:**

```json
{
  "quantity": 5
}
```

**Example:**

```bash
curl -X PUT "http://localhost:3000/api/cart/items/456e7890-e89b-12d3-a456-426614174001" \
  -H "Authorization: Bearer <buyer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

### 4. Remove Item from Cart (Buyer Only)

```http
DELETE /cart/items/:itemId
Authorization: Bearer <buyer_token>
```

**Example:**

```bash
curl -X DELETE "http://localhost:3000/api/cart/items/456e7890-e89b-12d3-a456-426614174001" \
  -H "Authorization: Bearer <buyer_token>"
```

### 5. Clear Entire Cart (Buyer Only)

```http
DELETE /cart/clear
Authorization: Bearer <buyer_token>
```

**Example:**

```bash
curl -X DELETE "http://localhost:3000/api/cart/clear" \
  -H "Authorization: Bearer <buyer_token>"
```

### 6. Get Cart Summary (Buyer Only)

```http
GET /cart/summary
Authorization: Bearer <buyer_token>
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/cart/summary" \
  -H "Authorization: Bearer <buyer_token>"
```

---

## 🔐 AUTHENTICATION ENDPOINTS

### 1. Register User

```http
POST /users/register
```

**Request Body:**

```json
{
  "email": "farmer@example.com",
  "password": "securepass123",
  "name": "John Farmer",
  "phone": "+1234567890",
  "location": "California, USA",
  "role": "farmer"
}
```

**Example:**

```bash
curl -X POST "http://localhost:3000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "securepass123",
    "name": "John Farmer",
    "role": "farmer"
  }'
```

### 2. Login User

```http
POST /users/login
```

**Request Body:**

```json
{
  "email": "farmer@example.com",
  "password": "securepass123"
}
```

**Example:**

```bash
curl -X POST "http://localhost:3000/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "securepass123"
  }'
```

---

## 📝 TESTING WORKFLOW

### Step 1: Start the Server

```bash
npm start
```

### Step 2: Test Database Connection

```bash
curl -X GET "http://localhost:3000/api/test-db"
```

### Step 3: Register Users

```bash
# Register a farmer
curl -X POST "http://localhost:3000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer1@test.com",
    "password": "password123",
    "name": "Test Farmer",
    "role": "farmer"
  }'

# Register a buyer
curl -X POST "http://localhost:3000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer1@test.com",
    "password": "password123",
    "name": "Test Buyer",
    "role": "buyer"
  }'
```

### Step 4: Login and Get Tokens

```bash
# Login as farmer
curl -X POST "http://localhost:3000/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer1@test.com",
    "password": "password123"
  }'

# Login as buyer
curl -X POST "http://localhost:3000/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer1@test.com",
    "password": "password123"
  }'
```

### Step 5: Test Products (as Farmer)

```bash
# Create a product
curl -X POST "http://localhost:3000/api/products" \
  -H "Authorization: Bearer <farmer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fresh Bananas",
    "description": "Sweet organic bananas",
    "price": 80.00,
    "category": "fruits",
    "quantity": 100,
    "unit": "pcs",
  }'

# Get all products
curl -X GET "http://localhost:3000/api/products"
```

### Step 6: Test Cart (as Buyer)

```bash
# Add product to cart
curl -X POST "http://localhost:3000/api/cart/items" \
  -H "Authorization: Bearer <buyer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "<product_id_from_step_5>",
    "quantity": 5
  }'

# Get cart
curl -X GET "http://localhost:3000/api/cart" \
  -H "Authorization: Bearer <buyer_token>"
```

---

## 🚨 COMMON RESPONSE FORMATS

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Field1 is required", "Field2 must be valid"]
}
```

---

## 📊 SAMPLE RESPONSE DATA

### Product Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Fresh Organic Apples",
      "description": "Sweet and crispy organic apples",
      "price": 150.0,
      "category": "fruits",
      "quantity": 50,
      "unit": "kg",
      "status": "available",
      "farmers": {
        "farm_name": "Green Valley Farm",
        "is_verified": true,
        "users": {
          "name": "John Farmer",
          "location": "California"
        }
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

### Cart Response Example

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart-item-id",
        "quantity": 2,
        "products": {
          "id": "product-id",
          "title": "Fresh Bananas",
          "price": 80.0,
          "unit": "pcs",
          "farmers": {
            "farm_name": "Tropical Farm"
          }
        }
      }
    ],
    "itemCount": 2,
    "subtotal": 160.0,
    "total": 160.0
  }
}
```
