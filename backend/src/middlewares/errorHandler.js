const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Handle PostgreSQL errors
  if (err.code) {
    // Unique violation
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry found',
      });
    }
    // Foreign key violation
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Referenced record not found',
      });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Something went wrong',
  });
};

module.exports = errorHandler;