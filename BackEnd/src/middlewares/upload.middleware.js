const multer = require('multer');

/**
 * Cấu hình multer lưu file vào bộ nhớ RAM, giới hạn kích thước 20MB.
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

module.exports = upload;
