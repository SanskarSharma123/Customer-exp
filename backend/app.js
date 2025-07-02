const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config();


// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const SENTIMENT_API_URL = process.env.SENTIMENT_API_URL || "http://localhost:5001";
// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'vidya',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'commerce_database',
  password: process.env.DB_PASSWORD || 'commerceproject',
  port: process.env.DB_PORT || 5432,
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'quickcommerce-secret-key';

// Middleware to authenticate JWT
// const authenticateToken = (req, res, next) => {
//   const token = req.cookies.token;
  
//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized: No token provided' });
//   }

//   jwt.verify(token, JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(403).json({ message: 'Forbidden: Invalid token' });
//     }
//     req.user = decoded;
//     next();
//   });
// };
const authenticateToken = (req, res, next) => {
  let token = req.cookies.token;

  // Fallback to manually parsing from raw headers if not found in req.cookies
  if (!token && req.headers.cookie) {
    const tokenMatch = req.headers.cookie.match(/token=([^;]+)/);
    if (tokenMatch) {
      token = tokenMatch[1];
    }
  }

  // Fallback to Authorization header: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Admin rights required' });
  }
  next();
};

// Check login status endpoint
app.get('/api/isLoggedIn', (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.json({ message: 'Not logged in' });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ message: 'Logged in' });
  } catch (error) {
    return res.json({ message: 'Not logged in' });
  }
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// User registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if email already exists
    const existingUsers = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUsers.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING user_id',
      [name, email, hashedPassword, phone]
    );
    
    // Create cart for the new user
    await pool.query('INSERT INTO cart (user_id) VALUES ($1)', [result.rows[0].user_id]);
    
    res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].user_id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Get all reviews with user and product details
const getAllReviewsWithDetails = async () => {
  const query = `
    SELECT 
      r.review_id,
      r.product_id,
      r.user_id,
      r.rating,
      r.comment,
      r.sentiment_score,
      r.sentiment_label,
      r.sentiment_confidence,
      r.created_at,
      r.updated_at,
      u.name as user_name,
      u.email as user_email,
      p.name as product_name,
      p.image_url as product_image
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    JOIN products p ON r.product_id = p.product_id
    ORDER BY r.created_at DESC
  `;
  
  const result = await pool.query(query);
  return result.rows;
};
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.*, 
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
        COUNT(r.review_id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.product_id = r.product_id
      GROUP BY p.product_id
    `);
    res.json(products.rows);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (users.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users.rows[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const users = await pool.query(
      'SELECT user_id, name, email, phone, created_at, is_admin AS "isAdmin" FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (users.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user addresses
    const addresses = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1',
      [req.user.userId]
    );
    
    res.json({
      user: users.rows[0],
      addresses: addresses.rows
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Add new address
// Add new address
app.post('/api/addresses', authenticateToken, async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, state, postalCode, isDefault, latitude, longitude } = req.body;
    
    // If this address is set as default, unset all other defaults
    if (isDefault) {
      await pool.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.userId]
      );
    }
    
    const result = await pool.query(
      'INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, latitude, longitude, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING address_id',
      [req.user.userId, addressLine1, addressLine2, city, state, postalCode, latitude, longitude, isDefault]
    );
    
    res.status(201).json({
      message: 'Address added successfully',
      addressId: result.rows[0].address_id
    });
  } catch (error) {
    console.error('Address creation error:', error);
    res.status(500).json({ message: 'Server error adding address' });
  }
});

// Get all product categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await pool.query('SELECT * FROM categories');
    res.json(categories.rows);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// Get products by category
app.get('/api/products/category/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const products = await pool.query(`
      SELECT p.*, 
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
        COUNT(r.review_id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.category_id = $1
      GROUP BY p.product_id
    `, [categoryId]);
    res.json(products.rows);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Get featured products
app.get('/api/products/featured', async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.*, 
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
        COUNT(r.review_id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.is_featured = TRUE
      GROUP BY p.product_id
    `);
    res.json(products.rows);
  } catch (error) {
    console.error('Featured products fetch error:', error);
    res.status(500).json({ message: 'Server error fetching featured products' });
  }
});

// Search products
app.get('/api/products/search', async (req, res) => {
  try {
    const searchTerm = `%${req.query.q}%`;
    const products = await pool.query(`
      SELECT p.*, 
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
        COUNT(r.review_id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.name ILIKE $1 OR p.description ILIKE $2
      GROUP BY p.product_id
    `, [searchTerm, searchTerm]);
    res.json(products.rows);
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ message: 'Server error searching products' });
  }
});

// Get cart contents
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    // Get user's cart
    const carts = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (carts.rows.length === 0) {
      // Create a new cart if user doesn't have one
      const newCart = await pool.query(
        'INSERT INTO cart (user_id) VALUES ($1) RETURNING cart_id',
        [req.user.userId]
      );
      
      return res.json({
        cartId: newCart.rows[0].cart_id,
        items: []
      });
    }
    
    const cartId = carts.rows[0].cart_id;
    
    // Get cart items with product details
    const items = await pool.query(
      `SELECT ci.cart_item_id, ci.quantity, p.* 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    
    // Calculate total
    let total = 0;
    items.rows.forEach(item => {
      const price = item.discount_price || item.price;
      total += price * item.quantity;
    });
    
    res.json({
      cartId,
      items: items.rows,
      total
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// Add item to cart
app.post('/api/cart/items', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Get user's cart
    const carts = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1',
      [req.user.userId]
    );
    
    let cartId;
    
    if (carts.rows.length === 0) {
      // Create a new cart if user doesn't have one
      const newCart = await pool.query(
        'INSERT INTO cart (user_id) VALUES ($1) RETURNING cart_id',
        [req.user.userId]
      );
      cartId = newCart.rows[0].cart_id;
    } else {
      cartId = carts.rows[0].cart_id;
    }
    
    // Check if item already exists in cart
    const existingItems = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );
    
    if (existingItems.rows.length > 0) {
      // Update quantity if item already exists
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE cart_item_id = $2',
        [quantity, existingItems.rows[0].cart_item_id]
      );
    } else {
      // Add new item to cart
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, quantity]
      );
    }
    
    res.status(201).json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error adding item to cart' });
  }
});

// Update cart item quantity
app.put('/api/cart/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    // Ensure the cart item belongs to the user
    const cartItems = await pool.query(
      `SELECT ci.* FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = $1 AND c.user_id = $2`,
      [itemId, req.user.userId]
    );
    
    if (cartItems.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await pool.query('DELETE FROM cart_items WHERE cart_item_id = $1', [itemId]);
      res.json({ message: 'Item removed from cart' });
    } else {
      // Update quantity
      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2',
        [quantity, itemId]
      );
      res.json({ message: 'Cart item quantity updated' });
    }
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

// Remove item from cart
app.delete('/api/cart/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Ensure the cart item belongs to the user
    const cartItems = await pool.query(
      `SELECT ci.* FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = $1 AND c.user_id = $2`,
      [itemId, req.user.userId]
    );
    
    if (cartItems.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    await pool.query('DELETE FROM cart_items WHERE cart_item_id = $1', [itemId]);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Cart remove error:', error);
    res.status(500).json({ message: 'Server error removing item from cart' });
  }
});

// Place an order
// Place an order
// Add review routes
app.post('/api/products/:productId/reviews', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check for existing review
    const existingReview = await pool.query(
      'SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, userId]
    );
    
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Analyze sentiment
    let sentimentData = { 
      sentiment_score: null,
      sentiment_label: null,
      sentiment_confidence: null
    };
    
    if (comment && comment.trim() !== '') {
      try {
        const sentimentResponse = await axios.post(
          `${SENTIMENT_API_URL}/analyze-sentiment`,
          { text: comment.trim(), rating },
          { timeout: 10000 }
        );
        
        if (sentimentResponse.data && sentimentResponse.data.success) {
          sentimentData = sentimentResponse.data.sentiment;
        }
      } catch (error) {
        console.error('Sentiment analysis error:', error);
      }
    }

    // Insert review with sentiment data
    const result = await pool.query(
      `INSERT INTO reviews (
        product_id, user_id, rating, comment,
        sentiment_score, sentiment_label, sentiment_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        productId,
        userId,
        rating,
        comment,
        sentimentData.sentiment_score,
        sentimentData.sentiment_label,
        sentimentData.confidence
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: 'Server error creating review' });
  }
});

// Comparion of products
app.get('/api/products/compare', async (req, res) => {
  try {
    const productIds = req.query.ids.split(',').map(id => parseInt(id.trim()));
    
    if (productIds.length !== 2) {
      return res.status(400).json({ message: 'Please select exactly 2 products to compare' });
    }

    const products = await pool.query(`
      SELECT p.*, 
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
        COUNT(r.review_id) as review_count,
        p.subcategory_id, p.category_id
      FROM products p
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.product_id = ANY($1)
      GROUP BY p.product_id
    `, [productIds]);

    if (products.rows.length !== 2) {
      return res.status(404).json({ message: 'One or more products not found' });
    }

    // Structure the data for comparison
    const comparisonData = {
      products: products.rows,
      commonAttributes: getCommonAttributes(products.rows[0], products.rows[1])
    };

    res.json(comparisonData);
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ message: 'Server error during comparison' });
  }
});

// New endpoint: Get similar products from the subcategories of compared products
app.post('/api/products/similar-in-subcategories', async (req, res) => {
  try {
    const { subcategory_ids, exclude_product_ids, category_id } = req.body;
    if (!Array.isArray(subcategory_ids) || subcategory_ids.length === 0) {
      return res.status(400).json({ message: 'subcategory_ids array is required' });
    }
    if (!category_id) {
      return res.status(400).json({ message: 'category_id is required' });
    }
    // Exclude compared products from the results
    const excludeIds = Array.isArray(exclude_product_ids) ? exclude_product_ids : [];
    const products = await pool.query(
      `SELECT * FROM products WHERE category_id = $1 AND subcategory_id = ANY($2) AND product_id != ALL($3) LIMIT 12`,
      [category_id, subcategory_ids, excludeIds.length ? excludeIds : [0]]
    );
    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching similar products:', error);
    res.status(500).json({ message: 'Server error fetching similar products' });
  }
});

// Get product reviews
app.get('/api/products/:productId/reviews', async (req, res) => {
  try {
      const productId = req.params.productId;
      
      const reviews = await pool.query(`
          SELECT r.*, u.name as user_name 
          FROM reviews r
          JOIN users u ON r.user_id = u.user_id
          WHERE product_id = $1
          ORDER BY created_at DESC
      `, [productId]);

      // Get helpful counts
      for (let review of reviews.rows) {
          const helpfulCount = await pool.query(
              'SELECT COUNT(*) FROM review_helpful WHERE review_id = $1',
              [review.review_id]
          );
          review.helpful_count = parseInt(helpfulCount.rows[0].count);
      }

      res.json(reviews.rows);
  } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Server error fetching reviews' });
  }
});
app.post('/products/:productId/reviews', async (req, res) => {
  try {
      // Get user ID from session/auth
      const userId = req.session?.user_id || req.user?.id;
      if (!userId) {
          return res.status(401).json({
              success: false,
              message: 'Authentication required'
          });
      }

      const { productId } = req.params;
      const { rating, comment, sentiment_score, sentiment_label, sentiment_confidence } = req.body;

      // Validate input
      if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({
              success: false,
              message: 'Valid rating (1-5) is required'
          });
      }

      // Check if user has already reviewed this product
      const existingReviewQuery = `
          SELECT review_id FROM reviews 
          WHERE user_id = $1 AND product_id = $2
      `;
      
      const existingReview = await db.query(existingReviewQuery, [userId, productId]);
      
      if (existingReview.rows.length > 0) {
          return res.status(400).json({
              success: false,
              message: 'You have already reviewed this product'
          });
      }

      // Get or calculate sentiment analysis
      let sentimentData = {
          sentiment_score,
          sentiment_label,
          confidence: sentiment_confidence
      };

      // If sentiment data not provided, analyze it using your Python service
      if (!sentiment_score && comment && comment.trim()) {
          try {
              console.log('Analyzing sentiment for comment:', comment);
              
              const sentimentResponse = await axios.post(
                  `${SENTIMENT_API_URL}/analyze-sentiment`,
                  {
                      text: comment.trim(),
                      rating: rating
                  },
                  {
                      timeout: 10000,
                      headers: {
                          'Content-Type': 'application/json'
                      }
                  }
              );

              if (sentimentResponse.data && sentimentResponse.data.success) {
                  const sentiment = sentimentResponse.data.sentiment;
                  sentimentData = {
                      sentiment_score: sentiment.sentiment_score,
                      sentiment_label: sentiment.sentiment_label,
                      confidence: sentiment.confidence
                  };
                  console.log('Sentiment analysis successful:', sentimentData);
              } else {
                  console.warn('Sentiment analysis returned no data');
              }
              
          } catch (sentimentError) {
              console.warn('Sentiment analysis failed:', sentimentError.message);
              // Continue without sentiment data - not critical for review submission
              sentimentData = {
                  sentiment_score: null,
                  sentiment_label: null,
                  confidence: null
              };
          }
      }
      if (!sentimentData.sentiment_score && comment && comment.trim()) {
        // Simple rating-based sentiment mapping
        const sentimentMapping = {
            1: { score: 2.0, label: 'highly negative' },
            2: { score: 4.0, label: 'negative' },
            3: { score: 6.0, label: 'neutral' },
            4: { score: 8.0, label: 'positive' },
            5: { score: 9.5, label: 'highly positive' }
        };
        
        sentimentData = sentimentMapping[rating] || { 
            score: 6.0, 
            label: 'neutral',
            confidence: 0.7
        };
    }

      // Start database transaction
      const client = await db.connect();
      
      try {
          await client.query('BEGIN');

          // Check if the product exists
          const productCheck = await client.query(
              'SELECT product_id FROM products WHERE product_id = $1',
              [productId]
          );

          if (productCheck.rows.length === 0) {
              await client.query('ROLLBACK');
              return res.status(404).json({
                  success: false,
                  message: 'Product not found'
              });
          }

          // Insert the review
          const insertQuery = `
              INSERT INTO reviews (
                  product_id, user_id, rating, comment, 
                  sentiment_score, sentiment_label, sentiment_confidence,
                  created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
              RETURNING review_id, created_at
          `;

          const reviewResult = await client.query(insertQuery, [
              productId,
              userId,
              rating,
              comment || '',
              sentimentData.sentiment_score,
              sentimentData.sentiment_label,
              sentimentData.confidence
          ]);

          const newReview = reviewResult.rows[0];

          // Get user info for response
          const userQuery = 'SELECT name FROM users WHERE user_id = $1';
          const userResult = await client.query(userQuery, [userId]);
          const userName = userResult.rows[0]?.name || `User ${userId}`;

          await client.query('COMMIT');

          // Prepare response
          const reviewData = {
              review_id: newReview.review_id,
              product_id: parseInt(productId),
              user_id: userId,
              user_name: userName,
              rating: rating,
              comment: comment || '',
              created_at: newReview.created_at,
              sentiment_analysis: sentimentData.sentiment_score ? {
                  sentiment_score: sentimentData.sentiment_score,
                  sentiment_label: sentimentData.sentiment_label,
                  confidence: sentimentData.confidence
              } : null
          };

          res.status(201).json({
              success: true,
              message: 'Review submitted successfully',
              review: reviewData
          });

      } catch (dbError) {
          await client.query('ROLLBACK');
          throw dbError;
      } finally {
          client.release();
      }

  } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({
          success: false,
          message: 'An error occurred while submitting your review'
      });
  }
});

app.post('/analyze-sentiment', async (req, res) => {
  try {
      const { text, rating } = req.body;

      if (!text || !text.trim()) {
          return res.status(400).json({
              success: false,
              message: 'Text is required for sentiment analysis'
          });
      }

      const sentimentResponse = await axios.post(
          `${SENTIMENT_API_URL}/analyze-sentiment`,
          { text: text.trim(), rating },
          {
              timeout: 10000,
              headers: { 'Content-Type': 'application/json' }
          }
      );

      if (sentimentResponse.data && sentimentResponse.data.success) {
          res.json({
              success: true,
              sentiment: sentimentResponse.data.sentiment
          });
      } else {
          res.status(500).json({
              success: false,
              message: 'Sentiment analysis failed'
          });
      }

  } catch (error) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to analyze sentiment'
      });
  }
});

// Route to get reviews for a product (enhanced with sentiment data)
app.get('/products/:productId/reviews', async (req, res) => {
  try {
      const { productId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const query = `
          SELECT 
              r.review_id, r.product_id, r.user_id, r.rating, r.comment,
              r.sentiment_score, r.sentiment_label, r.sentiment_confidence,
              r.created_at, r.updated_at,
              u.name as user_name
          FROM reviews r
          JOIN users u ON r.user_id = u.user_id
          WHERE r.product_id = $1
          ORDER BY r.created_at DESC
          LIMIT $2 OFFSET $3
      `;

      const reviews = await db.query(query, [productId, limit, offset]);

      // Get total count for pagination
      const countQuery = 'SELECT COUNT(*) FROM reviews WHERE product_id = $1';
      const countResult = await db.query(countQuery, [productId]);
      const totalReviews = parseInt(countResult.rows[0].count);

      // Format reviews with sentiment data
      const formattedReviews = reviews.rows.map(review => ({
          review_id: review.review_id,
          product_id: review.product_id,
          user_id: review.user_id,
          user_name: review.user_name,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          updated_at: review.updated_at,
          sentiment_analysis: review.sentiment_score ? {
              sentiment_score: review.sentiment_score,
              sentiment_label: review.sentiment_label,
              confidence: review.sentiment_confidence
          } : null
      }));

      res.json({
          success: true,
          reviews: formattedReviews,
          pagination: {
              current_page: page,
              total_pages: Math.ceil(totalReviews / limit),
              total_reviews: totalReviews,
              has_next: page < Math.ceil(totalReviews / limit),
              has_prev: page > 1
          }
      });

  } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to fetch reviews'
      });
  }
});

// Mark review as helpful
app.post('/api/reviews/:reviewId/helpful', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reviewId = req.params.reviewId;
    const userId = req.user.userId;

    // Validate review exists
    const reviewCheck = await client.query(
      'SELECT 1 FROM reviews WHERE review_id = $1',
      [reviewId]
    );
    
    if (reviewCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        message: 'Review not found'
      });
    }

    // Check existing helpful mark
    const existing = await client.query(
      'SELECT 1 FROM review_helpful WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    // Toggle helpful status
    if (existing.rows.length > 0) {
      await client.query(
        'DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );
    } else {
      await client.query(
        'INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)',
        [reviewId, userId]
      );
    }

    // Get updated count
    const countResult = await client.query(
      'SELECT COUNT(*) FROM review_helpful WHERE review_id = $1',
      [reviewId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      helpfulCount: parseInt(countResult.rows[0].count, 10),
      hasMarked: !existing.rows.length > 0
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Helpful vote error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? `Server error: ${error.message}`
        : 'Unable to process helpful vote'
    });
  } finally {
    client.release();
  }
});

// Update product routes to include average rating
app.get('/api/products/category/:categoryId', async (req, res) => {
  try {
      const categoryId = req.params.categoryId;
      const products = await pool.query(`
          SELECT p.*, 
                 COALESCE(ROUND(AVG(r.rating)::numeric, 0) as average_rating,
                 COUNT(r.review_id) as review_count
          FROM products p
          LEFT JOIN reviews r ON p.product_id = r.product_id
          WHERE p.category_id = $1
          GROUP BY p.product_id
      `, [categoryId]);
      res.json(products.rows);
  } catch (error) {
      console.error('Products fetch error:', error);
      res.status(500).json({ message: 'Server error fetching products' });
  }
});


app.get('/api/products/:productId', async (req, res) => {
  try {
      const productId = req.params.productId;
      
      const productResult = await pool.query(`
          SELECT p.*, 
                 COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as average_rating,
                 COUNT(r.review_id) as review_count
          FROM products p
          LEFT JOIN reviews r ON p.product_id = r.product_id
          WHERE p.product_id = $1
          GROUP BY p.product_id
      `, [productId]);

      if (productResult.rows.length === 0) {
          return res.status(404).json({ message: 'Product not found' });
      }

      const product = productResult.rows[0];
      res.json(product);
  } catch (error) {
      console.error('Product fetch error:', error);
      res.status(500).json({ message: 'Server error fetching product' });
  }
});
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get user's cart
      const carts = await client.query(
        'SELECT * FROM cart WHERE user_id = $1',
        [req.user.userId]
      );
      
      if (carts.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cart is empty' });
      }
      
      const cartId = carts.rows[0].cart_id;
      
      // Get cart items with product details
      const items = await client.query(
        `SELECT ci.quantity, p.product_id, p.price, p.discount_price 
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.product_id
         WHERE ci.cart_id = $1`,
        [cartId]
      );
      
      if (items.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cart is empty' });
      }
      
      // Calculate total amount
      let totalAmount = 0;
      items.rows.forEach(item => {
        const price = item.discount_price || item.price;
        totalAmount += price * item.quantity;
      });
      
      // Apply delivery fee if total is less than 500
      const deliveryFee = totalAmount < 500 ? 20.00 : 0.00;
      totalAmount += deliveryFee;
      
      // Create order with delivery time estimate (10-15 minutes)
      const estimatedDeliveryTime = new Date(Date.now() + 15 * 60000); // 15 minutes from now
      
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, address_id, total_amount, delivery_fee, status, 
         payment_method, payment_status, estimated_delivery_time)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7) RETURNING order_id`,
        [req.user.userId, addressId, totalAmount, deliveryFee, paymentMethod, 
         paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed', 
         estimatedDeliveryTime]
      );
      
      const orderId = orderResult.rows[0].order_id;
      
      // Add order items
      for (const item of items.rows) {
        const price = item.discount_price || item.price;
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.product_id, item.quantity, price]
        );
        
        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }
      
      // Initialize order tracking
      await client.query(
        'INSERT INTO order_tracking (order_id, status, location) VALUES ($1, $2, $3)',
        [orderId, "pending", "Order received"]
      );
      
      // Get address details to fetch latitude and longitude
      const addressResult = await client.query(
        'SELECT latitude, longitude FROM addresses WHERE address_id = $1',
        [addressId]
      );
      
      if (addressResult.rows.length > 0) {
        const { latitude, longitude } = addressResult.rows[0];
        
        // Add entry to delivery_locations table with user's address coordinates
        await client.query(
          'INSERT INTO delivery_locations (order_id, personnel_id, latitude, longitude) VALUES ($1, $2, $3, $4)',
          [orderId, 1, latitude, longitude]
        );
      }
      
      // Clear the cart
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Order placed successfully',
        orderId,
        estimatedDeliveryTime
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error placing order' });
  }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, a.address_line1, a.address_line2, a.city, a.state, a.postal_code 
       FROM orders o
       JOIN addresses a ON o.address_id = a.address_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    
    // Get order items for each order
    for (let order of orders.rows) {
      const items = await pool.query(
        `SELECT oi.*, p.name, p.image_url, p.unit 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = $1`,
        [order.order_id]
      );
      order.items = items.rows;
    }
    
    res.json(orders.rows);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// Get order details by ID
// Enhanced order tracking endpoint
app.get('/api/orders/:orderId/tracking', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const client = await pool.connect();
    
    try {
      // Get order details with calculated totals
      const orderResult = await client.query(`
        SELECT o.*, u.name as user_name, u.email as user_email,
         a.address_line1, a.city, a.state, a.latitude as delivery_lat, a.longitude as delivery_lng,
         p.name as delivery_person_name, p.phone as delivery_person_phone,
         -- Calculate totals from order_items
         COALESCE(SUM(oi.quantity * oi.price), 0) as subtotal,
         COUNT(oi.order_item_id) as item_count
         FROM orders o
         JOIN users u ON o.user_id = u.user_id
         JOIN addresses a ON o.address_id = a.address_id
         LEFT JOIN order_items oi ON o.order_id = oi.order_id
         LEFT JOIN delivery_personnel p ON p.personnel_id = (
           SELECT personnel_id FROM order_tracking 
           WHERE order_id = o.order_id AND personnel_id IS NOT NULL
           ORDER BY timestamp DESC LIMIT 1
         )
         WHERE o.order_id = $1 AND (o.user_id = $2 OR $3)
         GROUP BY o.order_id, u.name, u.email, a.address_line1, a.city, a.state, 
                  a.latitude, a.longitude, p.name, p.phone`,
        [orderId, req.user.userId, req.user.isAdmin]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const order = orderResult.rows[0];

      // Get order items separately for detailed info
      const itemsResult = await client.query(`
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = $1
        ORDER BY oi.order_item_id`,
        [orderId]
      );

      // Validate delivery coordinates
      const validateCoordinate = (value, fallback) => {
        const num = Number(value);
        return typeof num === 'number' && !isNaN(num) ? num : fallback;
      };

      const deliveryLat = validateCoordinate(order.delivery_lat, 12.9716);
      const deliveryLng = validateCoordinate(order.delivery_lng, 77.5946);

      console.log('Validated delivery coordinates:', {
        raw: { lat: order.delivery_lat, lng: order.delivery_lng },
        parsed: { deliveryLat, deliveryLng }
      });

      // Get tracking history
      const trackingResult = await client.query(`
        SELECT ot.*, p.name as delivery_person_name, p.phone as delivery_person_phone
         FROM order_tracking ot
         LEFT JOIN delivery_personnel p ON ot.personnel_id = p.personnel_id
         WHERE ot.order_id = $1
         ORDER BY ot.timestamp DESC`,
        [orderId]
      );

      // Get current delivery location if out for delivery
      let currentLocation = null;
      if (order.status === 'out_for_delivery') {
        const locationResult = await client.query(`
          SELECT latitude, longitude, created_at
           FROM delivery_locations
           WHERE order_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [orderId]
        );

        if (locationResult.rows.length > 0) {
          currentLocation = {
            lat: validateCoordinate(locationResult.rows[0].latitude, deliveryLat),
            lng: validateCoordinate(locationResult.rows[0].longitude, deliveryLng),
            timestamp: locationResult.rows[0].created_at
          };
        }
      }

      // Get store location with validation
      const storeResult = await client.query(`
        SELECT name, address, latitude, longitude 
         FROM stores 
         WHERE store_id = $1`,
        [order.store_id || 1]
      );

      let storeLocation;
      if (storeResult.rows.length > 0) {
        const store = storeResult.rows[0];
        storeLocation = {
          name: store.name,
          address: store.address,
          lat: validateCoordinate(store.latitude, 12.9716),
          lng: validateCoordinate(store.longitude, 77.5946)
        };
      } else {
        storeLocation = {
          name: "Main Store",
          address: "123 MG Road, Bangalore",
          lat: 12.9716,
          lng: 77.5946
        };
      }

      // Calculate totals
      const subtotal = parseFloat(order.subtotal) || 0;
      const deliveryFee = parseFloat(order.delivery_fee) || 0;
      const tax = subtotal * 0.05; // 5% tax
      const total = subtotal + deliveryFee + tax;

      // Calculate ETA with coordinate validation
      let deliveryEta = null;
      if (order.status === 'out_for_delivery' && currentLocation) {
        try {
          const distanceFromDelivery = Math.sqrt(
            Math.pow(currentLocation.lat - deliveryLat, 2) + 
            Math.pow(currentLocation.lng - deliveryLng, 2)
          );
          
          deliveryEta = Math.round(distanceFromDelivery * 100 * 2);
          deliveryEta = Math.min(Math.max(deliveryEta, 3), 30);
        } catch (e) {
          console.error('ETA calculation error:', e);
        }
      }

      // Build response with validated coordinates and proper totals
      const response = {
        orderId: order.order_id,
        status: order.status,
        orderDate: order.created_at,
        estimatedDeliveryTime: order.estimated_delivery_time,
        actualDeliveryTime: order.actual_delivery_time,
        delivery_person_name: order.delivery_person_name,
        delivery_person_phone: order.delivery_person_phone,
        deliveryEta: deliveryEta,
        
        // Financial details
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        tax: tax,
        total: total,
        
        // Items
        items: itemsResult.rows.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        
        // Locations
        storeLocation: storeLocation,
        deliveryLocation: {
          lat: deliveryLat,
          lng: deliveryLng,
          address: `${order.address_line1}, ${order.city}, ${order.state}`
        },
        currentDeliveryLocation: currentLocation,
        
        // Tracking
        tracking: trackingResult.rows.map(track => ({
          status: track.status,
          timestamp: track.timestamp,
          location: track.location,
          delivery_person_name: track.delivery_person_name,
          delivery_person_phone: track.delivery_person_phone
        }))
      };

      res.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Order tracking error:', error);
    res.status(500).json({ 
      message: 'Server error fetching tracking data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get order tracking
// app.get('/api/orders/:orderId/tracking', authenticateToken, async (req, res) => {
//   try {
//     const { orderId } = req.params;
    
//     // Verify the order belongs to the user
//     const orders = await pool.query(
//       'SELECT * FROM orders WHERE order_id = $1 AND user_id = $2',
//       [orderId, req.user.userId]
//     );
    
//     if (orders.rows.length === 0) {
//       return res.status(404).json({ message: 'Order not found' });
//     }
    
//     const tracking = await pool.query(
//       `SELECT ot.*, dp.name as delivery_person_name, dp.phone as delivery_person_phone 
//        FROM order_tracking ot
//        LEFT JOIN delivery_personnel dp ON ot.personnel_id = dp.personnel_id
//        WHERE ot.order_id = $1
//        ORDER BY ot.timestamp ASC`,
//       [orderId]
//     );
    
//     res.json({
//       orderId,
//       status: orders.rows[0].status,
//       estimatedDeliveryTime: orders.rows[0].estimated_delivery_time,
//       actualDeliveryTime: orders.rows[0].actual_delivery_time,
//       tracking: tracking.rows
//     });
//   } catch (error) {
//     console.error('Tracking fetch error:', error);
//     res.status(500).json({ message: 'Server error fetching tracking information' });
//   }
// });

// ADMIN ROUTES
app.get('/api/admin/reviews', authenticateToken, isAdmin, async (req, res) => {
  try {
    const reviews = await pool.query(`
      SELECT 
        r.review_id,
        r.product_id,
        r.user_id,
        r.rating,
        r.comment,
        r.sentiment_score,
        r.sentiment_label,
        r.sentiment_confidence,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.email as user_email,
        p.name as product_name,
        p.image_url as product_image
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN products p ON r.product_id = p.product_id
      ORDER BY r.created_at DESC
    `);
    res.json(reviews.rows);
  } catch (error) {
    console.error('Admin reviews fetch error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
});

app.delete('/api/admin/reviews/:reviewId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM reviews WHERE review_id = $1 RETURNING *',
      [reviewId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin review delete error:', error);
    res.status(500).json({ message: 'Server error deleting review' });
  }
});
// Admin: Get all users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT user_id, name, email, phone, created_at, is_admin 
      FROM users
    `);
    res.json(users.rows);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});
app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT * FROM products
    `);
    res.json(products.rows);
  } catch (error) {
    console.error('Admin products fetch error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Admin: Add new product
// Update the admin products post route
app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      name, 
      description, 
      price, 
      discount_price,  // Changed from discountPrice
      category_id,     // Changed from categoryId
      image_url,       // Changed from imageUrl
      stock_quantity,  // Changed from stockQuantity
      unit, 
      is_featured      // Changed from isFeatured
    } = req.body;

    // Validation
    if (!name || !description || !category_id) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, or category' 
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ 
        message: 'Invalid price value' 
      });
    }

    const result = await pool.query(
      `INSERT INTO products (
        name, description, price, discount_price, 
        category_id, image_url, stock_quantity, 
        unit, is_featured
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING product_id`,
      [
        name,
        description,
        parseFloat(price),
        parseFloat(discount_price) || 0,
        parseInt(category_id),
        image_url,
        parseInt(stock_quantity) || 0,
        unit,
        Boolean(is_featured)
      ]
    );

    res.status(201).json({
      message: 'Product added successfully',
      productId: result.rows[0].product_id
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    // Enhanced error response
    const errorResponse = {
      message: 'Failed to add product',
      details: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        constraint: error.constraint,
        code: error.code
      } : undefined
    };

    // Handle common database errors
    if (error.code === '23503') { // Foreign key violation
      errorResponse.message = 'Invalid category selected';
    } else if (error.code === '23505') { // Unique violation
      errorResponse.message = 'Product name already exists';
    }

    res.status(500).json(errorResponse);
  }
});
// Add this route to your admin routes
app.post('/api/admin/generate-product-suggestions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productName } = req.body;
    
    console.log('Received product suggestion request for:', productName);
    
    if (!productName || !productName.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Make sure to set this in your .env file
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ 
        message: 'AI service configuration error - API key missing'
      });
    }

    // Import Groq SDK
    let Groq;
    try {
      Groq = require('groq-sdk');
    } catch (importError) {
      console.error('Groq SDK import error:', importError);
      return res.status(500).json({ 
        message: 'AI service dependency missing. Please install groq-sdk'
      });
    }

    const groq = new Groq({
      apiKey: GROQ_API_KEY
    });

    const prompt = `You are a product catalog expert for an Indian e-commerce store. Given a product name, provide realistic product details.

Product name: "${productName.trim()}"

Please respond with ONLY a valid JSON object containing exactly these fields:
{
  "name": "improved/formatted product name",
  "description": "detailed product description (2-3 sentences)",
  "price": 25000,
  "category": "Electronics",
  "unit": "pieces",
  "stock_quantity": 10,
  "image_url": ""
}

Categories to choose from: Electronics, Fruits & Vegetables, Dairy & Eggs, Meat & Seafood, Bakery, Beverages, Snacks & Confectionery, Personal Care, Household Items, Books & Stationery, Sports & Fitness

Important: 
- Price should be in Indian Rupees (number only, no currency symbol)
- Respond with ONLY the JSON object, no additional text or formatting
- Do not wrap in markdown code blocks`;

    console.log('Sending request to Groq API...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      // Updated model - choose one of these based on your needs:
      model: "llama-3.3-70b-versatile", // Best for complex tasks
      // model: "llama-3.1-8b-instant",   // Faster, good for simpler tasks
      // model: "llama3-70b-8192",        // Good balance
      // model: "llama3-8b-8192",         // Fastest
      temperature: 0.3,
      max_tokens: 500,
      top_p: 1,
      stream: false
    });

    const responseText = completion.choices[0]?.message?.content;
    
    console.log('Raw AI response:', responseText);
    
    if (!responseText) {
      throw new Error('No response content from AI service');
    }

    // Clean the response text more thoroughly
    let cleanedResponse = responseText.trim();
    
    // Remove any potential markdown formatting
    cleanedResponse = cleanedResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .replace(/^json\s*/gi, '')
      .trim();

    // Find JSON object boundaries
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON object found in AI response');
    }
    
    cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
    
    console.log('Cleaned response:', cleanedResponse);

    // Parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', cleanedResponse);
      
      // Fallback: create a basic suggestion
      suggestions = {
        name: productName.trim(),
        description: `High-quality ${productName.trim()} with excellent features and reliability.`,
        price: 1000,
        category: "Electronics",
        unit: "pieces",
        stock_quantity: 10,
        image_url: ""
      };
      
      console.log('Using fallback suggestion due to parse error');
    }

    // Validate and sanitize the response
    const requiredFields = ['name', 'description', 'price', 'category', 'unit', 'stock_quantity'];
    const missingFields = requiredFields.filter(field => !suggestions.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      console.log('Missing fields detected:', missingFields);
      // Fill in missing fields with defaults
      if (!suggestions.name) suggestions.name = productName.trim();
      if (!suggestions.description) suggestions.description = `Quality ${productName.trim()} product`;
      if (!suggestions.price) suggestions.price = 100;
      if (!suggestions.category) suggestions.category = "General";
      if (!suggestions.unit) suggestions.unit = "pieces";
      if (!suggestions.stock_quantity) suggestions.stock_quantity = 10;
    }

    // Ensure correct data types
    suggestions.price = parseFloat(suggestions.price) || 100;
    suggestions.stock_quantity = parseInt(suggestions.stock_quantity) || 10;
    suggestions.image_url = suggestions.image_url || "";

    // Validate price is reasonable
    if (suggestions.price < 1 || suggestions.price > 1000000) {
      suggestions.price = 100; // Default fallback price
    }

    // Validate stock quantity is reasonable
    if (suggestions.stock_quantity < 1 || suggestions.stock_quantity > 1000) {
      suggestions.stock_quantity = 10; // Default fallback stock
    }

    console.log('Final suggestions:', suggestions);
    console.log('Successfully generated suggestions for:', productName);
    
    res.json(suggestions);

  } catch (error) {
    console.error('Product suggestion error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to generate product suggestions';
    let statusCode = 500;
    
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      errorMessage = 'AI service authentication failed';
      statusCode = 500;
    } else if (error.message.includes('JSON') || error.message.includes('parse')) {
      errorMessage = 'AI service returned invalid data format';
      statusCode = 500;
    } else if (error.message.includes('No response') || error.message.includes('timeout')) {
      errorMessage = 'AI service is not responding';
      statusCode = 503;
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      errorMessage = 'Network error connecting to AI service';
      statusCode = 503;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Unable to connect to AI service';
      statusCode = 503;
    } else if (error.message.includes('model') && error.message.includes('decommissioned')) {
      errorMessage = 'AI model is no longer supported. Please update the application.';
      statusCode = 500;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});
// Admin: Update product
// Update product route
app.put('/api/admin/products/:productId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      price,
      discount_price,  // Changed from discountPrice
      category_id,     // Changed from categoryId
      image_url,       // Changed from imageUrl
      stock_quantity,  // Changed from stockQuantity
      unit,
      is_featured      // Changed from isFeatured
    } = req.body;

    await pool.query(
      `UPDATE products SET 
        name = $1, 
        description = $2, 
        price = $3, 
        discount_price = $4,
        category_id = $5, 
        image_url = $6, 
        stock_quantity = $7, 
        unit = $8, 
        is_featured = $9
       WHERE product_id = $10`,
      [
        name,
        description,
        price,
        discount_price,
        category_id,
        image_url,
        stock_quantity,
        unit,
        is_featured,
        productId
      ]
    );
    
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ 
      message: 'Server error updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin: Delete product
app.delete('/api/admin/products/:productId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query('DELETE FROM products WHERE product_id = $1', [productId]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// Admin: Get all orders
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, 
       a.address_line1, a.city, a.state
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       JOIN addresses a ON o.address_id = a.address_id
       ORDER BY o.created_at DESC`
    );
    
    res.json(orders.rows);
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});
app.get('/api/admin/delivery-personnel', authenticateToken, isAdmin, async (req, res) => {
  try {
    const available = req.query.available === 'true';
    let query = 'SELECT * FROM delivery_personnel';
    const params = [];
    
    if (available) {
      query += ' WHERE is_available = $1';
      params.push(true);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const personnel = await pool.query(query, params);
    res.json(personnel.rows);
  } catch (error) {
    console.error('Delivery personnel fetch error:', error);
    res.status(500).json({ message: 'Server error fetching personnel' });
  }
});


app.post('/api/admin/delivery-personnel', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO delivery_personnel 
       (name, phone, email, password) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone, email, hashedPassword]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Personnel creation error:', error);
    res.status(500).json({ message: 'Server error creating personnel' });
  }
});

app.delete('/api/admin/delivery-personnel/:id', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Check personnel availability status
    const personnelCheck = await client.query(
      'SELECT is_available FROM delivery_personnel WHERE personnel_id = $1',
      [id]
    );

    if (personnelCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Personnel not found' });
    }

    if (!personnelCheck.rows[0].is_available) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Cannot delete unavailable personnel. Ensure they have completed all deliveries first.' 
      });
    }

    await client.query('DELETE FROM delivery_personnel WHERE personnel_id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Personnel deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Personnel deletion error:', error);
    res.status(500).json({ 
      message: 'Server error deleting personnel',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

app.put('/api/admin/users/:userId/admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(400).json({ message: 'Demoting admins is not allowed' });
    }

    const result = await pool.query(
      'UPDATE users SET is_admin = TRUE WHERE user_id = $1 AND is_admin = FALSE RETURNING *',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'User is already admin or not found' });
    }

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ 
      message: 'Server error updating admin status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin: Update order status
// app.put('/api/admin/orders/:orderId/status', authenticateToken, isAdmin, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status, personnelId } = req.body;
//     const client = await pool.connect();
    
//     try {
//       await client.query('BEGIN');
      
//       // Update order status
//       await client.query(
//         'UPDATE orders SET status = $1 WHERE order_id = $2',
//         [status, orderId]
//       );
      
//       // Add tracking entry
//       await client.query(
//         'INSERT INTO order_tracking (order_id, personnel_id, status, location) VALUES ($1, $2, $3, $4)',
//         [orderId, personnelId, status, status === 'out_for_delivery' ? 'En route to customer' : 'Warehouse']
//       );
      
//       // If delivered, set actual delivery time
//       if (status === 'delivered') {
//         await client.query(
//           'UPDATE orders SET actual_delivery_time = NOW() WHERE order_id = $1',
//           [orderId]
//         );
//       }
      
//       await client.query('COMMIT');
      
//       res.json({ message: 'Order status updated successfully' });
//     } catch (error) {
//       await client.query('ROLLBACK');
//       throw error;
//     } finally {
//       client.release();
//     }
//   } catch (error) {
//     console.error('Order status update error:', error);
//     res.status(500).json({ message: 'Server error updating order status' });
//   }
// });
// Add these new routes to your existing app.js
app.put('/api/admin/orders/:orderId/status', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { orderId } = req.params;
    const { status, personnelId } = req.body;

    // Validate personnel for out_for_delivery status
    if (status === 'out_for_delivery') {
      if (!personnelId) {
        throw new Error('Personnel ID required for out for delivery status');
      }
      
      // Check personnel availability
      const personnelCheck = await client.query(
        'SELECT is_available FROM delivery_personnel WHERE personnel_id = $1',
        [personnelId]
      );
      
      if (personnelCheck.rows.length === 0) {
        throw new Error('Invalid personnel ID');
      }
      
      if (!personnelCheck.rows[0].is_available) {
        throw new Error('Selected personnel is not available');
      }
    }

    // Update order status
    await client.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2',
      [status, orderId]
    );

    // Handle personnel availability
    if (status === 'out_for_delivery') {
      // Mark personnel as unavailable
      await client.query(
        'UPDATE delivery_personnel SET is_available = false WHERE personnel_id = $1',
        [personnelId]
      );
      
      // Add tracking entry with personnel
      await client.query(
        `INSERT INTO order_tracking 
        (order_id, personnel_id, status, location) 
        VALUES ($1, $2, $3, $4)`,
        [orderId, personnelId, status, 'En route to customer']
      );
    } 
    else if (status === 'delivered') {
      // Mark personnel as available again
      const tracking = await client.query(
        'SELECT personnel_id FROM order_tracking WHERE order_id = $1 ORDER BY timestamp DESC LIMIT 1',
        [orderId]
      );
      
      if (tracking.rows[0]?.personnel_id) {
        await client.query(
          'UPDATE delivery_personnel SET is_available = true WHERE personnel_id = $1',
          [tracking.rows[0].personnel_id]
        );
      }

      // Update delivery time
      await client.query(
        'UPDATE orders SET actual_delivery_time = NOW() WHERE order_id = $1',
        [orderId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order status update error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error updating order status'
    });
  } finally {
    client.release();
  }
});
// Get store location
app.get('/api/store-location', async (req, res) => {
  try {
    // In a real app, you might have multiple stores, but we'll use a single default one here
    const storeLocation = {
      lat: 12.9716,  // Default Bangalore latitude
      lng: 77.5946,  // Default Bangalore longitude
      name: "Main Store",
      address: "123 MG Road, Bangalore, Karnataka 560001"
    };
    res.json(storeLocation);
  } catch (error) {
    console.error('Store location error:', error);
    res.status(500).json({ message: 'Error fetching store location' });
  }
});

// Enhanced order tracking endpoint


app.delete('/api/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    
    // Verify the address belongs to the user
    const addresses = await pool.query(
      'SELECT * FROM addresses WHERE address_id = $1 AND user_id = $2',
      [addressId, req.user.userId]
    );
    
    if (addresses.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If this is the user's default address, prevent deletion or handle appropriately
    if (addresses.rows[0].is_default) {
      // Option 1: Prevent deletion of default address
      // return res.status(400).json({ message: 'Cannot delete default address. Please set another address as default first.' });
      
      // Option 2: Allow deletion but ensure user has another address as default if multiple addresses exist
      const userAddressCount = await pool.query(
        'SELECT COUNT(*) FROM addresses WHERE user_id = $1',
        [req.user.userId]
      );
      
      if (parseInt(userAddressCount.rows[0].count) > 1) {
        // Find the oldest non-default address to make default
        const oldestAddress = await pool.query(
          'SELECT address_id FROM addresses WHERE user_id = $1 AND address_id != $2 ORDER BY created_at ASC LIMIT 1',
          [req.user.userId, addressId]
        );
        
        // Set that address as default
        await pool.query(
          'UPDATE addresses SET is_default = TRUE WHERE address_id = $1',
          [oldestAddress.rows[0].address_id]
        );
      }
    }
    
    // Delete the address
    await pool.query('DELETE FROM addresses WHERE address_id = $1', [addressId]);
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Address deletion error:', error);
    res.status(500).json({ message: 'Server error deleting address' });
  }
});

// Update address endpoint (add this to your Express app.js)
// Update address endpoint
app.put('/api/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { addressLine1, addressLine2, city, state, postalCode, isDefault, latitude, longitude } = req.body;
    
    // Verify the address belongs to the user
    const addresses = await pool.query(
      'SELECT * FROM addresses WHERE address_id = $1 AND user_id = $2',
      [addressId, req.user.userId]
    );
    
    if (addresses.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // If setting as default, unset any other default addresses
      if (isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND address_id != $2',
          [req.user.userId, addressId]
        );
      }
      
      // Update the address including latitude and longitude
      await client.query(
        `UPDATE addresses 
         SET address_line1 = $1, address_line2 = $2, city = $3, state = $4, 
             postal_code = $5, is_default = $6, latitude = $7, longitude = $8
         WHERE address_id = $9`,
        [addressLine1, addressLine2, city, state, postalCode, isDefault, latitude, longitude, addressId]
      );
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Address updated successfully',
        addressId: addressId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Address update error:', error);
    res.status(500).json({ message: 'Server error updating address' });
  }
});

// Update delivery location (for delivery personnel app)
app.post('/api/orders/:orderId/location', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;
    
    // Verify the user is assigned to this order
    const assignment = await pool.query(
      `SELECT 1 FROM order_tracking 
       WHERE order_id = $1 AND personnel_id = $2
       ORDER BY timestamp DESC LIMIT 1`,
      [orderId, req.user.userId]
    );
    
    if (assignment.rows.length === 0) {
      return res.status(403).json({ message: 'Not assigned to this order' });
    }
    
    // Save the location
    await pool.query(
      'INSERT INTO delivery_locations (order_id, personnel_id, latitude, longitude) VALUES ($1, $2, $3, $4)',
      [orderId, req.user.userId, lat, lng]
    );
    
    res.json({ message: 'Location updated' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
});

// Helper function to calculate ETA (simplified)
function calculateEta(currentLocation, deliveryAddress) {
  if (!currentLocation) return null;
  
  // In a real app, you'd use a proper distance calculation
  // This is a simplified version that returns random ETA between 5-20 minutes
  return Math.floor(Math.random() * 15) + 5;
}

// Serve static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



module.exports = app;

// Helper function for product comparison attributes
function getCommonAttributes(product1, product2) {
  const attributes = [];
  const keys = new Set([...Object.keys(product1), ...Object.keys(product2)]);
  // Exclude fields that shouldn't be compared
  const excludedFields = new Set([
    'product_id', 'image_url', 'created_at', 'updated_at',
    'average_rating', 'review_count', 'subcategory_id', 'category_id'
  ]);
  for (const key of keys) {
    if (!excludedFields.has(key) && product1[key] !== undefined && product2[key] !== undefined) {
      attributes.push({
        name: key.replace(/_/g, ' '), // Convert snake_case to readable
        values: [product1[key], product2[key]]
      });
    }
  }
  return attributes;
}

