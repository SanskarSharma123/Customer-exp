-- Create database (run this separately before connecting to the database)
-- CREATE DATABASE quick_commerce;
-- Then connect to the database with: \c quick_commerce

-- User table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Address table (updated with latitude/longitude)
CREATE TABLE IF NOT EXISTS addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Category table
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    category_id INT NOT NULL,
    image_url VARCHAR(255),
    stock_quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    address_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled')) DEFAULT 'pending',
    payment_method VARCHAR(20) CHECK (payment_method IN ('card', 'upi', 'cash_on_delivery')) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_time TIMESTAMP NOT NULL,
    actual_delivery_time TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (address_id) REFERENCES addresses(address_id)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Delivery Personnel table
CREATE TABLE IF NOT EXISTS delivery_personnel (
    personnel_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Delivery Tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
    tracking_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    personnel_id INT,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled')) NOT NULL,
    location VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_id) REFERENCES delivery_personnel(personnel_id)
);

-- Delivery Locations table (new table for tracking real-time locations)
CREATE TABLE IF NOT EXISTS delivery_locations (
    location_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    personnel_id INT ,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    -- FOREIGN KEY (personnel_id) REFERENCES delivery_personnel(personnel_id)
);

-- Store Locations table (new table for multiple store locations)
CREATE TABLE IF NOT EXISTS store_locations (
    store_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for faster queries (with IF NOT EXISTS)
-- Add latitude and longitude to addresses table
-- ALTER TABLE addresses ADD COLUMN latitude DECIMAL(10, 8);
-- ALTER TABLE addresses ADD COLUMN longitude DECIMAL(11, 8);

ALTER TABLE delivery_locations ALTER COLUMN personnel_id DROP NOT NULL;

-- Create stores table
CREATE TABLE stores (
  store_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add to your existing DDL.sql
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_helpful (
    helpful_id SERIAL PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(review_id, user_id)
);
-- Insert default store in Bangalore
INSERT INTO stores (name, address, latitude, longitude) VALUES (
  'Main Store',
  '123 MG Road, Bangalore, Karnataka 560001',
  12.9716,
  77.5946
);
DO $$
BEGIN
    -- Check if the indexes already exist and create them if they don't
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_category') THEN
        CREATE INDEX idx_product_category ON products(category_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_user') THEN
        CREATE INDEX idx_order_user ON orders(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_status') THEN
        CREATE INDEX idx_order_status ON orders(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cart_user') THEN
        CREATE INDEX idx_cart_user ON cart(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tracking_order') THEN
        CREATE INDEX idx_tracking_order ON order_tracking(order_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_delivery_locations_order') THEN
        CREATE INDEX idx_delivery_locations_order ON delivery_locations(order_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_delivery_locations_timestamp') THEN
        CREATE INDEX idx_delivery_locations_timestamp ON delivery_locations(timestamp);
    END IF;
    
    -- Check if the addresses table has latitude and longitude columns before creating the index
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        AND column_name = 'latitude'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        AND column_name = 'longitude'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_addresses_user'
    ) THEN
        CREATE INDEX idx_addresses_user ON addresses(user_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        AND column_name = 'latitude'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        AND column_name = 'longitude'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_addresses_coords'
    ) THEN
        CREATE INDEX idx_addresses_coords ON addresses(latitude, longitude);
    END IF;
END $$;