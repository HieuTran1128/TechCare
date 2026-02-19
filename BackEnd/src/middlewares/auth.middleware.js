const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  let token = req.cookies?.access_token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    console.log('[Auth] Không có token trong request');
    return res.status(401).json({ message: 'Unauthorized - No token' });
  }

  console.log('[Auth] Token nhận được (đầu 50 ký tự):', token.slice(0, 50));
  console.log('[Auth] Token nhận được (cuối 50 ký tự):', token.slice(-50));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth] Verify thành công:', JSON.stringify(decoded));
    req.user = decoded;
    next();
  } catch (err) {
    console.log('[Auth] Verify lỗi:', err.name, err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
