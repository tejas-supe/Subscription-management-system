const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_enterprise_secret_jwt_key_2025_prod_secure';

// Authenticate token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Populate user info
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account not found or suspended'
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Role-based access control
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
};

// Customer self-service scope guard
const verifyCustomerOwnership = (req, res, next) => {
  if (req.user && req.user.role === 'CUSTOMER') {
    // If request has customerId in params or query or body, it MUST match user.customerId
    const targetCustomerId = req.params.customerId || req.query.customerId || req.body.customerId;
    if (targetCustomerId && req.user.customerId && targetCustomerId.toString() !== req.user.customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Customer cannot access data of another customer'
      });
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  verifyCustomerOwnership,
  JWT_SECRET
};
