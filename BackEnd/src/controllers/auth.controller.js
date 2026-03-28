const authService = require("../services/auth.service");

// Kích Hoạt Tài Khoản
exports.activate = async (req, res) => {
  const { token, password, descriptor } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      message: "TOKEN_AND_PASSWORD_REQUIRED",
    });
  }

  await authService.activateAccount(token, password, descriptor);

  res.json({ message: "Account activated" });
};

// Đăng Nhập + Cookie
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

exports.loginFace = async (req, res, next) => {
  try {
    const { descriptor } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp dữ liệu khuôn mặt hợp lệ' });
    }

    const { user, token } = await authService.loginFace(descriptor);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Face Login success',
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
    if (error.message === 'FACE_NOT_MATCH') {
      return res.status(401).json({ success: false, message: 'Nhận diện sai! Khuôn mặt này chưa khớp tài khoản nào.' });
    }
    console.error('[Auth] Face Login error:', error.message);
    next(error);
  }
};

exports.login2FA = async (req, res, next) => {
  try {
    const { email, password, descriptor } = req.body;
    
    if (!email || !password || !descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng nhập hoặc khuôn mặt' });
    }

    const { user, token } = await authService.login2FA(email, password, descriptor);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login 2FA success',
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
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('[Auth] 2FA Login error:', error.message);
    next(error);
  }
};

// Quên Mật Khẩu
exports.forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ message: "OTP sent to email" });
};

// Xác Minh OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  await authService.verifyForgotPasswordOTP(email, otp);

  res.json({ message: 'OTP valid' });
};

// Reset Mật Khẩu
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await authService.resetPassword(email, otp, newPassword);

  res.json({ message: 'Password reset successfully' });
};

// Đăng Xuất
exports.logout = async (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logout success' });
};