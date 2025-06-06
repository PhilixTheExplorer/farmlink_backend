-- ============================================================================
-- FARM LINK COMPLETE DATABASE SCHEMA
-- Fresh refactored schema with seed data
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- Create user roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create product enums
DO $$ BEGIN
    CREATE TYPE product_category AS ENUM ('rice', 'fruits', 'vegetables', 'herbs', 'handmade', 'dairy', 'meat', 'grains', 'seafood', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('available', 'outOfStock', 'discontinued');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE unit_type AS ENUM ('kg', 'g', 'lbs', 'pcs', 'pack', 'bag', 'box', 'bottle', 'bunch', 'dozen', 'gallon', 'liter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Order and payment related enums
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash_on_delivery', 'bank_transfer', 'mobile_banking', 'credit_card', 'promptpay', 'qr_code_payment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update last_updated for products
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'FL' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ language 'plpgsql';

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (main authentication and profile)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    role user_role DEFAULT 'buyer',
    profile_image_url VARCHAR(500),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farmers table (farmer-specific information)
CREATE TABLE IF NOT EXISTS farmers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_name VARCHAR(255),
    farm_address TEXT,
    farm_description TEXT,
    established_year INTEGER,
    total_sales DECIMAL(12,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Buyers table (buyer-specific information)
CREATE TABLE IF NOT EXISTS buyers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_address TEXT,
    delivery_instructions TEXT,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    preferred_payment_methods payment_method[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category product_category NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit unit_type NOT NULL,
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    image_url TEXT,
    status product_status DEFAULT 'available',
    order_count INTEGER DEFAULT 0 CHECK (order_count >= 0),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CART AND ORDERS SYSTEM
-- ============================================================================

-- Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique cart item per buyer-product combination
    UNIQUE(buyer_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_order_number(),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Delivery information
    delivery_address TEXT NOT NULL,
    delivery_instructions TEXT,
    delivery_date DATE,
    delivery_time_slot VARCHAR(50),
    
    -- Payment information
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_reference VARCHAR(255),
    
    -- Order status and tracking
    status order_status DEFAULT 'pending',
    notes TEXT,
      -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_title VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);

-- Farmers table indexes
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_farm_name ON farmers(farm_name);
CREATE INDEX IF NOT EXISTS idx_farmers_is_verified ON farmers(is_verified);

-- Buyers table indexes
CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_preferred_payment_methods ON buyers USING GIN (preferred_payment_methods);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_farmer_id ON products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_date ON products(created_date);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer_id ON cart_items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_farmer_id ON order_items(farmer_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON buyers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_last_updated BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Farmers policies
CREATE POLICY "Farmer profiles are viewable by everyone" ON farmers
    FOR SELECT USING (true);

CREATE POLICY "Farmers can update their own profile" ON farmers
    FOR UPDATE USING (auth.uid() = user_id);

-- Buyers policies
CREATE POLICY "Buyers can view their own profile" ON buyers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Buyers can update their own profile" ON buyers
    FOR UPDATE USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Farmers can manage their own products" ON products
    FOR ALL USING (auth.uid() = farmer_id);

-- Cart items policies
CREATE POLICY "Users can manage their own cart items" ON cart_items
    FOR ALL USING (auth.uid() = buyer_id);

-- Orders policies
CREATE POLICY "Buyers can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own orders" ON orders
    FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Farmers can view orders with their products" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            WHERE oi.order_id = orders.id AND oi.farmer_id = auth.uid()
        )
    );

CREATE POLICY "Farmers can update order status for their products" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            WHERE oi.order_id = orders.id AND oi.farmer_id = auth.uid()
        )
    );

-- Order items policies
CREATE POLICY "Order items are viewable by order participants" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id 
            AND (o.buyer_id = auth.uid() OR order_items.farmer_id = auth.uid())
        )
    );

CREATE POLICY "System can insert order items" ON order_items
    FOR INSERT WITH CHECK (true);
