-- Migration Script: Main Branch to Enhanced Version (15 Categories, 60 Subcategories)
-- Run this script on the original main branch database to add subcategories and other features

-- Step 1: Create new tables
-- ========================

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    subcategory_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Create reviews table
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

-- Create review_helpful table
CREATE TABLE IF NOT EXISTS review_helpful (
    helpful_id SERIAL PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(review_id, user_id)
);

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    store_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Add new columns to existing tables
-- ==========================================

-- Add subcategory_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id INT;
ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS fk_products_subcategory 
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(subcategory_id);

-- Add latitude/longitude to addresses table (if not exists)
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Step 3: Insert subcategory data (60 subcategories for 15 categories)
-- ====================================================================

-- Insert subcategories for existing categories
INSERT INTO subcategories (name, category_id, description) VALUES
-- Fruits & Vegetables (category_id = 1)
('Fresh Fruits', 1, 'Fresh seasonal and exotic fruits'),
('Fresh Vegetables', 1, 'Fresh local and organic vegetables'),
('Organic Produce', 1, 'Certified organic fruits and vegetables'),
('Exotic Fruits', 1, 'Imported and exotic fruits'),

-- Dairy & Eggs (category_id = 2)
('Milk & Dairy Drinks', 2, 'Fresh milk and dairy beverages'),
('Cheese & Butter', 2, 'Various types of cheese and butter'),
('Yogurt & Curd', 2, 'Fresh yogurt and curd products'),
('Eggs', 2, 'Fresh farm eggs'),

-- Bakery (category_id = 3)
('Bread & Buns', 3, 'Fresh bread and buns'),
('Cakes & Pastries', 3, 'Fresh cakes and pastries'),
('Cookies & Biscuits', 3, 'Various cookies and biscuits'),
('Breakfast Items', 3, 'Breakfast breads and items'),

-- Snacks & Beverages (category_id = 4)
('Chips & Crisps', 4, 'Potato chips and crisps'),
('Soft Drinks', 4, 'Carbonated soft drinks'),
('Energy Drinks', 4, 'Energy and sports drinks'),
('Chocolates & Candies', 4, 'Chocolates and candies'),

-- Household (category_id = 5)
('Cleaning Supplies', 5, 'Household cleaning products'),
('Laundry Care', 5, 'Detergents and fabric care'),
('Personal Hygiene', 5, 'Personal care products'),
('Home Care', 5, 'Home maintenance products'),

-- Meat & Seafood (category_id = 6)
('Fresh Meat', 6, 'Fresh meat products'),
('Frozen Meat', 6, 'Frozen meat products'),
('Fresh Seafood', 6, 'Fresh fish and seafood'),
('Frozen Seafood', 6, 'Frozen fish and seafood'),

-- Frozen Foods (category_id = 7)
('Frozen Vegetables', 7, 'Frozen vegetable products'),
('Frozen Meals', 7, 'Ready-to-cook frozen meals'),
('Ice Cream & Desserts', 7, 'Frozen desserts and ice cream'),
('Frozen Snacks', 7, 'Frozen snack items'),

-- Personal Care (category_id = 8)
('Hair Care', 8, 'Hair care products'),
('Skin Care', 8, 'Skin care products'),
('Oral Care', 8, 'Dental care products'),
('Bath & Body', 8, 'Bath and body care products'),

-- Baby Products (category_id = 9)
('Baby Food', 9, 'Baby food and nutrition'),
('Diapers & Wipes', 9, 'Baby diapers and wipes'),
('Baby Care', 9, 'Baby care products'),
('Baby Toys', 9, 'Baby toys and accessories'),

-- Pet Supplies (category_id = 10)
('Pet Food', 10, 'Food for pets'),
('Pet Care', 10, 'Pet care products'),
('Pet Toys', 10, 'Pet toys and accessories'),
('Pet Grooming', 10, 'Pet grooming products'),

-- Breakfast & Cereal (category_id = 11)
('Cereals', 11, 'Breakfast cereals'),
('Oats & Muesli', 11, 'Oats and muesli products'),
('Breakfast Spreads', 11, 'Breakfast spreads and jams'),
('Breakfast Drinks', 11, 'Breakfast beverages'),

-- Condiments & Sauces (category_id = 12)
('Ketchup & Sauces', 12, 'Ketchup and various sauces'),
('Pickles & Chutneys', 12, 'Pickles and chutneys'),
('Spices & Seasonings', 12, 'Spices and seasonings'),
('Cooking Oils', 12, 'Various cooking oils'),

-- Canned & Packaged Foods (category_id = 13)
('Canned Vegetables', 13, 'Canned vegetable products'),
('Canned Fruits', 13, 'Canned fruit products'),
('Packaged Foods', 13, 'Packaged food items'),
('Ready-to-Eat', 13, 'Ready-to-eat packaged foods'),

-- Health Foods & Supplements (category_id = 14)
('Protein Supplements', 14, 'Protein powders and supplements'),
('Vitamins & Minerals', 14, 'Vitamin and mineral supplements'),
('Health Drinks', 14, 'Health and wellness drinks'),
('Organic Foods', 14, 'Organic health foods'),

-- Home & Kitchen (category_id = 15)
('Kitchen Utensils', 15, 'Kitchen utensils and tools'),
('Cookware', 15, 'Cooking pots and pans'),
('Storage & Organization', 15, 'Storage and organization items'),
('Kitchen Appliances', 15, 'Small kitchen appliances');

-- Step 4: Update existing products with subcategory assignments
-- =============================================================

-- Update Fruits & Vegetables products
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Fruits' AND category_id = 1) 
WHERE category_id = 1 AND name LIKE '%Apple%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Fruits' AND category_id = 1) 
WHERE category_id = 1 AND name LIKE '%Banana%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Fruits' AND category_id = 1) 
WHERE category_id = 1 AND name LIKE '%Mango%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Fruits' AND category_id = 1) 
WHERE category_id = 1 AND name LIKE '%Grape%';

UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Vegetables' AND category_id = 1) 
WHERE category_id = 1 AND name LIKE '%Tomato%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Vegetables' AND category_id = 1) 
WHERE category_id = 1 AND name LIKE '%Onion%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Vegetables' AND category_id = 1) 
WHERE category_id = 1 AND name LIKE '%Potato%';

-- Update Dairy & Eggs products
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Milk & Dairy Drinks' AND category_id = 2) 
WHERE category_id = 2 AND name LIKE '%Milk%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Cheese & Butter' AND category_id = 2) 
WHERE category_id = 2 AND name LIKE '%Butter%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Cheese & Butter' AND category_id = 2) 
WHERE category_id = 2 AND name LIKE '%Cheese%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Eggs' AND category_id = 2) 
WHERE category_id = 2 AND name LIKE '%Egg%';

-- Update Bakery products
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Bread & Buns' AND category_id = 3) 
WHERE category_id = 3 AND name LIKE '%Bread%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Cakes & Pastries' AND category_id = 3) 
WHERE category_id = 3 AND name LIKE '%Cake%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Cookies & Biscuits' AND category_id = 3) 
WHERE category_id = 3 AND name LIKE '%Cookie%';

-- Update Snacks & Beverages products
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Chips & Crisps' AND category_id = 4) 
WHERE category_id = 4 AND name LIKE '%Chip%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Soft Drinks' AND category_id = 4) 
WHERE category_id = 4 AND name LIKE '%Cola%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Chocolates & Candies' AND category_id = 4) 
WHERE category_id = 4 AND name LIKE '%Chocolate%';

-- Update Household products
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Cleaning Supplies' AND category_id = 5) 
WHERE category_id = 5 AND name LIKE '%Vim%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Laundry Care' AND category_id = 5) 
WHERE category_id = 5 AND name LIKE '%Surf%';
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Personal Hygiene' AND category_id = 5) 
WHERE category_id = 5 AND name LIKE '%Dettol%';

-- Set default subcategories for remaining products (first subcategory of each category)
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Fruits' AND category_id = 1) 
WHERE category_id = 1 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Milk & Dairy Drinks' AND category_id = 2) 
WHERE category_id = 2 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Bread & Buns' AND category_id = 3) 
WHERE category_id = 3 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Chips & Crisps' AND category_id = 4) 
WHERE category_id = 4 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Cleaning Supplies' AND category_id = 5) 
WHERE category_id = 5 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Fresh Meat' AND category_id = 6) 
WHERE category_id = 6 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Frozen Vegetables' AND category_id = 7) 
WHERE category_id = 7 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Hair Care' AND category_id = 8) 
WHERE category_id = 8 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Baby Food' AND category_id = 9) 
WHERE category_id = 9 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Pet Food' AND category_id = 10) 
WHERE category_id = 10 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Cereals' AND category_id = 11) 
WHERE category_id = 11 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Ketchup & Sauces' AND category_id = 12) 
WHERE category_id = 12 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Canned Vegetables' AND category_id = 13) 
WHERE category_id = 13 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Protein Supplements' AND category_id = 14) 
WHERE category_id = 14 AND subcategory_id IS NULL;
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE name = 'Kitchen Utensils' AND category_id = 15) 
WHERE category_id = 15 AND subcategory_id IS NULL;

-- Step 5: Insert sample data
-- ==========================

-- Insert default store
INSERT INTO stores (name, address, latitude, longitude) VALUES 
('Main Store', '123 MG Road, Bangalore, Karnataka 560001', 12.9716, 77.5946);

-- Insert sample reviews (optional)
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
(1, 2, 5, 'Great quality apples!'),
(2, 3, 4, 'Fresh and tasty'),
(3, 4, 5, 'Excellent product');

-- Step 6: Create indexes for performance
-- ======================================

CREATE INDEX IF NOT EXISTS idx_product_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_review_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_review_user ON reviews(user_id);

-- Step 7: Verification queries
-- ============================

-- Verify subcategories were created
SELECT 'Subcategories created:' as info, COUNT(*) as count FROM subcategories;

-- Verify products have subcategory assignments
SELECT 'Products with subcategory:' as info, COUNT(*) as count FROM products WHERE subcategory_id IS NOT NULL;

-- Verify foreign key constraints
SELECT 'Foreign key check:' as info, 
       CASE WHEN EXISTS (
           SELECT 1 FROM products p 
           LEFT JOIN subcategories s ON p.subcategory_id = s.subcategory_id 
           WHERE p.subcategory_id IS NOT NULL AND s.subcategory_id IS NULL
       ) THEN 'ERROR: Orphaned subcategory references found' 
       ELSE 'OK: All subcategory references valid' 
       END as status;

-- Migration completed successfully!
SELECT 'Migration completed successfully!' as status; 