const router = require('express').Router();
const controller = require('../controllers/auth.controller');

router.post('/activate', controller.activate);
router.post('/login', controller.login);
router.post('/login-2fa', controller.login2FA);
router.post('/login-face', controller.loginFace);
router.post('/forgot-password', controller.forgotPassword);
router.post('/verify-otp', controller.verifyOtp);
router.post('/reset-password', controller.resetPassword);
router.post('/logout', controller.logout);

module.exports = router;