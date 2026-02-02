// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', {
    message: err.message,
    status: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      success: false,
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      success: false
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      success: false
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      success: false
    });
  }

  // Custom errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      success: false
    });
  }

  // Default error
  res.status(500).json({
    message: err.message || 'Internal server error',
    success: false
  });
};

module.exports = errorHandler;
