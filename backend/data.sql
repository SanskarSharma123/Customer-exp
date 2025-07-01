-- Insert sample users
INSERT INTO users (name, email, password, phone, is_admin) VALUES
('Admin User', 'admin@quickcommerce.com', '$2b$10$LKg1cUpCgqTqIEFyZP8e9eR0MRGTLTfXe1VUY5DM6KTbYMzzw8Icu', '9876543210', TRUE), -- password: admin123
('John Doe', 'john@example.com', '$2b$10$LKg1cUpCgqTqIEFyZP8e9eR0MRGTLTfXe1VUY5DM6KTbYMzzw8Icu', '8765432109', FALSE), -- password: password123
('Jane Smith', 'jane@example.com', '$2b$10$LKg1cUpCgqTqIEFyZP8e9eR0MRGTLTfXe1VUY5DM6KTbYMzzw8Icu', '7654321098', FALSE), -- password: password123
('Rahul Sharma', 'rahul@example.com', '$2b$10$LKg1cUpCgqTqIEFyZP8e9eR0MRGTLTfXe1VUY5DM6KTbYMzzw8Icu', '6543210987', FALSE); -- password: password123

-- Insert sample addresses
INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, is_default) VALUES
(2, '123 Main St', 'Apt 4B', 'Bangalore', 'Karnataka', '560001', TRUE),
(2, '456 Park Ave', 'Floor 2', 'Bangalore', 'Karnataka', '560002', FALSE),
(3, '789 Oak Dr', NULL, 'Mumbai', 'Maharashtra', '400001', TRUE),
(4, '321 Pine Rd', 'Block C', 'Delhi', 'Delhi', '110001', TRUE);

-- Insert expanded categories
INSERT INTO categories (name, description, image_url) VALUES
('Fruits & Vegetables', 'Fresh produce from local farms', '/images/categories/fruits-vegetables.jpg'),
('Dairy & Eggs', 'Fresh dairy products and eggs', '/images/categories/dairy-eggs.jpg'),
('Bakery', 'Fresh bread and bakery items', '/images/categories/bakery.jpg'),
('Snacks & Beverages', 'Chips, cookies, soft drinks and more', '/images/categories/snacks-beverages.jpg'),
('Household', 'Cleaning and household essentials', '/images/categories/household.jpg'),
('Meat & Seafood', 'Fresh meat and seafood products', '/images/categories/meat-seafood.jpg'),
('Frozen Foods', 'Frozen meals, vegetables, and desserts', '/images/categories/frozen-foods.jpg'),
('Personal Care', 'Hygiene and beauty products', '/images/categories/personal-care.jpg'),
('Baby Products', 'Diapers, baby food, and baby care items', '/images/categories/baby-products.jpg'),
('Pet Supplies', 'Food and accessories for pets', '/images/categories/pet-supplies.jpg'),
('Breakfast & Cereal', 'Breakfast foods and cereals', '/images/categories/breakfast-cereal.jpg'),
('Condiments & Sauces', 'Ketchup, mayonnaise, and other condiments', '/images/categories/condiments-sauces.jpg'),
('Canned & Packaged Foods', 'Canned vegetables, soups, and other packaged foods', '/images/categories/canned-packaged.jpg'),
('Health Foods & Supplements', 'Nutritional supplements and health foods', '/images/categories/health-supplements.jpg'),
('Home & Kitchen', 'Kitchen utensils and home accessories', '/images/categories/home-kitchen.jpg'),
('Electronics', 'Smartphones, tablets, TVs and more', '/images/categories/electronics.jpg'),
('Computer Accessories', 'Keyboards, mice, storage and peripherals', '/images/categories/computer-accessories.jpg'),
('Smart Devices', 'Wearables, smart speakers, and more', '/images/categories/smart-devices.jpg'),
('Gaming', 'Consoles, accessories and games', '/images/categories/gaming.jpg'),
('Home Appliances', 'Washing machines, ACs, microwaves, etc.', '/images/categories/home-appliances.jpg'),
('Clothing & Fashion', 'Men, women and kids clothing', '/images/categories/clothing.jpg'),
('TV & Entertainment', 'TVs, streaming devices, speakers', '/images/categories/tv-entertainment.jpg'),
('Books & Media', 'Books, magazines, music and movies', '/images/categories/books-media.jpg'),
('Sports & Fitness', 'Exercise equipment, sports gear', '/images/categories/sports-fitness.jpg'),
('Beauty & Personal Care', 'Skincare, makeup, grooming products', '/images/categories/beauty-care.jpg'),
('Home & Kitchen', 'Cookware, home decor, furniture', '/images/categories/home-kitchen.jpg'),
('Automotive', 'Car accessories, tools, maintenance', '/images/categories/automotive.jpg');
-- Insert detailed products - Fruits & Vegetables
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Shimla Red Apples', 'Premium Shimla red apples, sweet and juicy', 120.00, 99.00, 1, '/images/products/shimla-apples.jpg', 100, 'kg', TRUE),
('Robusta Bananas', 'Organically grown yellow Robusta bananas', 80.00, 69.00, 1, '/images/products/robusta-bananas.jpg', 150, 'dozen', FALSE),
('Baby Spinach', 'Fresh tender baby spinach leaves', 40.00, 35.00, 1, '/images/products/baby-spinach.jpg', 75, 'bunch', FALSE),
('Roma Tomatoes', 'Fresh red Roma tomatoes', 60.00, 55.00, 1, '/images/products/roma-tomatoes.jpg', 120, 'kg', TRUE),
('Alphonso Mangoes', 'Sweet and fragrant Alphonso mangoes', 350.00, 320.00, 1, '/images/products/alphonso-mangoes.jpg', 50, 'kg', TRUE),
('Green Capsicum', 'Fresh green bell peppers', 80.00, 70.00, 1, '/images/products/green-capsicum.jpg', 90, 'kg', FALSE),
('Cavendish Bananas', 'Sweet yellow Cavendish bananas', 70.00, 65.00, 1, '/images/products/cavendish-bananas.jpg', 100, 'kg', FALSE),
('Kashmiri Onions', 'Medium-sized red Kashmiri onions', 40.00, 35.00, 1, '/images/products/kashmiri-onions.jpg', 150, 'kg', TRUE),
('Green Grapes', 'Seedless green grapes', 120.00, 100.00, 1, '/images/products/green-grapes.jpg', 80, 'kg', FALSE),
('Kiwi Fruit', 'Imported green kiwi fruits', 180.00, 160.00, 1, '/images/products/kiwi.jpg', 60, 'pack of 6', FALSE),
('Lady Finger Okra', 'Fresh green lady finger okra', 60.00, 50.00, 1, '/images/products/okra.jpg', 70, '500g', FALSE),
('Brinjal', 'Purple round brinjal/eggplant', 50.00, 45.00, 1, '/images/products/brinjal.jpg', 80, 'kg', FALSE),
('Ooty Carrots', 'Fresh Ooty carrots with greens', 60.00, 50.00, 1, '/images/products/ooty-carrots.jpg', 90, 'kg', TRUE),
('Coconut', 'Fresh whole coconut', 40.00, 35.00, 1, '/images/products/coconut.jpg', 100, 'piece', FALSE),
('Ginger', 'Fresh ginger root', 120.00, 100.00, 1, '/images/products/ginger.jpg', 40, 'kg', FALSE),
('Garlic', 'Fresh garlic bulbs', 140.00, 120.00, 1, '/images/products/garlic.jpg', 50, 'kg', FALSE),
('Green Chilli', 'Spicy green chillies', 80.00, 70.00, 1, '/images/products/green-chilli.jpg', 60, '250g', FALSE),
('Coriander', 'Fresh coriander leaves', 30.00, 25.00, 1, '/images/products/coriander.jpg', 80, 'bunch', FALSE),
('Mint Leaves', 'Fresh mint leaves', 30.00, 25.00, 1, '/images/products/mint.jpg', 70, 'bunch', FALSE),
('Cherry Tomatoes', 'Sweet red cherry tomatoes', 90.00, 80.00, 1, '/images/products/cherry-tomatoes.jpg', 60, '250g', TRUE),
('Cucumber', 'Fresh green cucumber', 40.00, 35.00, 1, '/images/products/cucumber.jpg', 100, 'kg', FALSE),
('Sweet Potato', 'Fresh orange sweet potatoes', 60.00, 50.00, 1, '/images/products/sweet-potato.jpg', 80, 'kg', FALSE),
('Cauliflower', 'Fresh white cauliflower head', 40.00, 35.00, 1, '/images/products/cauliflower.jpg', 50, 'piece', FALSE),
('Cabbage', 'Fresh green cabbage head', 30.00, 25.00, 1, '/images/products/cabbage.jpg', 60, 'piece', FALSE),
('Royal Gala Apples', 'Sweet and crisp Royal Gala apples', 220.00, 200.00, 1, '/images/products/royal-gala-apples.jpg', 70, 'kg', TRUE),
('Washington Apples', 'Imported Washington red apples', 250.00, 230.00, 1, '/images/products/washington-apples.jpg', 50, 'kg', FALSE),
('Mosambi (Sweet Lime)', 'Juicy sweet lime fruits', 80.00, 75.00, 1, '/images/products/mosambi.jpg', 80, 'kg', FALSE),
('Avocado', 'Imported Hass avocados', 320.00, 300.00, 1, '/images/products/avocado.jpg', 30, 'piece', TRUE),
('Watermelon', 'Sweet and juicy watermelon', 120.00, 100.00, 1, '/images/products/watermelon.jpg', 40, 'piece', FALSE),
('Pomegranate', 'Fresh red pomegranates', 180.00, 160.00, 1, '/images/products/pomegranate.jpg', 60, 'kg', TRUE);

-- Insert detailed products - Dairy & Eggs
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Amul Full Cream Milk', 'Fresh whole milk from Amul', 70.00, 65.00, 2, '/images/products/amul-milk.jpg', 80, 'liter', TRUE),
('Farm Fresh Brown Eggs', 'Farm fresh brown eggs', 90.00, 80.00, 2, '/images/products/brown-eggs.jpg', 100, 'dozen', FALSE),
('Amul Butter', 'Unsalted Amul butter', 55.00, 50.00, 2, '/images/products/amul-butter.jpg', 60, '500g', FALSE),
('Nestle Dahi', 'Natural yogurt from Nestle', 40.00, 35.00, 2, '/images/products/nestle-dahi.jpg', 75, '400g', TRUE),
('Amul Cheese Slices', 'Processed cheese slices', 120.00, 110.00, 2, '/images/products/amul-cheese-slices.jpg', 50, 'pack of 10', TRUE),
('Mother Dairy Paneer', 'Fresh cottage cheese block', 80.00, 75.00, 2, '/images/products/mother-dairy-paneer.jpg', 60, '200g', FALSE),
('Amul Masti Buttermilk', 'Spiced buttermilk', 30.00, 25.00, 2, '/images/products/amul-buttermilk.jpg', 100, '1L', FALSE),
('Britannia Cheese Spread', 'Creamy cheese spread', 95.00, 90.00, 2, '/images/products/britannia-cheese-spread.jpg', 40, '200g', TRUE),
('Amul Gold Milk', 'Standardized milk', 65.00, 60.00, 2, '/images/products/amul-gold.jpg', 90, '1L', FALSE),
('Go Cheese Cubes', 'Processed cheese cubes', 110.00, 100.00, 2, '/images/products/go-cheese-cubes.jpg', 50, '200g', FALSE),
('Farm Fresh White Eggs', 'Farm fresh white eggs', 85.00, 80.00, 2, '/images/products/white-eggs.jpg', 100, 'dozen', TRUE),
('Mother Dairy Lassi', 'Sweet punjabi lassi', 35.00, 30.00, 2, '/images/products/mother-dairy-lassi.jpg', 80, '200ml', FALSE),
('Amul Kool Milkshake', 'Chocolate milkshake', 30.00, 25.00, 2, '/images/products/amul-kool.jpg', 100, '200ml', FALSE),
('Nestle A+ Slim Milk', 'Low fat milk', 75.00, 70.00, 2, '/images/products/nestle-slim.jpg', 60, '1L', TRUE),
('Mother Dairy Curd', 'Fresh curd', 45.00, 40.00, 2, '/images/products/mother-dairy-curd.jpg', 70, '500g', FALSE),
('Amul Ice Cream - Vanilla', 'Classic vanilla ice cream', 150.00, 140.00, 2, '/images/products/amul-vanilla.jpg', 40, '1L', TRUE),
('Amul Ice Cream - Chocolate', 'Rich chocolate ice cream', 160.00, 150.00, 2, '/images/products/amul-chocolate.jpg', 40, '1L', FALSE),
('Britannia Choco Block', 'Chocolate block', 60.00, 55.00, 2, '/images/products/britannia-choco.jpg', 50, '100g', FALSE),
('Amul Fresh Cream', 'Whipping cream', 70.00, 65.00, 2, '/images/products/amul-cream.jpg', 60, '200ml', FALSE),
('Go Cheese Spread', 'Cheese spread', 80.00, 75.00, 2, '/images/products/go-cheese-spread.jpg', 40, '200g', FALSE),
('Amul Chocolate Milk', 'Ready-to-drink chocolate milk', 35.00, 30.00, 2, '/images/products/amul-chocolate-milk.jpg', 80, '200ml', TRUE),
('Verka Ghee', 'Pure cow ghee', 550.00, 520.00, 2, '/images/products/verka-ghee.jpg', 30, '1L', FALSE),
('Quark Cheese', 'Fresh soft cheese', 150.00, 140.00, 2, '/images/products/quark.jpg', 20, '200g', FALSE),
('Mother Dairy Chaach', 'Spiced buttermilk', 25.00, 22.00, 2, '/images/products/mother-dairy-chaach.jpg', 100, '500ml', FALSE),
('Amul Taaza Toned Milk', 'Toned milk', 60.00, 58.00, 2, '/images/products/amul-taaza.jpg', 90, '1L', TRUE),
('Epic Free Range Eggs', 'Free-range eggs', 120.00, 110.00, 2, '/images/products/free-range-eggs.jpg', 50, 'dozen', FALSE),
('Amul Pro Protein Drink', 'High protein flavored milk', 45.00, 40.00, 2, '/images/products/amul-pro.jpg', 60, '200ml', TRUE),
('Amul Lactose-Free Milk', 'Lactose-free milk', 85.00, 80.00, 2, '/images/products/lactose-free.jpg', 40, '1L', FALSE),
('Mother Dairy Low Fat Dahi', 'Low fat yogurt', 50.00, 45.00, 2, '/images/products/low-fat-dahi.jpg', 60, '400g', FALSE),
('Amul Mithai Mate', 'Condensed milk', 65.00, 60.00, 2, '/images/products/mithai-mate.jpg', 50, '400g', TRUE);

-- Insert detailed products - Bakery
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Britannia Whole Wheat Bread', 'Freshly baked whole wheat bread', 45.00, 40.00, 3, '/images/products/britannia-bread.jpg', 50, 'loaf', TRUE),
('Britannia Croissants - Butter', 'Buttery croissants', 120.00, 110.00, 3, '/images/products/britannia-croissants.jpg', 40, 'pack of 6', FALSE),
('Parle Hide & Seek Cookies', 'Chocolate chip cookies', 80.00, 75.00, 3, '/images/products/hide-seek.jpg', 60, 'pack', TRUE),
('Monginis Cupcakes', 'Assorted cupcakes', 150.00, 140.00, 3, '/images/products/monginis-cupcakes.jpg', 30, 'pack of 6', FALSE),
('Modern Brown Bread', 'Fresh brown bread', 40.00, 38.00, 3, '/images/products/modern-brown.jpg', 60, 'loaf', FALSE),
('Britannia Pav', 'Soft pav buns', 30.00, 28.00, 3, '/images/products/britannia-pav.jpg', 70, 'pack of 6', TRUE),
('English Oven Multigrain Bread', 'Nutritious multigrain bread', 55.00, 50.00, 3, '/images/products/english-oven.jpg', 40, 'loaf', FALSE),
('Harvest Gold White Bread', 'Soft white bread', 35.00, 32.00, 3, '/images/products/harvest-gold.jpg', 60, 'loaf', FALSE),
('Monginis Black Forest Cake', 'Delicious black forest cake', 450.00, 420.00, 3, '/images/products/black-forest.jpg', 15, '1kg', TRUE),
('Britannia Milk Rusk', 'Crunchy milk rusk', 65.00, 60.00, 3, '/images/products/milk-rusk.jpg', 50, 'pack', FALSE),
('Parle Milano Cookies', 'Premium chocolate cookies', 95.00, 90.00, 3, '/images/products/milano.jpg', 40, 'pack', FALSE),
('Theobroma Brownies', 'Rich chocolate brownies', 220.00, 200.00, 3, '/images/products/brownies.jpg', 20, 'pack of 4', TRUE),
('Britannia Fruit Cake', 'Traditional fruit cake', 90.00, 85.00, 3, '/images/products/fruit-cake.jpg', 30, '250g', FALSE),
('Modern Burger Buns', 'Soft burger buns', 45.00, 40.00, 3, '/images/products/burger-buns.jpg', 50, 'pack of 4', TRUE),
('Britannia Cheese Garlic bread', 'Frozen garlic bread with cheese', 110.00, 100.00, 3, '/images/products/garlic-bread.jpg', 30, 'piece', FALSE),
('Parle G Biscuits', 'Classic glucose biscuits', 20.00, 18.00, 3, '/images/products/parle-g.jpg', 100, 'pack', FALSE),
('Britannia Marie Gold', 'Light tea biscuits', 30.00, 28.00, 3, '/images/products/marie-gold.jpg', 80, 'pack', FALSE),
('Karachi Bakery Fruit Biscuits', 'Famous fruit biscuits', 260.00, 240.00, 3, '/images/products/karachi-biscuits.jpg', 25, 'box', TRUE),
('Theobroma Dutch Truffle Cake', 'Premium chocolate cake', 650.00, 620.00, 3, '/images/products/dutch-truffle.jpg', 15, '500g', TRUE),
('Britannia Cakes - Chocolate', 'Small chocolate cakes', 20.00, 18.00, 3, '/images/products/britannia-cakes.jpg', 100, 'piece', FALSE),
('Bun Pao', 'Soft steamed buns', 30.00, 28.00, 3, '/images/products/bun-pao.jpg', 60, 'pack of 6', FALSE),
('Croissant - Almond', 'Buttery almond croissants', 140.00, 130.00, 3, '/images/products/almond-croissant.jpg', 30, 'pack of 4', TRUE),
('Muffins - Blueberry', 'Fresh blueberry muffins', 120.00, 110.00, 3, '/images/products/blueberry-muffins.jpg', 30, 'pack of 4', FALSE),
('Danish Pastry - Cheese', 'Cheese filled danish pastry', 140.00, 130.00, 3, '/images/products/cheese-danish.jpg', 25, 'pack of 4', FALSE),
('Doughnuts - Chocolate', 'Chocolate glazed doughnuts', 160.00, 150.00, 3, '/images/products/chocolate-doughnuts.jpg', 25, 'pack of 4', TRUE),
('Cinnamon Rolls', 'Fresh baked cinnamon rolls', 180.00, 170.00, 3, '/images/products/cinnamon-rolls.jpg', 20, 'pack of 4', FALSE),
('Cookies - Oatmeal Raisin', 'Healthy oatmeal raisin cookies', 120.00, 110.00, 3, '/images/products/oatmeal-cookies.jpg', 30, 'pack', FALSE),
('Brioche Bread', 'Rich buttery brioche bread', 90.00, 85.00, 3, '/images/products/brioche.jpg', 30, 'loaf', TRUE),
('Focaccia Bread', 'Italian herb focaccia', 120.00, 110.00, 3, '/images/products/focaccia.jpg', 25, 'piece', FALSE),
('Sourdough Bread', 'Artisanal sourdough bread', 150.00, 140.00, 3, '/images/products/sourdough.jpg', 20, 'loaf', TRUE);

-- Insert detailed products - Snacks & Beverages
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Lays Classic Salted', 'Classic salted potato chips', 50.00, 45.00, 4, '/images/products/lays-classic.jpg', 100, '165g', TRUE),
('Coca-Cola', 'Refreshing cola drink', 60.00, 55.00, 4, '/images/products/coca-cola.jpg', 120, '2L', FALSE),
('Haldirams Mixed Nuts', 'Assortment of premium nuts', 220.00, 200.00, 4, '/images/products/haldirams-nuts.jpg', 50, '500g', TRUE),
('Cadbury Dairy Milk', 'Milk chocolate bar', 80.00, 75.00, 4, '/images/products/dairy-milk.jpg', 80, '100g', FALSE),
('Pepsi', 'Refreshing cola beverage', 55.00, 50.00, 4, '/images/products/pepsi.jpg', 110, '2L', FALSE),
('Bingo! Tedhe Medhe', 'Spicy twisted snack', 20.00, 18.00, 4, '/images/products/tedhe-medhe.jpg', 120, '100g', TRUE),
('Lays Magic Masala', 'Spiced potato chips', 50.00, 48.00, 4, '/images/products/lays-magic.jpg', 100, '165g', FALSE),
('Haldiram Aloo Bhujia', 'Spicy potato noodle snack', 45.00, 42.00, 4, '/images/products/aloo-bhujia.jpg', 90, '200g', TRUE),
('Sprite', 'Lemon-lime flavored soft drink', 55.00, 50.00, 4, '/images/products/sprite.jpg', 100, '2L', FALSE),
('Kurkure Masala Munch', 'Crunchy masala flavored snack', 20.00, 18.00, 4, '/images/products/kurkure.jpg', 120, '100g', TRUE),
('Red Bull Energy Drink', 'Energy beverage', 110.00, 105.00, 4, '/images/products/red-bull.jpg', 60, '250ml', FALSE),
('Britannia Jim Jam Biscuits', 'Cream biscuits with jam center', 45.00, 42.00, 4, '/images/products/jim-jam.jpg', 80, 'pack', FALSE),
('Cadbury 5 Star', 'Chocolate caramel bar', 20.00, 18.00, 4, '/images/products/5-star.jpg', 120, '45g', FALSE),
('Act II Microwave Popcorn', 'Butter flavored popcorn', 80.00, 75.00, 4, '/images/products/act-ii.jpg', 50, '99g', TRUE),
('Thums Up', 'Strong cola drink', 60.00, 55.00, 4, '/images/products/thums-up.jpg', 100, '2L', FALSE),
('Bournvita', 'Malted chocolate drink', 220.00, 210.00, 4, '/images/products/bournvita.jpg', 40, '500g', TRUE),
('Haldirams Sev', 'Crispy gram flour snack', 40.00, 38.00, 4, '/images/products/haldirams-sev.jpg', 80, '200g', FALSE),
('Maaza Mango Drink', 'Mango fruit beverage', 35.00, 32.00, 4, '/images/products/maaza.jpg', 100, '600ml', FALSE),
('Uncle Chips', 'Spicy potato chips', 20.00, 18.00, 4, '/images/products/uncle-chips.jpg', 120, '100g', FALSE),
('Minute Maid Orange', 'Orange fruit beverage', 35.00, 32.00, 4, '/images/products/minute-maid.jpg', 90, '600ml', TRUE),
('Pringles Original', 'Original flavored potato crisps', 120.00, 110.00, 4, '/images/products/pringles.jpg', 50, '110g', TRUE),
('Nescafe Classic', 'Instant coffee', 260.00, 250.00, 4, '/images/products/nescafe.jpg', 40, '100g', FALSE),
('7UP', 'Lemon-lime flavored soft drink', 55.00, 50.00, 4, '/images/products/7up.jpg', 100, '2L', FALSE),
('Bingo! Mad Angles', 'Tangy tomato flavored corn chips', 20.00, 18.00, 4, '/images/products/mad-angles.jpg', 120, '100g', FALSE),
('Mountain Dew', 'Citrus flavored soft drink', 55.00, 50.00, 4, '/images/products/mountain-dew.jpg', 90, '2L', FALSE),
('Haldirams Bhujia Sev', 'Classic bhujia snack', 45.00, 42.00, 4, '/images/products/bhujia-sev.jpg', 80, '200g', TRUE),
('Frooti', 'Mango drink', 20.00, 18.00, 4, '/images/products/frooti.jpg', 120, '250ml', FALSE),
('Lays American Style Cream & Onion', 'Creamy onion flavored chips', 50.00, 48.00, 4, '/images/products/lays-cream-onion.jpg', 100, '165g', TRUE),
('Haldirams Moong Dal', 'Spicy moong dal snack', 45.00, 42.00, 4, '/images/products/moong-dal.jpg', 80, '200g', FALSE),
('Cadbury Gems', 'Colorful chocolate buttons', 20.00, 18.00, 4, '/images/products/gems.jpg', 120, '45g', TRUE);

-- Insert detailed products - Household
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Vim Dishwashing Liquid', 'Antibacterial dish cleaning liquid', 120.00, 110.00, 5, '/images/products/vim-liquid.jpg', 70, 'bottle', FALSE),
('Origami Toilet Paper', 'Soft toilet paper rolls', 180.00, 160.00, 5, '/images/products/origami-toilet.jpg', 90, 'pack of 6', TRUE),
('Surf Excel Liquid Detergent', 'High-efficiency laundry detergent', 250.00, 230.00, 5, '/images/products/surf-excel.jpg', 60, '2L', FALSE),
('Bags For U Garbage Bags', 'Heavy-duty garbage bags', 140.00, 130.00, 5, '/images/products/garbage-bags.jpg', 80, 'pack of 20', TRUE),
('Harpic Toilet Cleaner', 'Power bathroom cleaner', 90.00, 85.00, 5, '/images/products/harpic.jpg', 70, '500ml', FALSE),
('Colin Glass Cleaner', 'Streak-free glass cleaner', 85.00, 80.00, 5, '/images/products/colin.jpg', 80, '500ml', TRUE),
('Lizol Disinfectant Floor Cleaner', 'Surface disinfectant', 130.00, 120.00, 5, '/images/products/lizol.jpg', 60, '1L', FALSE),
('Odonil Air Freshener', 'Long-lasting room freshener', 65.00, 60.00, 5, '/images/products/odonil.jpg', 100, 'piece', TRUE),
('Good Knight Mosquito Repellent', 'Electric mosquito repellent', 80.00, 75.00, 5, '/images/products/good-knight.jpg', 50, 'unit', FALSE),
('Vim Dishwash Bar', 'Dish cleaning bar', 25.00, 22.00, 5, '/images/products/vim-bar.jpg', 120, 'piece', FALSE),
('Scotch Brite Scrubber', 'Heavy-duty kitchen scrubber', 30.00, 28.00, 5, '/images/products/scotch-brite.jpg', 100, 'piece', TRUE),
('Ariel Washing Powder', 'Stain removal detergent powder', 280.00, 260.00, 5, '/images/products/ariel.jpg', 50, '2kg', TRUE),
('Dettol Hand Wash', 'Antibacterial hand wash', 90.00, 85.00, 5, '/images/products/dettol-hand.jpg', 70, '200ml', FALSE),
('Exo Dishwash Bar', 'Anti-bacterial dish washing bar', 20.00, 18.00, 5, '/images/products/exo.jpg', 100, 'piece', FALSE),
('Hit Cockroach Spray', 'Insect killer spray', 190.00, 180.00, 5, '/images/products/hit.jpg', 40, '400ml', TRUE),
('Pril Dishwashing Liquid', 'Concentrated dish cleaner', 110.00, 100.00, 5, '/images/products/pril.jpg', 60, '425ml', FALSE),
('Surf Excel Washing Powder', 'Tough stain remover powder', 220.00, 210.00, 5, '/images/products/surf-excel-powder.jpg', 50, '1kg', TRUE),
('Comfort Fabric Conditioner', 'Fabric softener', 190.00, 180.00, 5, '/images/products/comfort.jpg', 50, '860ml', FALSE),
('Domex Toilet Cleaner', 'Disinfectant toilet cleaner', 95.00, 90.00, 5, '/images/products/domex.jpg', 60, '500ml', FALSE),
('Rin Detergent Bar', 'Clothes washing soap bar', 25.00, 22.00, 5, '/images/products/rin-bar.jpg', 100, 'piece', FALSE),
('Harpic Bathroom Cleaner', 'Multi-surface bathroom cleaner', 130.00, 120.00, 5, '/images/products/harpic-bathroom.jpg', 50, '500ml', TRUE),
('Tide Detergent Powder', 'Laundry detergent powder', 190.00, 180.00, 5, '/images/products/tide.jpg', 60, '1kg', FALSE),
('Godrej Aer Spray', 'Room freshening spray', 210.00, 200.00, 5, '/images/products/aer.jpg', 40, '300ml', TRUE),
('Scotch Brite Wipe', 'Microfiber cleaning cloth', 50.00, 45.00, 5, '/images/products/scotch-wipe.jpg', 80, 'piece', FALSE),
('All Out Mosquito Repellent', 'Liquid vaporizer with refill', 95.00, 90.00, 5, '/images/products/all-out.jpg', 70, 'unit', TRUE),
('Ezee Liquid Detergent', 'Liquid detergent for woolens', 110.00, 100.00, 5, '/images/products/ezee.jpg', 50, '500ml', FALSE),
('Genteel Liquid Handwash', 'Moisturizing hand wash', 75.00, 70.00, 5, '/images/products/genteel.jpg', 60, '250ml', FALSE),
('Dettol Antiseptic Liquid', 'First aid antiseptic', 120.00, 110.00, 5, '/images/products/dettol-liquid.jpg', 70, '250ml', TRUE),
('Henko Detergent Powder', 'Premium laundry detergent', 250.00, 240.00, 5, '/images/products/henko.jpg', 40, '2kg', FALSE),
('Maxo Mosquito Repellent', 'Coil mosquito repellent', 35.00, 32.00, 5, '/images/products/maxo.jpg', 100, 'pack of 10', FALSE);

-- Insert detailed products - Meat & Seafood (new category)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Fresh Chicken Breast', 'Boneless chicken breast', 280.00, 260.00, 6, '/images/products/chicken-breast.jpg', 50, '500g', TRUE),
('Atlantic Salmon Fillet', 'Fresh salmon fillet', 550.00, 520.00, 6, '/images/products/salmon.jpg', 30, '500g', TRUE),
('Mutton Curry Cut', 'Fresh goat meat curry pieces', 650.00, 620.00, 6, '/images/products/mutton.jpg', 40, 'kg', FALSE),
('Fresh Prawns', 'Cleaned and deveined prawns', 450.00, 430.00, 6, '/images/products/prawns.jpg', 35, '500g', TRUE),
('Chicken Curry Cut', 'Fresh chicken pieces for curry', 220.00, 200.00, 6, '/images/products/chicken-curry.jpg', 60, 'kg', FALSE),
('Fresh Pomfret', 'Cleaned whole pomfret fish', 380.00, 350.00, 6, '/images/products/pomfret.jpg', 30, 'kg', FALSE),
('Lamb Chops', 'Fresh lamb rib chops', 720.00, 680.00, 6, '/images/products/lamb-chops.jpg', 25, '500g', TRUE),
('Fresh Mackerel', 'Whole mackerel fish', 320.00, 300.00, 6, '/images/products/mackerel.jpg', 40, 'kg', FALSE),
('Chicken Drumsticks', 'Fresh chicken drumsticks', 240.00, 220.00, 6, '/images/products/drumsticks.jpg', 50, '500g', FALSE),
('Tuna Steak', 'Fresh tuna fish steaks', 480.00, 450.00, 6, '/images/products/tuna.jpg', 25, '500g', TRUE),
('Pork Ribs', 'Fresh pork spare ribs', 480.00, 450.00, 6, '/images/products/pork-ribs.jpg', 30, '500g', FALSE),
('Rohu Fish', 'Fresh whole rohu fish', 280.00, 260.00, 6, '/images/products/rohu.jpg', 35, 'kg', FALSE),
('Chicken Wings', 'Fresh chicken wings', 180.00, 170.00, 6, '/images/products/chicken-wings.jpg', 45, '500g', TRUE),
('King Fish Steaks', 'Fresh surmai fish steaks', 450.00, 420.00, 6, '/images/products/king-fish.jpg', 30, '500g', FALSE),
('Lamb Mince', 'Fresh minced lamb meat', 550.00, 520.00, 6, '/images/products/lamb-mince.jpg', 25, '500g', FALSE),
('Fresh Squid', 'Cleaned squid rings', 350.00, 320.00, 6, '/images/products/squid.jpg', 30, '300g', TRUE),
('Chicken Liver', 'Fresh chicken liver', 120.00, 110.00, 6, '/images/products/chicken-liver.jpg', 40, '250g', FALSE),
('Fresh Tilapia', 'Whole tilapia fish', 280.00, 260.00, 6, '/images/products/tilapia.jpg', 35, 'kg', FALSE),
('Turkey Breast', 'Boneless turkey breast', 580.00, 550.00, 6, '/images/products/turkey.jpg', 20, '500g', TRUE),
('Bombay Duck', 'Dried bombay duck fish', 220.00, 200.00, 6, '/images/products/bombay-duck.jpg', 40, '250g', FALSE),
('Chicken Keema', 'Minced chicken meat', 280.00, 260.00, 6, '/images/products/chicken-keema.jpg', 45, '500g', TRUE),
('Fresh Hilsa', 'Whole hilsa fish', 650.00, 620.00, 6, '/images/products/hilsa.jpg', 25, 'kg', FALSE),
('Lamb Shoulder', 'Bone-in lamb shoulder', 580.00, 550.00, 6, '/images/products/lamb-shoulder.jpg', 30, 'kg', FALSE),
('Fresh Crab', 'Live mud crabs', 450.00, 420.00, 6, '/images/products/crab.jpg', 25, 'kg', TRUE),
('Chicken Sausages', 'Chicken breakfast sausages', 220.00, 200.00, 6, '/images/products/chicken-sausage.jpg', 40, '200g', FALSE),
('Fresh Catfish', 'Cleaned whole catfish', 320.00, 300.00, 6, '/images/products/catfish.jpg', 30, 'kg', FALSE),
('Beef Chuck', 'Fresh beef chuck pieces', 550.00, 520.00, 6, '/images/products/beef-chuck.jpg', 25, '500g', TRUE),
('Fresh Clams', 'Live clams', 280.00, 260.00, 6, '/images/products/clams.jpg', 30, '500g', FALSE),
('Chicken Gizzard', 'Fresh chicken gizzards', 120.00, 110.00, 6, '/images/products/gizzard.jpg', 40, '250g', FALSE),
('Norwegian Salmon', 'Premium imported salmon', 850.00, 800.00, 6, '/images/products/norwegian-salmon.jpg', 20, '500g', TRUE);

-- Insert detailed products - Frozen Foods (new category)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('McCain French Fries', 'Frozen potato fries', 180.00, 170.00, 7, '/images/products/mccain-fries.jpg', 50, '450g', TRUE),
('Frozen Mixed Vegetables', 'Mix of peas, carrots, and corn', 140.00, 130.00, 7, '/images/products/mixed-veg.jpg', 60, '500g', FALSE),
('Al Kabeer Chicken Nuggets', 'Breaded chicken nuggets', 220.00, 200.00, 7, '/images/products/nuggets.jpg', 40, '500g', TRUE),
('ITC Master Chef Prawns', 'Frozen peeled prawns', 380.00, 350.00, 7, '/images/products/frozen-prawns.jpg', 30, '250g', FALSE),
('McCain Aloo Tikki', 'Frozen potato patties', 160.00, 150.00, 7, '/images/products/aloo-tikki.jpg', 45, '400g', TRUE),
('Godrej Yummiez Chicken Kebab', 'Frozen chicken kebabs', 250.00, 230.00, 7, '/images/products/chicken-kebab.jpg', 35, '400g', FALSE),
('ITC Green Peas', 'Frozen green peas', 120.00, 110.00, 7, '/images/products/frozen-peas.jpg', 60, '500g', FALSE),
('Safal Mixed Berries', 'Frozen mixed berries', 280.00, 260.00, 7, '/images/products/mixed-berries.jpg', 30, '300g', TRUE),
('McCain Smiles', 'Potato smiley faces', 170.00, 160.00, 7, '/images/products/smiles.jpg', 50, '450g', FALSE),
('Venkys Chicken Strips', 'Breaded chicken strips', 260.00, 240.00, 7, '/images/products/chicken-strips.jpg', 40, '400g', TRUE),
('Godrej Fish Fingers', 'Breaded fish fingers', 220.00, 200.00, 7, '/images/products/fish-fingers.jpg', 35, '300g', FALSE),
('Amul Ice Cream - Butterscotch', 'Butterscotch ice cream', 180.00, 170.00, 7, '/images/products/butterscotch.jpg', 40, '1L', TRUE),
('McCain Pizza Pockets', 'Frozen stuffed pizza snacks', 280.00, 260.00, 7, '/images/products/pizza-pockets.jpg', 30, '400g', FALSE),
('Kwality Walls Cornetto', 'Chocolate cone ice cream', 50.00, 45.00, 7, '/images/products/cornetto.jpg', 100, 'piece', TRUE),
('Safal Sweet Corn', 'Frozen sweet corn kernels', 140.00, 130.00, 7, '/images/products/sweet-corn.jpg', 50, '500g', FALSE),
('ITC Veg Burger Patty', 'Vegetable burger patties', 180.00, 170.00, 7, '/images/products/veg-patty.jpg', 40, '360g', FALSE),
('Vadilal Cassata Ice Cream', 'Multi-layered ice cream', 220.00, 200.00, 7, '/images/products/cassata.jpg', 30, '500ml', TRUE),
('Sumeru Paratha', 'Frozen plain parathas', 160.00, 150.00, 7, '/images/products/paratha.jpg', 50, 'pack of 5', FALSE),
('McCain Chilli Garlic Potato Bites', 'Spicy potato snacks', 190.00, 180.00, 7, '/images/products/potato-bites.jpg', 40, '420g', TRUE),
('Al Kabeer Chicken Samosa', 'Frozen chicken samosas', 210.00, 200.00, 7, '/images/products/chicken-samosa.jpg', 35, '400g', FALSE),
('Mother Dairy Matka Kulfi', 'Traditional kulfi ice cream', 30.00, 28.00, 7, '/images/products/kulfi.jpg', 100, 'piece', TRUE),
('Safal Spinach', 'Frozen chopped spinach', 110.00, 100.00, 7, '/images/products/frozen-spinach.jpg', 60, '400g', FALSE),
('Havmor Ice Cream - Kesar Pista', 'Saffron pistachio ice cream', 250.00, 240.00, 7, '/images/products/kesar-pista.jpg', 30, '750ml', FALSE),
('McCain Veggie Fingers', 'Vegetable fingers', 180.00, 170.00, 7, '/images/products/veggie-fingers.jpg', 40, '400g', TRUE),
('ITC Maxmini Jumbo', 'Chicken seekh kebab rolls', 280.00, 260.00, 7, '/images/products/jumbo.jpg', 30, '400g', FALSE),
('Baskin Robbins Very Berry Strawberry', 'Premium strawberry ice cream', 350.00, 330.00, 7, '/images/products/strawberry-icecream.jpg', 25, '500ml', TRUE),
('Venkys Burger Patty', 'Chicken burger patties', 220.00, 200.00, 7, '/images/products/chicken-patty.jpg', 35, '360g', FALSE),
('Kwality Walls Magnum', 'Chocolate coated ice cream bar', 90.00, 85.00, 7, '/images/products/magnum.jpg', 60, 'piece', TRUE),
('Sumeru Aloo Paratha', 'Frozen stuffed potato parathas', 190.00, 180.00, 7, '/images/products/aloo-paratha.jpg', 40, 'pack of 4', FALSE),
('Godrej Vegetable Spring Rolls', 'Frozen vegetable spring rolls', 180.00, 170.00, 7, '/images/products/spring-rolls.jpg', 35, '300g', TRUE);

-- Insert sample data for other categories briefly
-- Insert some Personal Care products (Category 8)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Dove Soap', 'Moisturizing beauty bar', 45.00, 42.00, 8, '/images/products/dove.jpg', 100, 'piece', TRUE),
('Pantene Shampoo', 'Pro-V nourishing shampoo', 180.00, 170.00, 8, '/images/products/pantene.jpg', 60, '340ml', TRUE),
('Colgate MaxFresh', 'Cooling crystal toothpaste', 90.00, 85.00, 8, '/images/products/colgate.jpg', 80, '150g', FALSE),
('Nivea Men Face Wash', 'Oil control face wash', 220.00, 210.00, 8, '/images/products/nivea-face.jpg', 50, '100ml', TRUE),
('Gillette Mach3', 'Triple blade razor', 350.00, 330.00, 8, '/images/products/gillette.jpg', 40, 'piece', FALSE);

-- Insert some Baby Products (Category 9)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Pampers Diapers', 'Baby dry diapers medium size', 650.00, 620.00, 9, '/images/products/pampers.jpg', 30, 'pack of 42', TRUE),
('Cerelac Wheat', 'Baby cereal food', 350.00, 340.00, 9, '/images/products/cerelac.jpg', 40, '300g', FALSE),
('Johnsons Baby Powder', 'Baby talcum powder', 180.00, 170.00, 9, '/images/products/johnsons.jpg', 50, '200g', TRUE),
('Enfamil Baby Formula', 'Infant milk formula', 750.00, 730.00, 9, '/images/products/enfamil.jpg', 25, '400g', FALSE),
('Himalaya Baby Wipes', 'Gentle baby wipes', 150.00, 140.00, 9, '/images/products/baby-wipes.jpg', 60, 'pack of 72', TRUE);

-- Insert some Pet Supplies (Category 10)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Pedigree Adult Dog Food', 'Chicken and vegetables', 650.00, 620.00, 10, '/images/products/pedigree.jpg', 30, '3kg', TRUE),
('Whiskas Cat Food', 'Tuna flavor', 450.00, 430.00, 10, '/images/products/whiskas.jpg', 40, '1.2kg', FALSE),
('Pet Collar', 'Adjustable dog collar', 350.00, 330.00, 10, '/images/products/collar.jpg', 30, 'piece', TRUE),
('Cat Litter', 'Clumping cat litter', 450.00, 430.00, 10, '/images/products/cat-litter.jpg', 25, '5kg', FALSE),
('Pet Toy', 'Squeaky rubber toy', 220.00, 200.00, 10, '/images/products/pet-toy.jpg', 45, 'piece', TRUE);

-- Insert some Breakfast & Cereal products (Category 11)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Kelloggs Corn Flakes', 'Original corn flakes', 220.00, 210.00, 11, '/images/products/cornflakes.jpg', 50, '500g', TRUE),
('Quaker Oats', 'Rolled whole grain oats', 240.00, 230.00, 11, '/images/products/quaker.jpg', 60, '1kg', FALSE),
('Nutella Hazelnut Spread', 'Chocolate hazelnut spread', 350.00, 330.00, 11, '/images/products/nutella.jpg', 40, '350g', TRUE),
('MTR Breakfast Mix - Upma', 'Ready upma mix', 60.00, 55.00, 11, '/images/products/upma.jpg', 80, '200g', FALSE),
('Saffola Masala Oats', 'Spiced instant oats', 45.00, 42.00, 11, '/images/products/masala-oats.jpg', 100, '40g', TRUE);

-- Insert some Condiments & Sauces (Category 12)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Kissan Tomato Ketchup', 'Tomato ketchup', 120.00, 110.00, 12, '/images/products/kissan.jpg', 70, '500g', TRUE),
('Hellmanns Mayonnaise', 'Real mayonnaise', 250.00, 240.00, 12, '/images/products/hellmanns.jpg', 40, '400g', FALSE),
('Maggi Hot & Sweet Sauce', 'Tomato chilli sauce', 140.00, 130.00, 12, '/images/products/maggi-sauce.jpg', 60, '500g', TRUE),
('Heinz Yellow Mustard', 'Classic yellow mustard', 280.00, 270.00, 12, '/images/products/mustard.jpg', 30, '240g', FALSE),
('Chings Schezwan Chutney', 'Spicy schezwan sauce', 90.00, 85.00, 12, '/images/products/schezwan.jpg', 80, '250g', TRUE);

-- Insert some Canned & Packaged Foods (Category 13)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Del Monte Baked Beans', 'Baked beans in tomato sauce', 120.00, 110.00, 13, '/images/products/baked-beans.jpg', 60, '450g', TRUE),
('American Garden Sweet Corn', 'Canned sweet corn', 180.00, 170.00, 13, '/images/products/canned-corn.jpg', 50, '400g', FALSE),
('MTR Ready to Eat Dal Makhani', 'Instant dal makhani', 90.00, 85.00, 13, '/images/products/dal-makhani.jpg', 70, '300g', TRUE),
('Patanjali Honey', 'Pure honey', 250.00, 240.00, 13, '/images/products/honey.jpg', 50, '500g', FALSE),
('Nestle Milkmaid', 'Sweetened condensed milk', 130.00, 125.00, 13, '/images/products/milkmaid.jpg', 60, '400g', TRUE);

-- Insert some Health Foods & Supplements (Category 14)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Ensure Protein Powder', 'Nutritional powder', 650.00, 630.00, 14, '/images/products/ensure.jpg', 30, '400g', TRUE),
('Himalaya Ashwagandha', 'Herbal supplement', 190.00, 180.00, 14, '/images/products/ashwagandha.jpg', 50, '60 tablets', FALSE),
('Pro360 Weight Gainer', 'High protein weight gainer', 750.00, 730.00, 14, '/images/products/weight-gainer.jpg', 25, '500g', TRUE),
('Bournvita Health Drink', 'Malt based health drink', 240.00, 230.00, 14, '/images/products/bournvita-pro.jpg', 50, '500g', FALSE),
('Zandu Chyawanprash', 'Ayurvedic health supplement', 350.00, 340.00, 14, '/images/products/chyawanprash.jpg', 40, '900g', TRUE);

-- Insert some Home & Kitchen products (Category 15)
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Prestige Pressure Cooker', '3 liter pressure cooker', 1450.00, 1400.00, 15, '/images/products/pressure-cooker.jpg', 25, 'piece', TRUE),
('Pigeon Non-stick Tawa', '28cm non-stick flat pan', 650.00, 620.00, 15, '/images/products/tawa.jpg', 30, 'piece', FALSE),
('Milton Water Bottle', 'Stainless steel bottle', 450.00, 430.00, 15, '/images/products/water-bottle.jpg', 50, '1L', TRUE),
('Cello Glassware Set', 'Set of 6 glasses', 350.00, 330.00, 15, '/images/products/glassware.jpg', 40, 'set', FALSE),
('Hawkins Cooker Gasket', 'Pressure cooker rubber gasket', 120.00, 110.00, 15, '/images/products/gasket.jpg', 80, 'piece', TRUE);
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('iPhone 14 Pro', '256GB, Deep Purple, 6.1-inch display', 129999, 124999, 16, '/images/products/iphone14pro.jpg', 15, 'piece', TRUE),
('Samsung Galaxy S23 Ultra', '512GB - Phantom Black', 124999, 119999, 16, '/images/products/galaxy-s23.jpg', 10, 'piece', TRUE),
('OnePlus Nord CE 3 Lite', '128GB - Pastel Lime', 19999, 18499, 16, '/images/products/oneplus-nord.jpg', 50, 'piece', FALSE),
('Redmi Note 12 Pro', '6GB RAM, 128GB storage', 23999, 21999, 16, '/images/products/redmi-note12.jpg', 30, 'piece', TRUE),
('Sony Bravia 43" Smart TV', '4K Ultra HD Android TV', 49999, 45999, 16, '/images/products/sony-tv.jpg', 20, 'piece', TRUE),
('Mi 5X 43 Inch LED TV', 'Full HD Android TV with voice remote', 34999, 32999, 16, '/images/products/mi-tv.jpg', 25, 'piece', FALSE),
('Realme Narzo 60', '128GB, Mars Orange', 16999, 15999, 16, '/images/products/narzo60.jpg', 40, 'piece', FALSE),
('Google Pixel 7a', '128GB, Charcoal', 45999, 43999, 16, '/images/products/pixel7a.jpg', 18, 'piece', TRUE),
('iPhone 13', '128GB, Pink', 69999, 67999, 16, '/images/products/iphone13.jpg', 25, 'piece', TRUE),
('Samsung Galaxy A54', '256GB, Awesome Violet', 39999, 37999, 16, '/images/products/galaxy-a54.jpg', 35, 'piece', FALSE),
('Vivo V27 Pro', '256GB, Magic Blue', 42999, 40999, 16, '/images/products/vivo-v27.jpg', 20, 'piece', TRUE),
('Oppo Reno 8', '256GB, Shimmer Gold', 32999, 30999, 16, '/images/products/oppo-reno8.jpg', 28, 'piece', FALSE),
('Nothing Phone 1', '256GB, Black', 34999, 32999, 16, '/images/products/nothing-phone.jpg', 15, 'piece', TRUE),
('Poco X5 Pro', '256GB, Yellow', 24999, 22999, 16, '/images/products/poco-x5.jpg', 45, 'piece', FALSE),
('Motorola Edge 40', '256GB, Lunar Blue', 29999, 27999, 16, '/images/products/moto-edge40.jpg', 22, 'piece', FALSE),
('Realme GT Neo 3', '256GB, Asphalt Black', 31999, 29999, 16, '/images/products/realme-gt.jpg', 18, 'piece', TRUE),
('iPad Air 5th Gen', '256GB, Space Gray', 74999, 71999, 16, '/images/products/ipad-air.jpg', 12, 'piece', TRUE),
('Samsung Galaxy Tab S8', '128GB, Graphite', 54999, 51999, 16, '/images/products/galaxy-tab.jpg', 16, 'piece', FALSE),
('OnePlus Pad', '128GB, Halo Green', 37999, 35999, 16, '/images/products/oneplus-pad.jpg', 20, 'piece', TRUE),
('Lenovo Tab P11', '128GB, Slate Grey', 19999, 18499, 16, '/images/products/lenovo-tab.jpg', 30, 'piece', FALSE),
('Xiaomi Pad 5', '128GB, Cosmic Gray', 26999, 24999, 16, '/images/products/xiaomi-pad.jpg', 25, 'piece', FALSE),
('Realme Pad X', '128GB, Glowing Grey', 17999, 16499, 16, '/images/products/realme-pad.jpg', 35, 'piece', FALSE),
('Honor Magic5 Lite', '256GB, Emerald Green', 22999, 20999, 16, '/images/products/honor-magic5.jpg', 28, 'piece', FALSE),
('iQOO Neo 7', '256GB, Interstellar Black', 29999, 27999, 16, '/images/products/iqoo-neo7.jpg', 24, 'piece', TRUE),
('Infinix Note 12', '256GB, Volcano Orange', 13999, 12999, 16, '/images/products/infinix-note12.jpg', 50, 'piece', FALSE),
('Tecno Phantom X2', '256GB, Stardust Grey', 24999, 22999, 16, '/images/products/tecno-phantom.jpg', 20, 'piece', FALSE),
('Asus ROG Phone 6', '256GB, Phantom Black', 71999, 68999, 16, '/images/products/rog-phone6.jpg', 8, 'piece', TRUE),
('Black Shark 5', '256GB, Shadow Black', 39999, 37999, 16, '/images/products/black-shark5.jpg', 12, 'piece', FALSE),
('Nubia Red Magic 7', '256GB, Obsidian', 45999, 43999, 16, '/images/products/nubia-red.jpg', 10, 'piece', TRUE),
('CMF Phone 1', '128GB, Black', 15999, 14999, 16, '/images/products/cmf-phone.jpg', 40, 'piece', FALSE),
('Lava Blaze 2', '128GB, Glass Blue', 8999, 7999, 16, '/images/products/lava-blaze.jpg', 60, 'piece', FALSE),
('Micromax In Note 2', '128GB, Brown', 10999, 9999, 16, '/images/products/micromax-note2.jpg', 45, 'piece', FALSE),
('Jio Phone Prima 4G', '64GB, Blue', 2999, 2799, 16, '/images/products/jio-prima.jpg', 80, 'piece', FALSE),
('Samsung Galaxy M34', '128GB, Midnight Blue', 18999, 17499, 16, '/images/products/galaxy-m34.jpg', 38, 'piece', FALSE),
('Redmi 12C', '64GB, Lavender Purple', 8999, 7999, 16, '/images/products/redmi-12c.jpg', 55, 'piece', FALSE);

-- =====================
-- Products - Computer Accessories (category_id = 17) - 30 products
-- =====================

INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Logitech Wireless Mouse M235', 'Compact wireless mouse with USB nano receiver', 899, 749, 17, '/images/products/logitech-mouse.jpg', 100, 'piece', TRUE),
('Zebronics Gaming Keyboard', 'Mechanical RGB keyboard with anti-ghosting', 2199, 1999, 17, '/images/products/zebronics-keyboard.jpg', 40, 'piece', FALSE),
('HP USB Keyboard', 'Standard USB keyboard for PC and laptops', 799, 699, 17, '/images/products/hp-keyboard.jpg', 60, 'piece', FALSE),
('Seagate 1TB External HDD', 'USB 3.0 portable hard drive', 4499, 4199, 17, '/images/products/seagate-hdd.jpg', 35, 'piece', TRUE),
('SanDisk 64GB Pendrive', 'High-speed USB 3.1 flash drive', 799, 699, 17, '/images/products/sandisk.jpg', 120, 'piece', FALSE),
('Dell Wired Mouse', 'High precision optical mouse', 499, 449, 17, '/images/products/dell-mouse.jpg', 80, 'piece', FALSE),
('TP-Link WiFi Adapter', 'Nano USB wireless adapter', 999, 899, 17, '/images/products/tplink.jpg', 50, 'piece', TRUE),
('WD Blue 500GB SSD', 'SATA internal solid state drive', 3999, 3799, 17, '/images/products/wd-ssd.jpg', 25, 'piece', FALSE),
('Razer DeathAdder V3', 'Ergonomic gaming mouse', 4999, 4499, 17, '/images/products/razer-mouse.jpg', 20, 'piece', TRUE),
('Corsair K70 RGB', 'Mechanical gaming keyboard', 12999, 11999, 17, '/images/products/corsair-k70.jpg', 15, 'piece', TRUE),
('Samsung 970 EVO Plus 1TB', 'NVMe M.2 SSD', 8999, 8499, 17, '/images/products/samsung-ssd.jpg', 30, 'piece', TRUE),
('Crucial 32GB RAM Kit', 'DDR4 3200MHz dual channel', 8999, 8299, 17, '/images/products/crucial-ram.jpg', 25, 'piece', FALSE),
('HyperX Cloud II', 'Gaming headset with 7.1 surround', 6999, 6499, 17, '/images/products/hyperx-headset.jpg', 35, 'piece', TRUE),
('Blue Yeti Microphone', 'USB condenser microphone', 12999, 11999, 17, '/images/products/blue-yeti.jpg', 18, 'piece', TRUE),
('Logitech C920 Webcam', 'Full HD 1080p webcam', 6999, 6499, 17, '/images/products/logitech-webcam.jpg', 40, 'piece', FALSE),
('ASUS USB-AC68 Adapter', 'Dual-band wireless AC1900 adapter', 4999, 4599, 17, '/images/products/asus-adapter.jpg', 22, 'piece', FALSE),
('Kingston 128GB Pendrive', 'DataTraveler USB 3.2 flash drive', 1999, 1799, 17, '/images/products/kingston-pendrive.jpg', 65, 'piece', FALSE),
('Toshiba 2TB External HDD', 'Canvio Basics portable drive', 5999, 5499, 17, '/images/products/toshiba-hdd.jpg', 28, 'piece', FALSE),
('AMD Ryzen 5 5600X', 'Desktop processor 6-core', 18999, 17999, 17, '/images/products/amd-ryzen.jpg', 12, 'piece', TRUE),
('Intel Core i5-12400F', 'Desktop processor 6-core', 16999, 15999, 17, '/images/products/intel-i5.jpg', 15, 'piece', TRUE),
('NVIDIA RTX 3060', 'Graphics card 12GB GDDR6', 34999, 32999, 17, '/images/products/nvidia-rtx.jpg', 8, 'piece', TRUE),
('MSI B550M Pro Motherboard', 'AMD AM4 micro-ATX motherboard', 7999, 7499, 17, '/images/products/msi-motherboard.jpg', 20, 'piece', FALSE),
('Cooler Master Hyper 212', 'CPU air cooler', 2999, 2799, 17, '/images/products/cooler-master.jpg', 35, 'piece', FALSE),
('Corsair RM750x PSU', '750W modular power supply', 9999, 9299, 17, '/images/products/corsair-psu.jpg', 18, 'piece', FALSE),
('NZXT H510 Cabinet', 'Mid-tower ATX case', 6999, 6499, 17, '/images/products/nzxt-case.jpg', 25, 'piece', FALSE),
('SteelSeries QcK Mousepad', 'Large gaming mouse pad', 1499, 1299, 17, '/images/products/steelseries-pad.jpg', 70, 'piece', FALSE),
('Belkin USB-C Hub', '7-in-1 multiport adapter', 3999, 3699, 17, '/images/products/belkin-hub.jpg', 45, 'piece', FALSE),
('Anker PowerCore 10000', 'Portable charger power bank', 2999, 2699, 17, '/images/products/anker-powerbank.jpg', 55, 'piece', TRUE),
('Cable Matters USB-C Cable', '3ft USB-C to USB-C cable', 999, 899, 17, '/images/products/cable-matters.jpg', 90, 'piece', FALSE),
('Satechi Aluminum Stand', 'Laptop stand with adjustable height', 4999, 4599, 17, '/images/products/satechi-stand.jpg', 30, 'piece', FALSE);

-- =====================
-- Products - Smart Devices (category_id = 18) - 30 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Mi Band 7', 'Fitness tracker with AMOLED display', 3499, 3199, 18, '/images/products/mi-band.jpg', 70, 'piece', TRUE),
('boAt Xtend Smartwatch', 'Touch screen with Alexa built-in', 2999, 2799, 18, '/images/products/boat-watch.jpg', 90, 'piece', TRUE),
('Apple Watch SE', 'GPS, 40mm, Midnight Aluminium Case', 29999, 28499, 18, '/images/products/apple-watch.jpg', 30, 'piece', TRUE),
('Google Nest Mini', 'Smart speaker with Google Assistant', 3499, 2999, 18, '/images/products/nest-mini.jpg', 60, 'piece', FALSE),
('Amazon Echo Dot (5th Gen)', 'Smart speaker with Alexa', 4999, 4499, 18, '/images/products/echo-dot.jpg', 50, 'piece', TRUE),
('Noise ColorFit Pulse', 'Fitness smartwatch with SpO2 monitor', 1999, 1799, 18, '/images/products/noise-pulse.jpg', 100, 'piece', FALSE),
('OnePlus Band', 'Smart fitness band with heart rate monitor', 2499, 2199, 18, '/images/products/oneplus-band.jpg', 80, 'piece', FALSE),
('Apple Watch Series 8', 'GPS + Cellular, 45mm', 49999, 47999, 18, '/images/products/apple-watch8.jpg', 20, 'piece', TRUE),
('Samsung Galaxy Watch 5', '40mm, Bluetooth', 26999, 24999, 18, '/images/products/galaxy-watch5.jpg', 35, 'piece', TRUE),
('Fitbit Charge 5', 'Advanced fitness tracker', 14999, 13999, 18, '/images/products/fitbit-charge5.jpg', 45, 'piece', FALSE),
('Garmin Venu 2', 'GPS smartwatch with music', 34999, 32999, 18, '/images/products/garmin-venu2.jpg', 25, 'piece', TRUE),
('Amazfit GTR 3', 'Smart watch with GPS', 12999, 11999, 18, '/images/products/amazfit-gtr3.jpg', 40, 'piece', FALSE),
('Realme Watch S Pro', 'AMOLED display smartwatch', 9999, 8999, 18, '/images/products/realme-watch.jpg', 55, 'piece', FALSE),
('Fire-Boltt Phoenix Pro', 'Bluetooth calling smartwatch', 3499, 2999, 18, '/images/products/fireboltt-phoenix.jpg', 85, 'piece', FALSE),
('JBL Go 3', 'Portable Bluetooth speaker', 2999, 2699, 18, '/images/products/jbl-go3.jpg', 75, 'piece', TRUE),
('Sony SRS-XB13', 'Extra Bass portable speaker', 3999, 3599, 18, '/images/products/sony-srs.jpg', 50, 'piece', FALSE),
('Marshall Acton II', 'Bluetooth home speaker', 21999, 19999, 18, '/images/products/marshall-acton.jpg', 15, 'piece', TRUE),
('Philips Hue White Bulb', 'Smart LED bulb', 1999, 1799, 18, '/images/products/philips-hue.jpg', 100, 'piece', FALSE),
('TP-Link Kasa Smart Plug', 'WiFi smart plug', 1299, 1099, 18, '/images/products/kasa-plug.jpg', 120, 'piece', FALSE),
('Ring Video Doorbell', 'Smart doorbell with camera', 8999, 7999, 18, '/images/products/ring-doorbell.jpg', 30, 'piece', TRUE),
('Nest Thermostat', 'Smart programmable thermostat', 12999, 11999, 18, '/images/products/nest-thermostat.jpg', 20, 'piece', FALSE),
('Xiaomi Mi Robot Vacuum', 'Smart robot vacuum cleaner', 24999, 22999, 18, '/images/products/mi-vacuum.jpg', 18, 'piece', TRUE),
('Eufy Security Camera', '2K indoor smart camera', 6999, 6299, 18, '/images/products/eufy-camera.jpg', 35, 'piece', FALSE),
('August Smart Lock', 'WiFi smart door lock', 19999, 18499, 18, '/images/products/august-lock.jpg', 12, 'piece', TRUE),
('Wyze Cam v3', 'Color night vision security camera', 3999, 3599, 18, '/images/products/wyze-cam.jpg', 60, 'piece', FALSE),
('Ecobee SmartSensor', 'Room sensor for smart thermostat', 4999, 4499, 18, '/images/products/ecobee-sensor.jpg', 40, 'piece', FALSE),
('Arlo Pro 4', 'Wireless security camera', 19999, 18999, 18, '/images/products/arlo-pro4.jpg', 25, 'piece', TRUE),
('Sonos One', 'Smart speaker with voice control', 19999, 18499, 18, '/images/products/sonos-one.jpg', 22, 'piece', TRUE),
('Tile Mate', 'Bluetooth item tracker', 2499, 2199, 18, '/images/products/tile-mate.jpg', 80, 'piece', FALSE),
('Belkin Wemo Mini', 'Smart plug with WiFi', 1999, 1799, 18, '/images/products/wemo-mini.jpg', 70, 'piece', FALSE);

-- =====================
-- Products - Gaming (category_id = 19) - 30 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Sony PlayStation 5', 'Disc Edition Console, DualSense Controller included', 54999, 52999, 19, '/images/products/ps5.jpg', 15, 'piece', TRUE),
('Xbox Series X', '1TB Console with wireless controller', 49999, 47999, 19, '/images/products/xbox-series-x.jpg', 10, 'piece', TRUE),
('Nintendo Switch OLED', 'White Joy-Con, 7-inch OLED display', 36999, 34999, 19, '/images/products/switch-oled.jpg', 20, 'piece', TRUE),
('DualSense Wireless Controller', 'Midnight Black for PS5', 6499, 5999, 19, '/images/products/dualsense.jpg', 50, 'piece', FALSE),
('Redgear Shadow Blade Keyboard', 'RGB Mechanical Gaming Keyboard', 2699, 2499, 19, '/images/products/redgear-keyboard.jpg', 40, 'piece', FALSE),
('Logitech G402 Gaming Mouse', 'Hyperion Fury FPS mouse', 2999, 2799, 19, '/images/products/g402.jpg', 35, 'piece', TRUE),
('GTA V', 'PlayStation 5 - Story + Online', 2499, 2299, 19, '/images/products/gta5.jpg', 60, 'piece', TRUE),
('Call of Duty: MW3', 'Xbox Series X game', 4399, 4199, 19, '/images/products/cod-mw3.jpg', 25, 'piece', FALSE),
('Xbox Series S', '512GB Digital Console', 34999, 32999, 19, '/images/products/xbox-series-s.jpg', 25, 'piece', TRUE),
('Nintendo Switch Lite', 'Handheld gaming console, Coral', 19999, 18999, 19, '/images/products/switch-lite.jpg', 40, 'piece', FALSE),
('Steam Deck', '256GB handheld gaming PC', 41999, 39999, 19, '/images/products/steam-deck.jpg', 8, 'piece', TRUE),
('Razer BlackWidow V3', 'Mechanical gaming keyboard', 8999, 8299, 19, '/images/products/razer-blackwidow.jpg', 30, 'piece', FALSE),
('SteelSeries Arctis 7', 'Wireless gaming headset', 12999, 11999, 19, '/images/products/arctis7.jpg', 25, 'piece', TRUE),
('Logitech G Pro X', 'Wireless gaming headset', 18999, 17499, 19, '/images/products/gpro-headset.jpg', 20, 'piece', TRUE),
('Xbox Wireless Controller', 'Carbon Black for Xbox Series', 5999, 5499, 19, '/images/products/xbox-controller.jpg', 45, 'piece', FALSE),
('Nintendo Pro Controller', 'For Nintendo Switch', 6999, 6499, 19, '/images/products/pro-controller.jpg', 35, 'piece', FALSE),
('Cyberpunk 2077', 'PlayStation 5 game', 2999, 2699, 19, '/images/products/cyberpunk.jpg', 40, 'piece', FALSE),
('Spider-Man: Miles Morales', 'PlayStation 5 exclusive', 2999, 2799, 19, '/images/products/spiderman-miles.jpg', 35, 'piece', TRUE),
('Halo Infinite', 'Xbox Series X game', 3499, 3199, 19, '/images/products/halo-infinite.jpg', 30, 'piece', FALSE),
('FIFA 24', 'PlayStation 5 football game', 4999, 4599, 19, '/images/products/fifa24.jpg', 50, 'piece', TRUE),
('The Legend of Zelda: TOTK', 'Nintendo Switch game', 4999, 4699, 19, '/images/products/zelda-totk.jpg', 28, 'piece', TRUE),
('Mario Kart 8 Deluxe', 'Nintendo Switch racing game', 4999, 4599, 19, '/images/products/mario-kart8.jpg', 45, 'piece', FALSE),
('Corsair K65 RGB Mini', '60% wireless gaming keyboard', 11999, 10999, 19, '/images/products/corsair-k65.jpg', 22, 'piece', FALSE),
('Razer DeathAdder V3 Pro', 'Wireless gaming mouse', 13999, 12999, 19, '/images/products/razer-v3pro.jpg', 18, 'piece', TRUE),
('Secretlab Omega 2020', 'Gaming chair', 39999, 37999, 19, '/images/products/secretlab-chair.jpg', 12, 'piece', TRUE),
('ASUS TUF Gaming Monitor', '24" 165Hz display', 19999, 18499, 19, '/images/products/asus-monitor.jpg', 20, 'piece', TRUE),
('Elgato Stream Deck', '15-key streaming control panel', 14999, 13999, 19, '/images/products/stream-deck.jpg', 15, 'piece', FALSE),
('Blue Snowball Ice', 'USB microphone for streaming', 4999, 4499, 19, '/images/products/snowball-ice.jpg', 30, 'piece', FALSE),
('Capture Card HD60 S', 'Game capture device', 19999, 18499, 19, '/images/products/capture-card.jpg', 18, 'piece', FALSE),
('Gaming Desk RGB', 'LED gaming desk with cup holder', 12999, 11999, 19, '/images/products/gaming-desk.jpg', 25, 'piece', FALSE);

-- =====================
-- Products - Home Appliances (category_id = 20) - 30 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('LG 7kg Washing Machine', 'Fully automatic front load', 35999, 33999, 20, '/images/products/lg-wm.jpg', 10, 'piece', TRUE),
('Samsung 253L Double Door Fridge', 'Digital Inverter Technology', 28999, 26999, 20, '/images/products/samsung-fridge.jpg', 8, 'piece', TRUE),
('Voltas 1.5 Ton Split AC', 'Inverter AC with copper condenser', 36999, 34999, 20, '/images/products/voltas-ac.jpg', 12, 'piece', TRUE),
('IFB Microwave 20L', 'Convection Microwave Oven', 10999, 9999, 20, '/images/products/ifb-microwave.jpg', 15, 'piece', TRUE),
('Philips 750W Mixer Grinder', '3 stainless steel jars', 3299, 3099, 20, '/images/products/philips-mixer.jpg', 40, 'piece', FALSE),
('Havells Air Fryer', 'Digital air fryer with timer', 7499, 6999, 20, '/images/products/havells-fryer.jpg', 25, 'piece', TRUE),
('Usha Steam Iron', 'Non-stick soleplate with vertical steam', 1799, 1599, 20, '/images/products/usha-iron.jpg', 60, 'piece', FALSE),
('Bajaj Room Heater', 'Blower room heater for winter', 2499, 2299, 20, '/images/products/bajaj-heater.jpg', 30, 'piece', FALSE),
('Whirlpool 8.5kg Top Load', 'Fully automatic washing machine', 29999, 27999, 20, '/images/products/whirlpool-wm.jpg', 15, 'piece', TRUE),
('Godrej 190L Single Door Fridge', 'Direct cool refrigerator', 14999, 13999, 20, '/images/products/godrej-fridge.jpg', 20, 'piece', FALSE),
('Daikin 1 Ton Split AC', 'Inverter AC with PM 2.5 filter', 32999, 30999, 20, '/images/products/daikin-ac.jpg', 18, 'piece', TRUE),
('Morphy Richards OTG', '28L oven toaster griller', 6999, 6499, 20, '/images/products/morphy-otg.jpg', 25, 'piece', FALSE),
('Prestige Induction Cooktop', '2000W with preset menu', 2499, 2199, 20, '/images/products/prestige-induction.jpg', 50, 'piece', FALSE),
('Kent Water Purifier', 'RO + UV + UF + TDS controller', 16999, 15999, 20, '/images/products/kent-purifier.jpg', 22, 'piece', TRUE),
('Crompton Ceiling Fan', '1200mm with remote control', 3999, 3699, 20, '/images/products/crompton-fan.jpg', 35, 'piece', FALSE),
('V-Guard Stabilizer', '4kVA digital voltage stabilizer', 4999, 4599, 20, '/images/products/vguard-stabilizer.jpg', 30, 'piece', FALSE),
('Eureka Forbes Vacuum', 'Dry vacuum cleaner 1400W', 8999, 7999, 20, '/images/products/eureka-vacuum.jpg', 28, 'piece', TRUE),
('Panasonic Rice Cooker', '1.8L automatic rice cooker', 2999, 2799, 20, '/images/products/panasonic-rice.jpg', 45, 'piece', FALSE),
('Bajaj Juicer Mixer Grinder', '500W with 3 jars', 2799, 2499, 20, '/images/products/bajaj-jmg.jpg', 40, 'piece', FALSE),
('Blue Star Water Cooler', '20L storage capacity', 12999, 11999, 20, '/images/products/bluestar-cooler.jpg', 20, 'piece', FALSE),
('Orient Electric Heater', 'Oil filled radiator 2500W', 8999, 8299, 20, '/images/products/orient-heater.jpg', 25, 'piece', FALSE),
('Hindware Chimney', '60cm filterless auto-clean', 14999, 13999, 20, '/images/products/hindware-chimney.jpg', 18, 'piece', TRUE),
('Pigeon Gas Stove', '2 burner toughened glass top', 2999, 2699, 20, '/images/products/pigeon-stove.jpg', 35, 'piece', FALSE),
('Cello Water Heater', '25L storage geyser', 8999, 8299, 20, '/images/products/cello-geyser.jpg', 22, 'piece', FALSE),
('Maharaja Whiteline Juicer', 'Slow juicer with pulp collector', 9999, 8999, 20, '/images/products/maharaja-juicer.jpg', 20, 'piece', FALSE),
('Singer Sewing Machine', 'Electric zigzag sewing machine', 12999, 11999, 20, '/images/products/singer-machine.jpg', 15, 'piece', FALSE),
('Glen Food Processor', '600W with multiple attachments', 5999, 5499, 20, '/images/products/glen-processor.jpg', 25, 'piece', FALSE),
('Inalsa Hand Blender', '250W stick blender with chopper', 1999, 1799, 20, '/images/products/inalsa-blender.jpg', 55, 'piece', FALSE),
('Lloyd Dishwasher', '12 place settings', 32999, 30999, 20, '/images/products/lloyd-dishwasher.jpg', 12, 'piece', TRUE),
('Kelvinator Deep Freezer', '300L chest freezer', 24999, 23499, 20, '/images/products/kelvinator-freezer.jpg', 10, 'piece', FALSE),
('Videocon Washing Machine', '6kg semi-automatic', 12999, 11999, 20, '/images/products/videocon-wm.jpg', 18, 'piece', FALSE);

-- =====================
-- Products - Clothing & Fashion (category_id = 21) - 32 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Levi''s 511 Slim Jeans', 'Men''s dark wash denim', 3999, 3599, 21, '/images/products/levis-jeans.jpg', 50, 'piece', TRUE),
('Nike Dri-FIT T-Shirt', 'Men''s athletic wear', 1999, 1799, 21, '/images/products/nike-tshirt.jpg', 80, 'piece', TRUE),
('Zara Floral Dress', 'Women''s summer midi dress', 2999, 2699, 21, '/images/products/zara-dress.jpg', 40, 'piece', TRUE),
('Adidas Originals Hoodie', 'Unisex cotton blend hoodie', 4999, 4499, 21, '/images/products/adidas-hoodie.jpg', 35, 'piece', FALSE),
('H&M Denim Jacket', 'Women''s light blue jacket', 2499, 2199, 21, '/images/products/hm-jacket.jpg', 45, 'piece', FALSE),
('Tommy Hilfiger Polo', 'Men''s classic fit polo shirt', 2999, 2699, 21, '/images/products/tommy-polo.jpg', 60, 'piece', FALSE),
('Forever 21 Crop Top', 'Women''s trendy crop top', 899, 799, 21, '/images/products/f21-crop.jpg', 70, 'piece', FALSE),
('Wrangler Cargo Shorts', 'Men''s utility shorts', 1999, 1799, 21, '/images/products/wrangler-shorts.jpg', 55, 'piece', FALSE),
('Mango Blazer', 'Women''s formal blazer', 4999, 4299, 21, '/images/products/mango-blazer.jpg', 25, 'piece', TRUE),
('Calvin Klein Underwear', 'Men''s cotton briefs pack of 3', 1999, 1699, 21, '/images/products/ck-underwear.jpg', 90, 'piece', FALSE),
('Uniqlo Heattech', 'Women''s thermal wear', 1499, 1299, 21, '/images/products/uniqlo-thermal.jpg', 65, 'piece', FALSE),
('Puma Track Pants', 'Men''s joggers', 2499, 2199, 21, '/images/products/puma-track.jpg', 45, 'piece', FALSE),
('Vero Moda Top', 'Women''s casual blouse', 1799, 1599, 21, '/images/products/vero-top.jpg', 50, 'piece', FALSE),
('Lee Cooper Jeans', 'Men''s regular fit jeans', 2999, 2599, 21, '/images/products/lee-jeans.jpg', 40, 'piece', FALSE),
('Only Skirt', 'Women''s A-line mini skirt', 1499, 1299, 21, '/images/products/only-skirt.jpg', 35, 'piece', FALSE),
('Jack & Jones Shirt', 'Men''s casual shirt', 2499, 2199, 21, '/images/products/jj-shirt.jpg', 45, 'piece', FALSE),
('Marks & Spencer Sweater', 'Women''s wool blend sweater', 3999, 3499, 21, '/images/products/ms-sweater.jpg', 30, 'piece', FALSE),
('Pepe Jeans T-Shirt', 'Men''s graphic tee', 1799, 1599, 21, '/images/products/pepe-tee.jpg', 60, 'piece', FALSE),
('Global Desi Kurti', 'Women''s ethnic wear', 1999, 1799, 21, '/images/products/global-kurti.jpg', 55, 'piece', TRUE),
('Arrow Formal Shirt', 'Men''s office wear', 2999, 2699, 21, '/images/products/arrow-shirt.jpg', 40, 'piece', FALSE),
('AND Palazzo Pants', 'Women''s wide leg pants', 2499, 2199, 21, '/images/products/and-palazzo.jpg', 35, 'piece', FALSE),
('Van Heusen Chinos', 'Men''s casual trousers', 3499, 3199, 21, '/images/products/vh-chinos.jpg', 30, 'piece', FALSE),
('Lifestyle Maxi Dress', 'Women''s long dress', 2999, 2599, 21, '/images/products/lifestyle-maxi.jpg', 25, 'piece', FALSE),
('Peter England Blazer', 'Men''s formal blazer', 5999, 5399, 21, '/images/products/pe-blazer.jpg', 20, 'piece', TRUE),
('W for Woman Jumpsuit', 'Women''s casual jumpsuit', 3499, 3099, 21, '/images/products/w-jumpsuit.jpg', 22, 'piece', FALSE),
('Allen Solly Polo', 'Men''s polo t-shirt', 1999, 1799, 21, '/images/products/as-polo.jpg', 50, 'piece', FALSE),
('Biba Salwar Suit', 'Women''s traditional wear', 4999, 4499, 21, '/images/products/biba-suit.jpg', 18, 'piece', TRUE),
('Flying Machine Jeans', 'Men''s skinny fit jeans', 2799, 2499, 21, '/images/products/fm-jeans.jpg', 35, 'piece', FALSE),
('Aurelia Tops', 'Women''s ethnic tops', 1499, 1299, 21, '/images/products/aurelia-top.jpg', 45, 'piece', FALSE),
('Blackberrys Suit', 'Men''s 2-piece formal suit', 12999, 11999, 21, '/images/products/bb-suit.jpg', 15, 'piece', TRUE),
('Max Fashion Dress', 'Women''s party wear dress', 2499, 2199, 21, '/images/products/max-dress.jpg', 30, 'piece', FALSE),
('Killer Jeans', 'Men''s distressed denim', 2999, 2699, 21, '/images/products/killer-jeans.jpg', 28, 'piece', FALSE);

-- =====================
-- Products - TV & Entertainment (category_id = 22) - 30 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Samsung 55" QLED 4K TV', 'Smart TV with Quantum Dot technology', 89999, 84999, 22, '/images/products/samsung-qled.jpg', 15, 'piece', TRUE),
('LG 65" OLED TV', 'Self-lit pixels with perfect black', 149999, 139999, 22, '/images/products/lg-oled.jpg', 8, 'piece', TRUE),
('Sony 50" Bravia XR', '4K HDR Google TV', 79999, 74999, 22, '/images/products/sony-bravia-xr.jpg', 12, 'piece', TRUE),
('TCL 43" P735 4K TV', 'Android TV with voice control', 34999, 31999, 22, '/images/products/tcl-p735.jpg', 25, 'piece', FALSE),
('Mi TV 5X 55"', '4K UHD Smart Android TV', 44999, 41999, 22, '/images/products/mi-tv5x.jpg', 20, 'piece', TRUE),
('OnePlus TV Y1S 43"', 'Full HD Android TV', 29999, 27999, 22, '/images/products/oneplus-y1s.jpg', 30, 'piece', FALSE),
('VU Premium 50" 4K TV', 'Android TV with Netflix', 39999, 36999, 22, '/images/products/vu-premium.jpg', 18, 'piece', FALSE),
('Realme Smart TV 43"', 'Full HD with Dolby Audio', 24999, 22999, 22, '/images/products/realme-tv.jpg', 35, 'piece', FALSE),
('Fire TV Stick 4K Max', 'Streaming device with Alexa', 6999, 5999, 22, '/images/products/firestick-4k.jpg', 100, 'piece', TRUE),
('Chromecast with Google TV', '4K streaming device', 6999, 6299, 22, '/images/products/chromecast.jpg', 80, 'piece', FALSE),
('Apple TV 4K', '64GB streaming box', 18999, 17499, 22, '/images/products/apple-tv.jpg', 25, 'piece', TRUE),
('Roku Ultra', '4K streaming player', 9999, 8999, 22, '/images/products/roku-ultra.jpg', 40, 'piece', FALSE),
('JBL Cinema SB241', 'Bluetooth soundbar', 7999, 7299, 22, '/images/products/jbl-soundbar.jpg', 30, 'piece', FALSE),
('Sony HT-S20R', '5.1ch soundbar with subwoofer', 14999, 13499, 22, '/images/products/sony-soundbar.jpg', 20, 'piece', TRUE),
('Yamaha YAS-209', 'Soundbar with wireless subwoofer', 24999, 22999, 22, '/images/products/yamaha-soundbar.jpg', 15, 'piece', TRUE),
('Boat Aavante Bar 1700', 'Bluetooth soundbar 120W', 8999, 7999, 22, '/images/products/boat-soundbar.jpg', 35, 'piece', FALSE),
('Panasonic 32" LED TV', 'HD Ready with USB media player', 17999, 16499, 22, '/images/products/panasonic-led.jpg', 40, 'piece', FALSE),
('Kodak 50" 4K TV', 'Smart TV with voice remote', 32999, 29999, 22, '/images/products/kodak-tv.jpg', 22, 'piece', FALSE),
('Thomson 40" Full HD TV', 'Smart Android TV', 19999, 18499, 22, '/images/products/thomson-tv.jpg', 28, 'piece', FALSE),
('Blaupunkt 43" Android TV', '4K UHD with Google Assistant', 27999, 25999, 22, '/images/products/blaupunkt-tv.jpg', 20, 'piece', FALSE),
('Nvidia Shield TV Pro', 'AI-enhanced 4K streaming', 19999, 18499, 22, '/images/products/nvidia-shield.jpg', 15, 'piece', TRUE),
('Mi Box 4K', 'Android TV streaming box', 3999, 3599, 22, '/images/products/mi-box.jpg', 60, 'piece', FALSE),
('Zebronics Soundbar', 'Zeb-Juke Bar 9700 Pro', 12999, 11499, 22, '/images/products/zebronics-bar.jpg', 25, 'piece', FALSE),
('F&D T-60X', '5.1 multimedia speakers', 5999, 5399, 22, '/images/products/fd-speakers.jpg', 30, 'piece', FALSE),
('Creative Pebble V3', 'USB-C desktop speakers', 4999, 4499, 22, '/images/products/creative-pebble.jpg', 45, 'piece', FALSE),
('Logitech Z313', '2.1 speaker system', 2999, 2699, 22, '/images/products/logitech-z313.jpg', 50, 'piece', FALSE),
('Philips 50" 4K TV', 'Ambilight Android TV', 54999, 49999, 22, '/images/products/philips-ambilight.jpg', 12, 'piece', TRUE),
('Toshiba 43" Fire TV', 'Built-in Fire TV experience', 28999, 26999, 22, '/images/products/toshiba-fire.jpg', 18, 'piece', FALSE),
('Hisense 55" ULED TV', 'Quantum Dot 4K smart TV', 49999, 45999, 22, '/images/products/hisense-uled.jpg', 15, 'piece', FALSE),
('Motorola 32" HD TV', 'Android TV with Chromecast', 13999, 12999, 22, '/images/products/motorola-tv.jpg', 35, 'piece', FALSE);

-- =====================
-- Products - Books & Media (category_id = 23) - 30 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('The Alchemist', 'Paulo Coelho - Paperback', 299, 249, 23, '/images/products/alchemist.jpg', 100, 'piece', TRUE),
('Atomic Habits', 'James Clear - Self Help', 599, 499, 23, '/images/products/atomic-habits.jpg', 80, 'piece', TRUE),
('Rich Dad Poor Dad', 'Robert Kiyosaki - Finance', 399, 349, 23, '/images/products/rich-dad.jpg', 90, 'piece', TRUE),
('Think and Grow Rich', 'Napoleon Hill - Classic', 299, 249, 23, '/images/products/think-grow.jpg', 70, 'piece', FALSE),
('Sapiens', 'Yuval Noah Harari - History', 699, 599, 23, '/images/products/sapiens.jpg', 60, 'piece', TRUE),
('The Power of Now', 'Eckhart Tolle - Spirituality', 499, 399, 23, '/images/products/power-now.jpg', 55, 'piece', FALSE),
('Wings of Fire', 'A.P.J. Abdul Kalam - Biography', 199, 179, 23, '/images/products/wings-fire.jpg', 120, 'piece', TRUE),
('Ikigai', 'Japanese Art of Living', 399, 349, 23, '/images/products/ikigai.jpg', 85, 'piece', FALSE),
('Harry Potter Box Set', 'Complete 7 book collection', 2999, 2499, 23, '/images/products/hp-boxset.jpg', 25, 'piece', TRUE),
('The Subtle Art', 'Mark Manson - Self Help', 499, 399, 23, '/images/products/subtle-art.jpg', 75, 'piece', FALSE),
('Kindle Paperwhite', '11th Gen e-reader 16GB', 13999, 12999, 23, '/images/products/kindle.jpg', 40, 'piece', TRUE),
('National Geographic Kids', 'Annual subscription', 999, 899, 23, '/images/products/natgeo-kids.jpg', 50, 'piece', FALSE),
('India Today Magazine', '1 year subscription', 1200, 999, 23, '/images/products/india-today.jpg', 100, 'piece', FALSE),
('The Hindu Newspaper', '6 months subscription', 1500, 1299, 23, '/images/products/hindu-news.jpg', 200, 'piece', FALSE),
('Spotify Premium', '1 year music streaming', 1189, 999, 23, '/images/products/spotify.jpg', 500, 'piece', TRUE),
('Netflix Premium', '3 months subscription', 2997, 2499, 23, '/images/products/netflix.jpg', 300, 'piece', TRUE),
('Amazon Prime Video', '1 year subscription', 1499, 1299, 23, '/images/products/prime-video.jpg', 400, 'piece', FALSE),
('Disney+ Hotstar', '1 year super subscription', 1499, 1199, 23, '/images/products/hotstar.jpg', 350, 'piece', FALSE),
('Audible Audiobooks', '3 months subscription', 1497, 1199, 23, '/images/products/audible.jpg', 250, 'piece', FALSE),
('Comic Collection Marvel', 'Top 10 comics bundle', 1999, 1699, 23, '/images/products/marvel-comics.jpg', 30, 'piece', FALSE),
('Champak Magazine', '1 year kids subscription', 600, 499, 23, '/images/products/champak.jpg', 80, 'piece', FALSE),
('Amar Chitra Katha', 'Set of 20 classic stories', 1999, 1799, 23, '/images/products/ack-set.jpg', 45, 'piece', FALSE),
('Tinkle Digest', 'Annual collection', 799, 699, 23, '/images/products/tinkle.jpg', 60, 'piece', FALSE),
('Learn Python Book', 'Programming for beginners', 899, 749, 23, '/images/products/python-book.jpg', 40, 'piece', FALSE),
('NCERT Class 12 Set', 'Complete subject books', 1500, 1299, 23, '/images/products/ncert-12.jpg', 35, 'piece', TRUE),
('JEE Main Guide 2024', 'Physics Chemistry Maths', 1999, 1699, 23, '/images/products/jee-guide.jpg', 50, 'piece', TRUE),
('NEET Preparation Kit', 'Biology Physics Chemistry', 2499, 2199, 23, '/images/products/neet-kit.jpg', 40, 'piece', TRUE),
('Encyclopedia Britannica', 'Kids version 10 volumes', 4999, 4299, 23, '/images/products/britannica.jpg', 20, 'piece', FALSE),
('Atlas World Geography', 'Detailed world atlas', 799, 699, 23, '/images/products/world-atlas.jpg', 55, 'piece', FALSE),
('Dictionary English', 'Oxford advanced learners', 1299, 1099, 23, '/images/products/oxford-dict.jpg', 65, 'piece', FALSE);

-- =====================
-- Products - Sports & Fitness (category_id = 24) - 30 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Treadmill Manual', 'Home fitness treadmill', 15999, 14999, 24, '/images/products/manual-treadmill.jpg', 20, 'piece', TRUE),
('Dumbbells Set 20kg', 'Adjustable weight dumbbells', 3999, 3599, 24, '/images/products/dumbbells.jpg', 35, 'piece', TRUE),
('Yoga Mat Premium', 'Non-slip exercise mat', 1999, 1699, 24, '/images/products/yoga-mat.jpg', 80, 'piece', FALSE),
('Cricket Bat Kashmir Willow', 'Professional grade bat', 2999, 2699, 24, '/images/products/cricket-bat.jpg', 40, 'piece', TRUE),
('Football Nike Size 5', 'Official match football', 2499, 2199, 24, '/images/products/nike-football.jpg', 50, 'piece', FALSE),
('Badminton Racket Yonex', 'Professional badminton racket', 4999, 4499, 24, '/images/products/yonex-racket.jpg', 30, 'piece', TRUE),
('Table Tennis Set', 'Complete TT set with net', 2999, 2699, 24, '/images/products/tt-set.jpg', 25, 'piece', FALSE),
('Gym Gloves', 'Weight lifting gloves', 799, 699, 24, '/images/products/gym-gloves.jpg', 60, 'piece', FALSE),
('Protein Shaker Bottle', 'BPA free shaker 600ml', 499, 399, 24, '/images/products/shaker.jpg', 100, 'piece', FALSE),
('Resistance Bands Set', '5 bands with door anchor', 1499, 1299, 24, '/images/products/resistance-bands.jpg', 70, 'piece', FALSE),
('Elliptical Cross Trainer', 'Home cardio equipment', 24999, 22999, 24, '/images/products/elliptical.jpg', 15, 'piece', TRUE),
('Cycle Gear MTB', '21 speed mountain bike', 18999, 16999, 24, '/images/products/mtb-cycle.jpg', 12, 'piece', TRUE),
('Swimming Goggles', 'Anti-fog professional goggles', 899, 799, 24, '/images/products/swim-goggles.jpg', 45, 'piece', FALSE),
('Tennis Racket Wilson', 'Professional tennis racket', 5999, 5399, 24, '/images/products/wilson-racket.jpg', 20, 'piece', FALSE),
('Basketball Spalding', 'Official size basketball', 1999, 1799, 24, '/images/products/spalding-ball.jpg', 35, 'piece', FALSE),
('Volleyball Mikasa', 'International standard volleyball', 1799, 1599, 24, '/images/products/mikasa-volleyball.jpg', 40, 'piece', FALSE),
('Skipping Rope', 'Speed rope with counter', 599, 499, 24, '/images/products/skipping-rope.jpg', 80, 'piece', FALSE),
('Push Up Bars', 'Ergonomic push up handles', 799, 699, 24, '/images/products/pushup-bars.jpg', 55, 'piece', FALSE),
('Exercise Ball 65cm', 'Anti-burst gym ball', 1299, 1099, 24, '/images/products/exercise-ball.jpg', 45, 'piece', FALSE),
('Kettlebell 12kg', 'Cast iron kettlebell', 2499, 2199, 24, '/images/products/kettlebell.jpg', 30, 'piece', FALSE),
('Ab Roller Wheel', 'Core strengthening equipment', 899, 799, 24, '/images/products/ab-roller.jpg', 50, 'piece', FALSE),
('Pull Up Bar', 'Doorway pull up bar', 1999, 1799, 24, '/images/products/pullup-bar.jpg', 40, 'piece', FALSE),
('Bench Press Adjustable', 'Multi-position weight bench', 8999, 7999, 24, '/images/products/bench-press.jpg', 18, 'piece', TRUE),
('Barbell Set 50kg', 'Olympic barbell with plates', 12999, 11999, 24, '/images/products/barbell-set.jpg', 15, 'piece', TRUE),
('Running Shoes Nike', 'Men''s running shoes', 6999, 5999, 24, '/images/products/nike-running.jpg', 40, 'piece', TRUE),
('Sports Watch Garmin', 'GPS fitness tracker', 24999, 22999, 24, '/images/products/garmin-watch.jpg', 25, 'piece', TRUE),
('Gym Bag', 'Sports duffel bag 40L', 1999, 1699, 24, '/images/products/gym-bag.jpg', 50, 'piece', FALSE),
('Water Bottle Insulated', '1L stainless steel bottle', 1499, 1299, 24, '/images/products/water-bottle1.jpg', 65, 'piece', FALSE),
('Foam Roller', 'Muscle recovery foam roller', 1999, 1799, 24, '/images/products/foam-roller.jpg', 35, 'piece', FALSE),
('Agility Ladder', 'Speed and agility training', 1299, 1099, 24, '/images/products/agility-ladder.jpg', 30, 'piece', FALSE);

-- =====================
-- Products - Beauty & Personal Care (category_id = 25) - 30 products
-- =====================
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Lakme Absolute Foundation', 'Full coverage liquid foundation', 1399, 1199, 25, '/images/products/lakme-foundation.jpg', 60, 'piece', TRUE),
('Maybelline Mascara', 'Lash Sensational waterproof', 899, 799, 25, '/images/products/maybelline-mascara.jpg', 80, 'piece', FALSE),
('Nivea Moisturizer', 'Daily essentials body lotion', 299, 249, 25, '/images/products/nivea-lotion.jpg', 100, 'piece', FALSE),
('L''Oreal Shampoo', 'Total Repair 5 hair shampoo', 399, 349, 25, '/images/products/loreal-shampoo.jpg', 90, 'piece', FALSE),
('Dove Soap Bar', 'Beauty bar with moisturizer', 199, 179, 25, '/images/products/dove-soap.jpg', 150, 'piece', FALSE),
('Himalaya Face Wash', 'Neem purifying face wash', 199, 169, 25, '/images/products/himalaya-facewash.jpg', 120, 'piece', FALSE),
('Garnier Serum', 'Vitamin C brightening serum', 699, 599, 25, '/images/products/garnier-serum.jpg', 70, 'piece', TRUE),
('Biotique Sunscreen', 'SPF 50 morning nectar', 399, 349, 25, '/images/products/biotique-sunscreen.jpg', 85, 'piece', FALSE),
('Philips Hair Dryer', '1600W foldable hair dryer', 1999, 1799, 25, '/images/products/philips-dryer.jpg', 35, 'piece', TRUE),
('Veet Hair Removal Cream', 'Silk & Fresh technology', 299, 249, 25, '/images/products/veet-cream.jpg', 80, 'piece', FALSE),
('The Body Shop Cream', 'Vitamin E intense moisture', 1299, 1099, 25, '/images/products/bodyshop-cream.jpg', 40, 'piece', TRUE),
('Forest Essentials Soap', 'Luxury handmade soap', 799, 699, 25, '/images/products/forest-soap.jpg', 45, 'piece', FALSE),
('Plum Green Tea Toner', 'Alcohol-free facial toner', 499, 449, 25, '/images/products/plum-toner.jpg', 55, 'piece', FALSE),
('Mamaearth Vitamin C', 'Face wash with turmeric', 349, 299, 25, '/images/products/mamaearth-facewash.jpg', 75, 'piece', FALSE),
('WOW Shampoo', 'Apple cider vinegar shampoo', 599, 499, 25, '/images/products/wow-shampoo.jpg', 60, 'piece', FALSE),
('Khadi Herbal Hair Oil', 'Ayurvedic hair growth oil', 299, 249, 25, '/images/products/khadi-oil.jpg', 70, 'piece', FALSE),
('Colorbar Lipstick', 'Velvet matte lipstick', 799, 699, 25, '/images/products/colorbar-lipstick.jpg', 90, 'piece', FALSE),
('Braun Electric Shaver', 'Men''s wet & dry shaver', 4999, 4499, 25, '/images/products/braun-shaver.jpg', 25, 'piece', TRUE),
('Gillette Razor', 'Fusion5 ProGlide razor', 899, 799, 25, '/images/products/gillette-razor.jpg', 65, 'piece', FALSE),
('Old Spice Deodorant', 'Lasting protection 150ml', 399, 349, 25, '/images/products/oldspice-deo.jpg', 85, 'piece', FALSE);

-- Home & Kitchen Products (30 items) - category_id = 26
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Non-Stick Cookware Set', 'Premium 12-piece non-stick cookware set with heat-resistant handles', 4500.00, 3999.00, 26, '/images/products/cookware-set.jpg', 25, 'set', TRUE),
('Stainless Steel Pressure Cooker', 'Heavy-duty 5L stainless steel pressure cooker with safety valve', 2800.00, 2499.00, 26, '/images/products/pressure-cooker1.jpg', 40, 'piece', TRUE),
('Ceramic Dinner Set', 'Elegant 24-piece ceramic dinner set for 6 people', 3200.00, 2799.00, 26, '/images/products/dinner-set.jpg', 30, 'set', FALSE),
('Memory Foam Pillow', 'Orthopedic memory foam pillow for better sleep', 1200.00, 999.00, 26, '/images/products/memory-pillow.jpg', 80, 'piece', FALSE),
('LED Table Lamp', 'Adjustable LED table lamp with touch control', 1800.00, 1599.00, 26, '/images/products/led-lamp.jpg', 60, 'piece', TRUE),
('Wooden Coffee Table', 'Solid wood coffee table with storage compartment', 8500.00, 7999.00, 26, '/images/products/coffee-table.jpg', 15, 'piece', FALSE),
('Microwave Oven', '25L convection microwave with auto-cook menu', 12000.00, 10999.00, 26, '/images/products/microwave.jpg', 20, 'piece', TRUE),
('Kitchen Knife Set', 'Professional 8-piece stainless steel knife set with wooden block', 2200.00, 1899.00, 26, '/images/products/knife-set.jpg', 45, 'set', FALSE),
('Vacuum Cleaner', 'Bagless cyclonic vacuum cleaner with HEPA filter', 8900.00, 7999.00, 26, '/images/products/vacuum-cleaner.jpg', 25, 'piece', TRUE),
('Sofa Set', '3+2 seater fabric sofa set with cushions', 25000.00, 22999.00, 26, '/images/products/sofa-set.jpg', 10, 'set', FALSE),
('Air Fryer', '4L digital air fryer with temperature control', 5500.00, 4999.00, 26, '/images/products/air-fryer.jpg', 35, 'piece', TRUE),
('Bed Sheet Set', '100% cotton double bed sheet set with pillow covers', 1500.00, 1299.00, 26, '/images/products/bed-sheets.jpg', 70, 'set', FALSE),
('Wall Mirror', 'Decorative round wall mirror with golden frame', 2800.00, 2499.00, 26, '/images/products/wall-mirror.jpg', 40, 'piece', FALSE),
('Rice Cooker', 'Electric rice cooker with keep-warm function, 1.8L capacity', 3200.00, 2899.00, 26, '/images/products/rice-cooker.jpg', 50, 'piece', FALSE),
('Curtain Set', 'Blackout curtains set with tie-backs, 2 panels', 1800.00, 1599.00, 26, '/images/products/curtains.jpg', 60, 'set', FALSE),
('Blender', 'High-speed blender with multiple speed settings', 3500.00, 3199.00, 26, '/images/products/blender.jpg', 45, 'piece', TRUE),
('Dining Table', '6-seater wooden dining table with chairs', 18000.00, 16999.00, 26, '/images/products/dining-table.jpg', 8, 'set', FALSE),
('Toaster', '4-slice pop-up toaster with browning control', 2500.00, 2199.00, 26, '/images/products/toaster.jpg', 55, 'piece', FALSE),
('Storage Containers', 'Airtight food storage containers set of 10', 1200.00, 999.00, 26, '/images/products/storage-containers.jpg', 85, 'set', FALSE),
('Electric Kettle', 'Stainless steel electric kettle with auto shut-off', 1800.00, 1599.00, 26, '/images/products/electric-kettle.jpg', 70, 'piece', TRUE),
('Floor Lamp', 'Modern tripod floor lamp with fabric shade', 4200.00, 3799.00, 26, '/images/products/floor-lamp.jpg', 30, 'piece', FALSE),
('Chopping Board Set', 'Bamboo chopping board set with different sizes', 800.00, 699.00, 26, '/images/products/chopping-boards.jpg', 90, 'set', FALSE),
('Wardrobe', '3-door wooden wardrobe with mirror and drawers', 22000.00, 19999.00, 26, '/images/products/wardrobe.jpg', 12, 'piece', FALSE),
('Food Processor', 'Multi-function food processor with various attachments', 6500.00, 5999.00, 26, '/images/products/food-processor.jpg', 25, 'piece', TRUE),
('Bathroom Mat Set', 'Anti-slip bathroom mat set with toilet cover', 900.00, 799.00, 26, '/images/products/bathroom-mats.jpg', 65, 'set', FALSE),
('Coffee Maker', 'Automatic drip coffee maker with programmable timer', 4800.00, 4299.00, 26, '/images/products/coffee-maker.jpg', 35, 'piece', FALSE),
('Bookshelf', '5-tier wooden bookshelf with adjustable shelves', 5500.00, 4999.00, 26, '/images/products/bookshelf.jpg', 20, 'piece', FALSE),
('Iron', 'Steam iron with ceramic soleplate and spray function', 2200.00, 1899.00, 26, '/images/products/steam-iron.jpg', 60, 'piece', FALSE),
('Trash Can', 'Stainless steel pedal trash can with removable liner', 1500.00, 1299.00, 26, '/images/products/trash-can.jpg', 75, 'piece', FALSE),
('Wall Clock', 'Decorative wooden wall clock with silent movement', 1200.00, 999.00, 26, '/images/products/wall-clock.jpg', 80, 'piece', FALSE);

-- Automotive Products (30 items) - category_id = 27
INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, unit, is_featured) VALUES
('Car Seat Covers', 'Premium leather car seat covers set for 5-seater', 3500.00, 2999.00, 27, '/images/products/seat-covers.jpg', 40, 'set', TRUE),
('Car Dashboard Camera', 'Full HD 1080p dashboard camera with night vision', 5500.00, 4999.00, 27, '/images/products/dash-cam.jpg', 35, 'piece', TRUE),
('Car Air Freshener', 'Long-lasting gel car air freshener, multiple fragrances', 250.00, 199.00, 27, '/images/products/air-freshener.jpg', 200, 'piece', FALSE),
('Tire Pressure Gauge', 'Digital tire pressure gauge with LED display', 800.00, 699.00, 27, '/images/products/pressure-gauge.jpg', 80, 'piece', FALSE),
('Car Phone Holder', 'Magnetic car phone holder for dashboard', 600.00, 499.00, 27, '/images/products/phone-holder.jpg', 120, 'piece', TRUE),
('Jump Starter Kit', 'Portable car jump starter with power bank function', 4500.00, 3999.00, 27, '/images/products/jump-starter.jpg', 25, 'piece', TRUE),
('Car Floor Mats', 'Waterproof rubber car floor mats set of 4', 1200.00, 999.00, 27, '/images/products/floor-mats.jpg', 60, 'set', FALSE),
('Engine Oil', 'Synthetic engine oil 5W-30, 4L container', 1800.00, 1599.00, 27, '/images/products/engine-oil.jpg', 100, 'bottle', FALSE),
('Car Wax', 'Premium car wax for paint protection and shine', 900.00, 799.00, 27, '/images/products/car-wax.jpg', 85, 'bottle', FALSE),
('Brake Fluid', 'DOT 4 brake fluid for all vehicle types', 450.00, 399.00, 27, '/images/products/brake-fluid.jpg', 150, 'bottle', FALSE),
('Car Charger', 'Dual USB car charger with fast charging', 800.00, 699.00, 27, '/images/products/car-charger.jpg', 90, 'piece', TRUE),
('Windshield Wipers', 'All-season windshield wiper blades set', 1200.00, 999.00, 27, '/images/products/wipers.jpg', 70, 'set', FALSE),
('Car Vacuum Cleaner', 'Portable 12V car vacuum cleaner with attachments', 2500.00, 2199.00, 27, '/images/products/car-vacuum.jpg', 45, 'piece', FALSE),
('Steering Wheel Cover', 'Leather steering wheel cover with ergonomic grip', 800.00, 699.00, 27, '/images/products/steering-cover.jpg', 75, 'piece', FALSE),
('Car Tool Kit', 'Complete car emergency tool kit with carry case', 2200.00, 1899.00, 27, '/images/products/tool-kit.jpg', 50, 'set', TRUE),
('Coolant', 'Radiator coolant concentrate, 1L bottle', 550.00, 499.00, 27, '/images/products/coolant.jpg', 120, 'bottle', FALSE),
('Car Sunshade', 'Foldable windshield sunshade for UV protection', 400.00, 349.00, 27, '/images/products/sunshade.jpg', 100, 'piece', FALSE),
('Spark Plugs', 'Iridium spark plugs set of 4 for better performance', 1600.00, 1399.00, 27, '/images/products/spark-plugs.jpg', 65, 'set', FALSE),
('Car Polish', 'Scratch remover car polish with microfiber cloth', 750.00, 649.00, 27, '/images/products/car-polish.jpg', 80, 'bottle', FALSE),
('Battery Terminal Cleaner', 'Battery terminal cleaner spray for corrosion removal', 350.00, 299.00, 27, '/images/products/battery-cleaner.jpg', 110, 'bottle', FALSE),
('Car Cover', 'Waterproof car cover for outdoor protection', 2800.00, 2499.00, 27, '/images/products/car-cover.jpg', 30, 'piece', FALSE),
('Tire Shine Spray', 'Professional tire shine spray for glossy finish', 600.00, 529.00, 27, '/images/products/tire-shine.jpg', 95, 'bottle', FALSE),
('Car Organizer', 'Multi-pocket car trunk organizer with compartments', 1200.00, 999.00, 27, '/images/products/car-organizer.jpg', 55, 'piece', FALSE),
('Air Filter', 'High-performance engine air filter for better airflow', 800.00, 699.00, 27, '/images/products/air-filter.jpg', 85, 'piece', FALSE),
('Car Bluetooth Speaker', 'Portable Bluetooth speaker with car mount', 2200.00, 1899.00, 27, '/images/products/bluetooth-speaker.jpg', 40, 'piece', TRUE),
('Transmission Fluid', 'Automatic transmission fluid, 1L bottle', 650.00, 579.00, 27, '/images/products/transmission-fluid.jpg', 90, 'bottle', FALSE),
('Car LED Lights', 'LED headlight bulbs H4 with bright white light', 1500.00, 1299.00, 27, '/images/products/led-lights.jpg', 60, 'pair', FALSE),
('Tire Repair Kit', 'Emergency tire puncture repair kit with sealant', 1100.00, 949.00, 27, '/images/products/tire-repair.jpg', 70, 'kit', FALSE),
('Car Perfume', 'Premium car perfume with long-lasting fragrance', 450.00, 399.00, 27, '/images/products/car-perfume.jpg', 130, 'piece', FALSE),
('Windshield Washer Fluid', 'All-season windshield washer fluid concentrate', 300.00, 259.00, 27, '/images/products/washer-fluid.jpg', 140, 'bottle', FALSE);

-- Insert delivery personnel
-- INSERT INTO delivery_personnel (name, phone, email, password, is_available, current_location) VALUES
-- ('Raj Kumar', '9876543210', 'raj@quickcommerce.com', '$2b$10$LKg1cUpCgqTqIEFyZP8e9eR0MRGTLTfXe1VUY5DM6KTbYMzzw8Icu', TRUE, 'Bangalore, Indiranagar'),
-- ('Priya Singh', '8765432109', 'priya@quickcommerce.com', '$2b$10$LKg1cUpCgqTqIEFyZP8e9eR0MRGTLTfXe1VUY5DM6KTbYMzzw8Icu', TRUE, 'Bangalore, Koramangala'),
-- ('Amit Patel', '7654321098', 'amit@quickcommerce.com', '$2b$10$LKg1cUpCgqTqIEFyZP8e9eR0MRGTLTfXe1VUY5DM6KTbYMzzw8Icu', FALSE, 'Bangalore, Electronic City');

-- Create sample orders
INSERT INTO orders (user_id, address_id, total_amount, delivery_fee, status, payment_method, payment_status, estimated_delivery_time) VALUES
(2, 1, 325.00, 20.00, 'delivered', 'upi', 'completed', NOW() - INTERVAL '2 days'),
(3, 3, 695.00, 0.00, 'out_for_delivery', 'card', 'completed', NOW() + INTERVAL '30 minutes'),
(4, 4, 540.00, 20.00, 'pending', 'cash_on_delivery', 'pending', NOW() + INTERVAL '50 minutes');

-- Set actual delivery time for delivered order
UPDATE orders SET actual_delivery_time = estimated_delivery_time + INTERVAL '10 minutes' WHERE order_id = 1;

-- Add order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 2, 99.00),
(1, 5, 1, 65.00),
(1, 9, 1, 40.00),
(2, 13, 2, 45.00),
(2, 14, 1, 55.00),
(2, 17, 1, 230.00),
(2, 20, 2, 130.00),
(3, 2, 2, 69.00),
(3, 6, 1, 80.00),
(3, 10, 1, 110.00),
(3, 15, 1, 200.00);

-- Add order tracking data
-- INSERT INTO order_tracking (order_id, personnel_id, status, location, timestamp) VALUES
-- (1, 1, 'confirmed', 'Warehouse', NOW() - INTERVAL '2 days'),
-- (1, 1, 'processing', 'Warehouse', NOW() - INTERVAL '2 days'),
-- (1, 1, 'out_for_delivery', 'En route to customer', NOW() - INTERVAL '2 days'),
-- (1, 1, 'delivered', 'Customer address', NOW() - INTERVAL '2 days'),
-- (2, 2, 'confirmed', 'Warehouse', NOW() - INTERVAL '30 minutes'),
-- (2, 2, 'processing', 'Warehouse', NOW() - INTERVAL '20 minutes'),
-- (2, 2, 'out_for_delivery', 'En route to customer', NOW()),
-- (3, NULL, 'pending', 'Order received', NOW());

-- Create sample cart for users
INSERT INTO cart (user_id) VALUES (2), (3), (4);

-- Add items to carts
INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1, 3, 2),
(1, 7, 1),
(1, 11, 1),
(2, 2, 3),
(2, 8, 2),
(3, 4, 1),
(3, 12, 2),
(3, 16, 1);

UPDATE users
SET is_admin = TRUE
WHERE name = 'Sanskar Sharma';