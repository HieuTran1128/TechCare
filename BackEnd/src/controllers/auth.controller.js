const authService = require("../services/auth.service");

/**
 * Kích hoạt tài khoản nhân viên bằng invitation token và mật khẩu mới.
 */
exports.activate = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      message: "TOKEN_AND_PASSWORD_REQUIRED",
    });
  }

  await authService.activateAccount(token, password);

  res.json({ message: "Account activated" });
};

/**
 * Đăng nhập bằng email và mật khẩu, trả về JWT token qua cookie và response body.
 */
exports.login = async (req, res, next) => {
  try {
    console.log('[Auth] Login attempt:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password required',
        success: false
      });
    }

    const { user, token } = await authService.login(email, password);
    
    console.log('[Auth] Login success for user:', user._id);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login success',
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    next(error);
  }
};

/**
 * Gửi OTP đặt lại mật khẩu đến email người dùng.
 */
exports.forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ message: "OTP sent to email" });
};

/**
 * Xác minh OTP quên mật khẩu.
 */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  await authService.verifyForgotPasswordOTP(email, otp);

  res.json({ message: 'OTP valid' });
};

/**
 * Đặt lại mật khẩu mới sau khi xác minh OTP thành công.
 */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await authService.resetPassword(email, otp, newPassword);

  res.json({ message: 'Password reset successfully' });
};

/**
 * Đăng xuất người dùng bằng cách xóa cookie access_token.
 */
exports.logout = async (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logout success' });
};
