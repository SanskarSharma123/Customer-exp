-- Standalone Migration: Add subcategories and assign to first 5 categories

-- 1. Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    subcategory_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    name VARCHAR(100) NOT NULL
);

-- 2. Add subcategory_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES subcategories(subcategory_id);

-- 3. Insert subcategories for first 5 categories
-- Fruits & Vegetables (category_id = 1)
INSERT INTO subcategories (category_id, name) VALUES
  (1, 'Apples & Exotic Fruits'),
  (1, 'Bananas & Citrus'),
  (1, 'Leafy Greens & Herbs'),
  (1, 'Root Vegetables'),
  (1, 'Gourds & Others');

-- Dairy & Eggs (category_id = 2)
INSERT INTO subcategories (category_id, name) VALUES
  (2, 'Milk & Milk Drinks'),
  (2, 'Cheese & Paneer'),
  (2, 'Butter, Ghee & Cream'),
  (2, 'Yogurt & Curd'),
  (2, 'Eggs'),
  (2, 'Ice Cream & Sweets');

-- Bakery (category_id = 3)
INSERT INTO subcategories (category_id, name) VALUES
  (3, 'Breads'),
  (3, 'Cakes & Pastries'),
  (3, 'Biscuits & Cookies'),
  (3, 'Savory Baked Goods');

-- Snacks & Beverages (category_id = 4)
INSERT INTO subcategories (category_id, name) VALUES
  (4, 'Chips & Namkeen'),
  (4, 'Chocolates & Sweets'),
  (4, 'Soft Drinks & Juices'),
  (4, 'Biscuits & Cookies'),
  (4, 'Energy & Health Drinks');

-- Household (category_id = 5)
INSERT INTO subcategories (category_id, name) VALUES
  (5, 'Cleaning Supplies'),
  (5, 'Air Fresheners & Insect Repellents'),
  (5, 'Laundry & Fabric Care'),
  (5, 'Kitchen & Household Accessories');

-- 4. Assign products to subcategories (example for Fruits & Vegetables)
-- NOTE: You should run SELECTs to get the subcategory_id for each name, then update products accordingly.
-- Example for Apples & Exotic Fruits:
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 1 AND name = 'Apples & Exotic Fruits')
WHERE name ILIKE ANY (ARRAY[
  '%apple%', '%kiwi%', '%avocado%', '%pomegranate%', '%mango%', '%watermelon%', '%grape%']);

UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 1 AND name = 'Bananas & Citrus')
WHERE name ILIKE ANY (ARRAY['%banana%', '%lime%', '%mosambi%']);

UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 1 AND name = 'Leafy Greens & Herbs')
WHERE name ILIKE ANY (ARRAY['%spinach%', '%coriander%', '%mint%']);

UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 1 AND name = 'Root Vegetables')
WHERE name ILIKE ANY (ARRAY['%carrot%', '%ginger%', '%garlic%', '%sweet potato%']);

UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 1 AND name = 'Gourds & Others')
WHERE name ILIKE ANY (ARRAY['%cucumber%', '%okra%', '%brinjal%', '%capsicum%', '%tomato%', '%cauliflower%', '%cabbage%', '%coconut%']);

-- Repeat similar UPDATEs for other categories as needed.
-- For more precise mapping, you may want to manually review and adjust the assignments.

-- =====================
-- Subcategories for categories 6-10
-- =====================

-- Meat & Seafood (category_id = 6)
INSERT INTO subcategories (category_id, name) VALUES
  (6, 'Chicken'),
  (6, 'Fish & Seafood'),
  (6, 'Mutton & Lamb'),
  (6, 'Pork & Beef'),
  (6, 'Other Meat');

-- Frozen Foods (category_id = 7)
INSERT INTO subcategories (category_id, name) VALUES
  (7, 'Frozen Snacks'),
  (7, 'Frozen Vegetables & Fruits'),
  (7, 'Frozen Meat & Seafood'),
  (7, 'Frozen Desserts & Ice Cream');

-- Personal Care (category_id = 8)
INSERT INTO subcategories (category_id, name) VALUES
  (8, 'Soaps & Body Wash'),
  (8, 'Shampoo & Hair Care'),
  (8, 'Oral Care'),
  (8, 'Face Care'),
  (8, 'Shaving & Grooming');

-- Baby Products (category_id = 9)
INSERT INTO subcategories (category_id, name) VALUES
  (9, 'Diapers & Wipes'),
  (9, 'Baby Food & Formula'),
  (9, 'Baby Skincare'),
  (9, 'Other Baby Essentials');

-- Pet Supplies (category_id = 10)
INSERT INTO subcategories (category_id, name) VALUES
  (10, 'Dog Food & Treats'),
  (10, 'Cat Food & Litter'),
  (10, 'Pet Accessories'),
  (10, 'Other Pet Supplies');

-- Assign products to subcategories (examples)
-- Meat & Seafood
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 6 AND name = 'Chicken')
WHERE category_id = 6 AND name ILIKE ANY (ARRAY['%chicken%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 6 AND name = 'Fish & Seafood')
WHERE category_id = 6 AND name ILIKE ANY (ARRAY['%fish%', '%salmon%', '%prawns%', '%pomfret%', '%mackerel%', '%tuna%', '%crab%', '%squid%', '%clams%', '%hilsa%', '%catfish%', '%tilapia%', '%king fish%', '%rohu%', '%bombay duck%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 6 AND name = 'Mutton & Lamb')
WHERE category_id = 6 AND name ILIKE ANY (ARRAY['%mutton%', '%lamb%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 6 AND name = 'Pork & Beef')
WHERE category_id = 6 AND name ILIKE ANY (ARRAY['%pork%', '%beef%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 6 AND name = 'Other Meat')
WHERE category_id = 6 AND subcategory_id IS NULL;

-- Frozen Foods
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 7 AND name = 'Frozen Snacks')
WHERE category_id = 7 AND name ILIKE ANY (ARRAY['%fries%', '%nuggets%', '%tikki%', '%kebab%', '%smiles%', '%pizza%', '%patty%', '%spring rolls%', '%samosa%', '%burger%', '%fingers%', '%bites%', '%rolls%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 7 AND name = 'Frozen Vegetables & Fruits')
WHERE category_id = 7 AND name ILIKE ANY (ARRAY['%vegetable%', '%peas%', '%berries%', '%corn%', '%spinach%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 7 AND name = 'Frozen Meat & Seafood')
WHERE category_id = 7 AND name ILIKE ANY (ARRAY['%chicken%', '%fish%', '%prawns%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 7 AND name = 'Frozen Desserts & Ice Cream')
WHERE category_id = 7 AND name ILIKE ANY (ARRAY['%ice cream%', '%kulfi%', '%cassata%', '%cornetto%', '%dessert%']);

-- Personal Care
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 8 AND name = 'Soaps & Body Wash')
WHERE category_id = 8 AND name ILIKE ANY (ARRAY['%soap%', '%body wash%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 8 AND name = 'Shampoo & Hair Care')
WHERE category_id = 8 AND name ILIKE ANY (ARRAY['%shampoo%', '%hair%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 8 AND name = 'Oral Care')
WHERE category_id = 8 AND name ILIKE ANY (ARRAY['%toothpaste%', '%colgate%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 8 AND name = 'Face Care')
WHERE category_id = 8 AND name ILIKE ANY (ARRAY['%face%', '%wash%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 8 AND name = 'Shaving & Grooming')
WHERE category_id = 8 AND name ILIKE ANY (ARRAY['%razor%', '%shave%', '%gillette%']);

-- Baby Products
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 9 AND name = 'Diapers & Wipes')
WHERE category_id = 9 AND name ILIKE ANY (ARRAY['%diaper%', '%wipes%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 9 AND name = 'Baby Food & Formula')
WHERE category_id = 9 AND name ILIKE ANY (ARRAY['%cereal%', '%formula%', '%cerelac%', '%enfamil%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 9 AND name = 'Baby Skincare')
WHERE category_id = 9 AND name ILIKE ANY (ARRAY['%powder%', '%lotion%', '%cream%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 9 AND name = 'Other Baby Essentials')
WHERE category_id = 9 AND subcategory_id IS NULL;

-- Pet Supplies
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 10 AND name = 'Dog Food & Treats')
WHERE category_id = 10 AND name ILIKE ANY (ARRAY['%dog%', '%pedigree%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 10 AND name = 'Cat Food & Litter')
WHERE category_id = 10 AND name ILIKE ANY (ARRAY['%cat%', '%whiskas%', '%litter%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 10 AND name = 'Pet Accessories')
WHERE category_id = 10 AND name ILIKE ANY (ARRAY['%collar%', '%toy%', '%accessory%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 10 AND name = 'Other Pet Supplies')
WHERE category_id = 10 AND subcategory_id IS NULL;

-- =====================
-- Subcategories for categories 11-15
-- =====================

-- Breakfast & Cereal (category_id = 11)
INSERT INTO subcategories (category_id, name) VALUES
  (11, 'Cereals & Flakes'),
  (11, 'Oats & Porridge'),
  (11, 'Spreads & Mixes'),
  (11, 'Breakfast Snacks');

-- Condiments & Sauces (category_id = 12)
INSERT INTO subcategories (category_id, name) VALUES
  (12, 'Ketchup & Sauces'),
  (12, 'Mayonnaise & Dressings'),
  (12, 'Chutneys & Pickles'),
  (12, 'Mustard & Specialty Sauces');

-- Canned & Packaged Foods (category_id = 13)
INSERT INTO subcategories (category_id, name) VALUES
  (13, 'Canned Vegetables & Beans'),
  (13, 'Ready to Eat Meals'),
  (13, 'Honey & Spreads'),
  (13, 'Condensed & Evaporated Milk');

-- Health Foods & Supplements (category_id = 14)
INSERT INTO subcategories (category_id, name) VALUES
  (14, 'Protein & Nutrition Powders'),
  (14, 'Herbal & Ayurvedic'),
  (14, 'Health Drinks'),
  (14, 'Supplements & Others');

-- Home & Kitchen (category_id = 15)
INSERT INTO subcategories (category_id, name) VALUES
  (15, 'Cookware & Bakeware'),
  (15, 'Kitchen Appliances'),
  (15, 'Tableware & Storage'),
  (15, 'Home Essentials');

-- Assign products to subcategories (examples)
-- Breakfast & Cereal
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 11 AND name = 'Cereals & Flakes')
WHERE category_id = 11 AND name ILIKE ANY (ARRAY['%corn flakes%', '%flakes%', '%cereal%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 11 AND name = 'Oats & Porridge')
WHERE category_id = 11 AND name ILIKE ANY (ARRAY['%oats%', '%porridge%', '%masala oats%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 11 AND name = 'Spreads & Mixes')
WHERE category_id = 11 AND name ILIKE ANY (ARRAY['%nutella%', '%spread%', '%mix%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 11 AND name = 'Breakfast Snacks')
WHERE category_id = 11 AND subcategory_id IS NULL;

-- Condiments & Sauces
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 12 AND name = 'Ketchup & Sauces')
WHERE category_id = 12 AND name ILIKE ANY (ARRAY['%ketchup%', '%sauce%', '%schezwan%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 12 AND name = 'Mayonnaise & Dressings')
WHERE category_id = 12 AND name ILIKE ANY (ARRAY['%mayonnaise%', '%hellmanns%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 12 AND name = 'Chutneys & Pickles')
WHERE category_id = 12 AND name ILIKE ANY (ARRAY['%chutney%', '%pickle%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 12 AND name = 'Mustard & Specialty Sauces')
WHERE category_id = 12 AND name ILIKE ANY (ARRAY['%mustard%']);

-- Canned & Packaged Foods
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 13 AND name = 'Canned Vegetables & Beans')
WHERE category_id = 13 AND name ILIKE ANY (ARRAY['%baked beans%', '%canned%', '%corn%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 13 AND name = 'Ready to Eat Meals')
WHERE category_id = 13 AND name ILIKE ANY (ARRAY['%ready to eat%', '%dal makhani%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 13 AND name = 'Honey & Spreads')
WHERE category_id = 13 AND name ILIKE ANY (ARRAY['%honey%', '%spread%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 13 AND name = 'Condensed & Evaporated Milk')
WHERE category_id = 13 AND name ILIKE ANY (ARRAY['%milkmaid%', '%condensed%']);

-- Health Foods & Supplements
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 14 AND name = 'Protein & Nutrition Powders')
WHERE category_id = 14 AND name ILIKE ANY (ARRAY['%protein%', '%powder%', '%weight gainer%', '%pro%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 14 AND name = 'Herbal & Ayurvedic')
WHERE category_id = 14 AND name ILIKE ANY (ARRAY['%ashwagandha%', '%chyawanprash%', '%herbal%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 14 AND name = 'Health Drinks')
WHERE category_id = 14 AND name ILIKE ANY (ARRAY['%health drink%', '%bournvita%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 14 AND name = 'Supplements & Others')
WHERE category_id = 14 AND subcategory_id IS NULL;

-- Home & Kitchen
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 15 AND name = 'Cookware & Bakeware')
WHERE category_id = 15 AND name ILIKE ANY (ARRAY['%cookware%', '%pressure cooker%', '%tawa%', '%bakeware%', '%gasket%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 15 AND name = 'Kitchen Appliances')
WHERE category_id = 15 AND name ILIKE ANY (ARRAY['%bottle%', '%glassware%', '%appliance%', '%utensil%', '%kitchen%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 15 AND name = 'Tableware & Storage')
WHERE category_id = 15 AND name ILIKE ANY (ARRAY['%dinner set%', '%table%', '%storage%', '%container%', '%set%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 15 AND name = 'Home Essentials')
WHERE category_id = 15 AND subcategory_id IS NULL;

-- =====================
-- Subcategories for categories 16-20
-- =====================

-- Electronics (category_id = 16)
INSERT INTO subcategories (category_id, name) VALUES
  (16, 'Smartphones'),
  (16, 'Tablets'),
  (16, 'Televisions'),
  (16, 'Audio Devices'),
  (16, 'Other Electronics');

-- Computer Accessories (category_id = 17)
INSERT INTO subcategories (category_id, name) VALUES
  (17, 'Keyboards & Mice'),
  (17, 'Storage Devices'),
  (17, 'PC Components'),
  (17, 'Peripherals & Accessories');

-- Smart Devices (category_id = 18)
INSERT INTO subcategories (category_id, name) VALUES
  (18, 'Smartwatches & Bands'),
  (18, 'Smart Speakers'),
  (18, 'Home Automation'),
  (18, 'Other Smart Devices');

-- Gaming (category_id = 19)
INSERT INTO subcategories (category_id, name) VALUES
  (19, 'Consoles'),
  (19, 'Games'),
  (19, 'Controllers & Accessories'),
  (19, 'Gaming Peripherals');

-- Home Appliances (category_id = 20)
INSERT INTO subcategories (category_id, name) VALUES
  (20, 'Washing Machines'),
  (20, 'Refrigerators'),
  (20, 'Air Conditioners'),
  (20, 'Kitchen Appliances'),
  (20, 'Other Appliances');

-- Assign products to subcategories (examples)
-- Electronics
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 16 AND name = 'Smartphones')
WHERE category_id = 16 AND name ILIKE ANY (ARRAY['%iphone%', '%samsung%', '%oneplus%', '%redmi%', '%pixel%', '%vivo%', '%oppo%', '%nothing phone%', '%poco%', '%motorola%', '%realme%', '%honor%', '%iqoo%', '%infinix%', '%tecno%', '%asus%', '%black shark%', '%nubia%', '%cmf phone%', '%lava%', '%micromax%', '%jio phone%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 16 AND name = 'Tablets')
WHERE category_id = 16 AND name ILIKE ANY (ARRAY['%ipad%', '%tab%', '%tablet%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 16 AND name = 'Televisions')
WHERE category_id = 16 AND name ILIKE ANY (ARRAY['%tv%', '%bravia%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 16 AND name = 'Audio Devices')
WHERE category_id = 16 AND name ILIKE ANY (ARRAY['%speaker%', '%soundbar%', '%headphone%', '%earphone%', '%audio%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 16 AND name = 'Other Electronics')
WHERE category_id = 16 AND subcategory_id IS NULL;

-- Computer Accessories
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 17 AND name = 'Keyboards & Mice')
WHERE category_id = 17 AND name ILIKE ANY (ARRAY['%keyboard%', '%mouse%', '%trackpad%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 17 AND name = 'Storage Devices')
WHERE category_id = 17 AND name ILIKE ANY (ARRAY['%hdd%', '%ssd%', '%pendrive%', '%flash drive%', '%storage%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 17 AND name = 'PC Components')
WHERE category_id = 17 AND name ILIKE ANY (ARRAY['%processor%', '%ram%', '%motherboard%', '%graphics card%', '%cooler%', '%psu%', '%cabinet%', '%power supply%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 17 AND name = 'Peripherals & Accessories')
WHERE category_id = 17 AND subcategory_id IS NULL;

-- Smart Devices
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 18 AND name = 'Smartwatches & Bands')
WHERE category_id = 18 AND name ILIKE ANY (ARRAY['%watch%', '%band%', '%fitbit%', '%garmin%', '%amazfit%', '%realme watch%', '%noise%', '%oneplus band%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 18 AND name = 'Smart Speakers')
WHERE category_id = 18 AND name ILIKE ANY (ARRAY['%speaker%', '%echo%', '%nest%', '%sonos%', '%jbl%', '%sony srs%', '%marshall%', '%boat%', '%soundbar%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 18 AND name = 'Home Automation')
WHERE category_id = 18 AND name ILIKE ANY (ARRAY['%bulb%', '%plug%', '%lock%', '%doorbell%', '%thermostat%', '%vacuum%', '%camera%', '%sensor%', '%hue%', '%kasa%', '%wyze%', '%ecobee%', '%arlo%', '%august%', '%wemo%', '%tile%', '%tracker%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 18 AND name = 'Other Smart Devices')
WHERE category_id = 18 AND subcategory_id IS NULL;

-- Gaming
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 19 AND name = 'Consoles')
WHERE category_id = 19 AND name ILIKE ANY (ARRAY['%playstation%', '%xbox%', '%nintendo%', '%steam deck%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 19 AND name = 'Games')
WHERE category_id = 19 AND name ILIKE ANY (ARRAY['%game%', '%gta%', '%call of duty%', '%cyberpunk%', '%spider-man%', '%halo%', '%fifa%', '%zelda%', '%mario%', '%kart%', '%tt set%', '%cricket%', '%football%', '%badminton%', '%tennis%', '%basketball%', '%volleyball%', '%running%', '%shoes%', '%watch%', '%kit%', '%set%', '%collection%', '%bundle%', '%subscription%', '%guide%', '%atlas%', '%encyclopedia%', '%dictionary%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 19 AND name = 'Controllers & Accessories')
WHERE category_id = 19 AND name ILIKE ANY (ARRAY['%controller%', '%keyboard%', '%mouse%', '%headset%', '%microphone%', '%monitor%', '%chair%', '%desk%', '%capture card%', '%stream deck%', '%pad%', '%stand%', '%hub%', '%powerbank%', '%cable%', '%adapter%', '%case%', '%charger%', '%battery%', '%speaker%', '%soundbar%', '%camera%', '%sensor%', '%lock%', '%doorbell%', '%thermostat%', '%vacuum%', '%tracker%', '%tile%', '%wemo%', '%plug%', '%bulb%', '%hue%', '%kasa%', '%wyze%', '%ecobee%', '%arlo%', '%august%', '%wemo%', '%tile%', '%tracker%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 19 AND name = 'Gaming Peripherals')
WHERE category_id = 19 AND subcategory_id IS NULL;

-- Home Appliances
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 20 AND name = 'Washing Machines')
WHERE category_id = 20 AND name ILIKE ANY (ARRAY['%washing machine%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 20 AND name = 'Refrigerators')
WHERE category_id = 20 AND name ILIKE ANY (ARRAY['%fridge%', '%refrigerator%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 20 AND name = 'Air Conditioners')
WHERE category_id = 20 AND name ILIKE ANY (ARRAY['%ac%', '%air conditioner%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 20 AND name = 'Kitchen Appliances')
WHERE category_id = 20 AND name ILIKE ANY (ARRAY['%microwave%', '%mixer%', '%grinder%', '%juicer%', '%blender%', '%toaster%', '%induction%', '%chimney%', '%stove%', '%heater%', '%purifier%', '%fan%', '%vacuum%', '%rice cooker%', '%water heater%', '%geyser%', '%dishwasher%', '%freezer%', '%sewing machine%', '%food processor%', '%hand blender%', '%oven%', '%cooktop%', '%cooler%', '%stabilizer%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 20 AND name = 'Other Appliances')
WHERE category_id = 20 AND subcategory_id IS NULL;

-- =====================
-- Subcategories for categories 21-27
-- =====================

-- Clothing & Fashion (category_id = 21)
INSERT INTO subcategories (category_id, name) VALUES
  (21, 'Men''s Clothing'),
  (21, 'Women''s Clothing'),
  (21, 'Unisex & Kids'),
  (21, 'Footwear & Accessories');

-- TV & Entertainment (category_id = 22)
INSERT INTO subcategories (category_id, name) VALUES
  (22, 'Televisions'),
  (22, 'Streaming Devices'),
  (22, 'Speakers & Soundbars'),
  (22, 'Other Entertainment');

-- Books & Media (category_id = 23)
INSERT INTO subcategories (category_id, name) VALUES
  (23, 'Books'),
  (23, 'Magazines & Newspapers'),
  (23, 'Music & Movies'),
  (23, 'Digital & Subscriptions');

-- Sports & Fitness (category_id = 24)
INSERT INTO subcategories (category_id, name) VALUES
  (24, 'Fitness Equipment'),
  (24, 'Sports Gear'),
  (24, 'Footwear & Apparel'),
  (24, 'Accessories');

-- Beauty & Personal Care (category_id = 25)
INSERT INTO subcategories (category_id, name) VALUES
  (25, 'Makeup'),
  (25, 'Skincare'),
  (25, 'Hair Care'),
  (25, 'Personal Hygiene'),
  (25, 'Beauty Tools');

-- Home & Kitchen (category_id = 26)
INSERT INTO subcategories (category_id, name) VALUES
  (26, 'Cookware & Bakeware'),
  (26, 'Kitchen Appliances'),
  (26, 'Tableware & Storage'),
  (26, 'Home Essentials');

-- Automotive (category_id = 27)
INSERT INTO subcategories (category_id, name) VALUES
  (27, 'Car Accessories'),
  (27, 'Car Care & Maintenance'),
  (27, 'Electronics & Gadgets'),
  (27, 'Other Automotive');

-- Assign products to subcategories (examples)
-- Clothing & Fashion
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 21 AND name = 'Men''s Clothing')
WHERE category_id = 21 AND name ILIKE ANY (ARRAY['%men%', '%jeans%', '%shirt%', '%t-shirt%', '%polo%', '%trousers%', '%chinos%', '%kurta%', '%blazer%', '%suit%', '%shorts%', '%track%', '%cargo%', '%underwear%', '%sweater%', '%joggers%', '%formal%', '%regular fit%', '%skinny fit%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 21 AND name = 'Women''s Clothing')
WHERE category_id = 21 AND name ILIKE ANY (ARRAY['%women%', '%dress%', '%skirt%', '%blouse%', '%top%', '%palazzo%', '%jumpsuit%', '%kurti%', '%salwar%', '%ethnic%', '%maxi%', '%crop%', '%a-line%', '%party wear%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 21 AND name = 'Unisex & Kids')
WHERE category_id = 21 AND name ILIKE ANY (ARRAY['%kids%', '%unisex%', '%h&m%', '%zara%', '%uniqlo%', '%lifestyle%', '%flying machine%', '%aurelia%', '%biba%', '%marks & spencer%', '%forever 21%', '%only%', '%vero moda%', '%lee cooper%', '%global desi%', '%and%', '%max fashion%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 21 AND name = 'Footwear & Accessories')
WHERE category_id = 21 AND name ILIKE ANY (ARRAY['%shoes%', '%footwear%', '%bag%', '%belt%', '%cap%', '%socks%', '%accessory%']) OR subcategory_id IS NULL;

-- TV & Entertainment
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 22 AND name = 'Televisions')
WHERE category_id = 22 AND name ILIKE ANY (ARRAY['%tv%', '%oled%', '%qled%', '%bravia%', '%led%', '%fire tv%', '%android tv%', '%uhd%', '%smart tv%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 22 AND name = 'Streaming Devices')
WHERE category_id = 22 AND name ILIKE ANY (ARRAY['%fire stick%', '%chromecast%', '%roku%', '%apple tv%', '%mi box%', '%nvidia shield%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 22 AND name = 'Speakers & Soundbars')
WHERE category_id = 22 AND name ILIKE ANY (ARRAY['%soundbar%', '%speaker%', '%bluetooth%', '%multimedia%', '%audio%', '%cinema%', '%jbl%', '%sony%', '%yamaha%', '%boat%', '%zebronics%', '%f&d%', '%creative%', '%logitech%', '%philips%', '%panasonic%', '%blaupunkt%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 22 AND name = 'Other Entertainment')
WHERE category_id = 22 AND subcategory_id IS NULL;

-- Books & Media
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 23 AND name = 'Books')
WHERE category_id = 23 AND name ILIKE ANY (ARRAY['%book%', '%novel%', '%guide%', '%encyclopedia%', '%atlas%', '%dictionary%', '%collection%', '%set%', '%alchemist%', '%atomic habits%', '%rich dad%', '%think and grow%', '%sapiens%', '%wings of fire%', '%ikigai%', '%harry potter%', '%subtle art%', '%python%', '%jee%', '%neet%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 23 AND name = 'Magazines & Newspapers')
WHERE category_id = 23 AND name ILIKE ANY (ARRAY['%magazine%', '%newspaper%', '%national geographic%', '%india today%', '%the hindu%', '%champak%', '%amar chitra%', '%tinkle%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 23 AND name = 'Music & Movies')
WHERE category_id = 23 AND name ILIKE ANY (ARRAY['%music%', '%movie%', '%audiobook%', '%audible%', '%spotify%', '%netflix%', '%prime video%', '%hotstar%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 23 AND name = 'Digital & Subscriptions')
WHERE category_id = 23 AND subcategory_id IS NULL;

-- Sports & Fitness
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 24 AND name = 'Fitness Equipment')
WHERE category_id = 24 AND name ILIKE ANY (ARRAY['%treadmill%', '%dumbbell%', '%yoga mat%', '%elliptical%', '%cycle%', '%bench press%', '%barbell%', '%roller%', '%kettlebell%', '%ab roller%', '%pull up%', '%push up%', '%exercise ball%', '%ladder%', '%trainer%', '%equipment%', '%bag%', '%shaker%', '%bottle%', '%gloves%', '%rope%', '%ball%', '%gear%', '%kit%', '%set%', '%accessory%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 24 AND name = 'Sports Gear')
WHERE category_id = 24 AND name ILIKE ANY (ARRAY['%cricket%', '%football%', '%badminton%', '%tennis%', '%basketball%', '%volleyball%', '%swimming%', '%goggles%', '%bat%', '%racket%', '%spalding%', '%mikasa%', '%wilson%', '%nike%', '%puma%', '%adidas%', '%garmin%', '%shoes%', '%watch%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 24 AND name = 'Footwear & Apparel')
WHERE category_id = 24 AND name ILIKE ANY (ARRAY['%shoes%', '%apparel%', '%clothing%', '%t-shirt%', '%track%', '%pants%', '%shorts%', '%joggers%', '%socks%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 24 AND name = 'Accessories')
WHERE category_id = 24 AND subcategory_id IS NULL;

-- Beauty & Personal Care
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 25 AND name = 'Makeup')
WHERE category_id = 25 AND name ILIKE ANY (ARRAY['%foundation%', '%mascara%', '%lipstick%', '%cream%', '%serum%', '%sunscreen%', '%concealer%', '%powder%', '%palette%', '%blush%', '%eyeliner%', '%primer%', '%makeup%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 25 AND name = 'Skincare')
WHERE category_id = 25 AND name ILIKE ANY (ARRAY['%moisturizer%', '%lotion%', '%face wash%', '%face%', '%toner%', '%soap%', '%bar%', '%body wash%', '%scrub%', '%mask%', '%oil%', '%herbal%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 25 AND name = 'Hair Care')
WHERE category_id = 25 AND name ILIKE ANY (ARRAY['%shampoo%', '%hair%', '%conditioner%', '%oil%', '%serum%', '%dryer%', '%comb%', '%brush%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 25 AND name = 'Personal Hygiene')
WHERE category_id = 25 AND name ILIKE ANY (ARRAY['%deodorant%', '%razor%', '%shaver%', '%grooming%', '%hygiene%', '%sanitary%', '%removal%', '%antiseptic%', '%hand wash%', '%hand%', '%wipes%', '%toothpaste%', '%colgate%', '%old spice%', '%gillette%', '%veet%', '%dettol%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 25 AND name = 'Beauty Tools')
WHERE category_id = 25 AND subcategory_id IS NULL;

-- Home & Kitchen (category_id = 26)
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 26 AND name = 'Cookware & Bakeware')
WHERE category_id = 26 AND name ILIKE ANY (ARRAY['%cookware%', '%pressure cooker%', '%bakeware%', '%knife%', '%blender%', '%toaster%', '%rice cooker%', '%coffee maker%', '%iron%', '%steam iron%', '%food processor%', '%chopping board%', '%kettle%', '%oven%', '%mixer%', '%grinder%', '%juicer%', '%microwave%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 26 AND name = 'Kitchen Appliances')
WHERE category_id = 26 AND name ILIKE ANY (ARRAY['%appliance%', '%vacuum%', '%lamp%', '%fan%', '%heater%', '%air fryer%', '%sofa%', '%dining table%', '%wardrobe%', '%bookshelf%', '%table lamp%', '%floor lamp%', '%stove%', '%chimney%', '%dishwasher%', '%freezer%', '%sewing machine%', '%hand blender%', '%oven%', '%cooktop%', '%cooler%', '%stabilizer%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 26 AND name = 'Tableware & Storage')
WHERE category_id = 26 AND name ILIKE ANY (ARRAY['%dinner set%', '%table%', '%storage%', '%container%', '%set%', '%glassware%', '%mirror%', '%curtain%', '%mat%', '%clock%', '%trash%', '%bin%', '%can%', '%wardrobe%', '%bookshelf%', '%shelf%', '%rack%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 26 AND name = 'Home Essentials')
WHERE category_id = 26 AND subcategory_id IS NULL;

-- Automotive (category_id = 27)
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 27 AND name = 'Car Accessories')
WHERE category_id = 27 AND name ILIKE ANY (ARRAY['%seat cover%', '%dashboard%', '%phone holder%', '%floor mat%', '%steering%', '%tool kit%', '%organizer%', '%cover%', '%sunshade%', '%car charger%', '%car vacuum%', '%car perfume%', '%car bluetooth%', '%car led%', '%car polish%', '%car wax%', '%car sunshade%', '%car tool%', '%car organizer%', '%car bluetooth%', '%car led%', '%car polish%', '%car wax%', '%car sunshade%', '%car tool%', '%car organizer%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 27 AND name = 'Car Care & Maintenance')
WHERE category_id = 27 AND name ILIKE ANY (ARRAY['%engine oil%', '%brake fluid%', '%coolant%', '%battery%', '%tire%', '%transmission fluid%', '%washer fluid%', '%spark plug%', '%air filter%', '%fluid%', '%cleaner%', '%shine%', '%repair kit%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 27 AND name = 'Electronics & Gadgets')
WHERE category_id = 27 AND name ILIKE ANY (ARRAY['%camera%', '%dash cam%', '%gps%', '%bluetooth%', '%speaker%', '%led%', '%light%', '%gadget%']);
UPDATE products SET subcategory_id = (SELECT subcategory_id FROM subcategories WHERE category_id = 27 AND name = 'Other Automotive')
WHERE category_id = 27 AND subcategory_id IS NULL; 