const router = require('express').Router();
const controller = require('../controllers/auth.controller');

/** POST /api/auth/activate — Kích hoạt tài khoản bằng invitation token và mật khẩu mới */
router.post('/activate', controller.activate);

/** POST /api/auth/login — Đăng nhập bằng email và mật khẩu */
router.post('/login', controller.login);

/** POST /api/auth/forgot-password — Gửi OTP đặt lại mật khẩu đến email */
router.post('/forgot-password', controller.forgotPassword);

/** POST /api/auth/verify-otp — Xác minh OTP quên mật khẩu */
router.post('/verify-otp', controller.verifyOtp);

/** POST /api/auth/reset-password — Đặt lại mật khẩu mới sau khi xác minh OTP */
router.post('/reset-password', controller.resetPassword);

/** POST /api/auth/logout — Đăng xuất, xóa cookie access_token */
router.post('/logout', controller.logout);

module.exports = router;
