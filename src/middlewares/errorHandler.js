const multer = require('multer');
const { ValidationError, DatabaseError } = require('sequelize');

module.exports = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error occurred:', err);
    
    // Handle specific error types
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: 'error',
        type: 'FILE_UPLOAD_ERROR',
        message: err.message
      });
    }
    
    // Handle Sequelize validation errors
    if (err instanceof ValidationError) {
      return res.status(400).json({
        status: 'error',
        type: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        errors: err.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    // Handle database connection errors
    if (err instanceof DatabaseError) {
      return res.status(503).json({
        status: 'error',
        type: 'DATABASE_ERROR',
        message: 'Database operation failed',
        // Don't expose database details in production
        detail: process.env.NODE_ENV === 'production' ? null : err.message
      });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        type: 'AUTH_ERROR',
        message: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        type: 'AUTH_ERROR',
        message: 'Token expired'
      });
    }
    
    // Default error handler
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      status: 'error',
      type: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 
        'An unexpected error occurred' : 
        err.message
    });
};