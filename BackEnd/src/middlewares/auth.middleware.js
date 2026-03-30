const jwt = require('jsonwebtoken');

/**
 * Lấy JWT token từ cookie hoặc header Authorization (Bearer).
 */
function extractToken(req) {
  let token = req.cookies?.access_token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  return token;
}

/**
 * Xác thực và giải mã JWT token, trả về payload.
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Middleware xác thực bắt buộc. Trả về 401 nếu không có token hoặc token không hợp lệ.
 */
function auth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Middleware xác thực tùy chọn. Gán req.user nếu token hợp lệ, ngược lại gán null và tiếp tục.
 */
function optionalAuth(req, _res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = verifyToken(token);
  } catch (_err) {
    req.user = null;
  }

  next();
}

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
