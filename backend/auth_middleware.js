const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '286e83e9';

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

const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Admin rights required' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin }; 