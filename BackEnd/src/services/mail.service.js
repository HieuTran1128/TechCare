const transporter = require('../config/mail');

/**
 * Gửi email thông qua transporter đã cấu hình.
 */
async function sendMail(options) {
  return transporter.sendMail(options);
}

module.exports = { sendMail };
