const errorHandler = (err, req, res, next) => {
  console.error('[Error]', {
    message: err.message,
    status: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      success: false,
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      success: false
    });
  }

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

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      success: false
    });
  }

  res.status(500).json({
    message: err.message || 'Internal server error',
    success: false
  });
};

module.exports = errorHandler;
