# Backend Setup Guide

## Database Configuration

### Prerequisites
- PostgreSQL installed and running
- Node.js and npm installed

### Database Setup

1. **Create Local Database**
   ```sql
   -- Connect to PostgreSQL as postgres user
   psql -U postgres
   
   -- Create database
   CREATE DATABASE ecommerce;
   
   -- Create user (replace 'your_username' and 'your_password' with your credentials)
   CREATE USER your_username WITH PASSWORD 'your_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE ecommerce TO your_username;
   ```

2. **Update Database Configuration**
   
   Edit `backend/app.js` and update the database connection:
   ```javascript
   const pool = new Pool({
     user: process.env.DB_USER || 'your_username',
     host: process.env.DB_HOST || 'localhost',
     database: process.env.DB_NAME || 'ecommerce',
     password: process.env.DB_PASSWORD || 'your_password',
     port: process.env.DB_PORT || 5432,
   });
   ```

3. **Run Initial Database Setup**
   ```bash
   # Run the main database schema
   psql -U your_username -d ecommerce -f DDL.sql
   
   # Insert initial data
   psql -U your_username -d ecommerce -f data.sql
   ```

### Subcategory Feature Migration

**Important**: This feature adds subcategories to the product comparison system.

1. **Run Migration Script**
   ```bash
   psql -U your_username -d ecommerce -f migration_subcategories.sql
   ```

2. **Verify Migration**
   ```bash
   # Check if subcategories table exists
   psql -U your_username -d ecommerce -c "SELECT COUNT(*) FROM subcategories;"
   
   # Check if products have subcategory assignments
   psql -U your_username -d ecommerce -c "SELECT COUNT(*) FROM products WHERE subcategory_id IS NOT NULL;"
   ```

### Environment Variables (Optional)

Create a `.env` file in the backend directory:
```env
DB_USER=your_username
DB_HOST=localhost
DB_NAME=ecommerce
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your-secret-key
```

### Running the Backend

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Verify API Endpoints**
   ```bash
   # Test categories endpoint
   curl http://localhost:5000/api/categories
   
   # Test subcategories endpoint
   curl http://localhost:5000/api/subcategories
   
   # Test products with subcategory filter
   curl "http://localhost:5000/api/products?subcategory_id=251"
   ```

## Database Schema Changes

### New Tables Added
- `subcategories`: Stores subcategory information
- `reviews`: Product review system
- `review_helpful`: Review helpfulness tracking
- `stores`: Store location information

### Modified Tables
- `products`: Added `subcategory_id` column
- `addresses`: Added `latitude` and `longitude` columns

### Indexes Added
- `idx_product_subcategory`: For subcategory-based queries
- `idx_subcategory_category`: For category-subcategory relationships
- `idx_review_product`: For product review queries
- `idx_review_user`: For user review queries

## Troubleshooting

### Common Issues

1. **Connection Error**
   ```
   error: password authentication failed for user "username"
   ```
   **Solution**: Verify your database credentials in `app.js`

2. **Table Not Found**
   ```
   error: relation "subcategories" does not exist
   ```
   **Solution**: Run the migration script: `psql -U your_username -d ecommerce -f migration_subcategories.sql`

3. **Permission Denied**
   ```
   error: permission denied for database "ecommerce"
   ```
   **Solution**: Grant database privileges to your user

### Verification Commands

```sql
-- Check database connection
SELECT current_database(), current_user;

-- Check if subcategories table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subcategories'
);

-- Check subcategory data
SELECT COUNT(*) as subcategory_count FROM subcategories;
SELECT COUNT(*) as products_with_subcategory FROM products WHERE subcategory_id IS NOT NULL;

-- Check category-subcategory relationships
SELECT c.name as category, COUNT(sc.subcategory_id) as subcategory_count
FROM categories c
LEFT JOIN subcategories sc ON c.category_id = sc.category_id
GROUP BY c.category_id, c.name
ORDER BY c.category_id;
```

## API Endpoints

### New Endpoints Added
- `GET /api/subcategories` - Get all subcategories
- `GET /api/subcategories/:categoryId` - Get subcategories by category
- Enhanced `GET /api/products` - Now supports subcategory filtering

### Updated Endpoints
- `GET /api/products` - Now includes subcategory information
- Product comparison logic - Now enforces same category/subcategory rule

## Development Notes

- The subcategory feature ensures products can only be compared within the same category and subcategory
- All existing products have been assigned appropriate subcategories
- The migration script is idempotent (safe to run multiple times)
- Database changes are backward compatible with existing functionality 