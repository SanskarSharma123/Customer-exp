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

