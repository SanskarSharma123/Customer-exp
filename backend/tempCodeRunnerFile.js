const pool = new Pool({
  user: process.env.DB_USER || 'vidya',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'quick_commerce',
  password: process.env.DB_PASSWORD || 'commerceproject',
  port: process.env.DB_PORT || 5432,
});