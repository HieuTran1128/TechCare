const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token từ payload, hết hạn sau 8 giờ.
 */
function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { sign };
