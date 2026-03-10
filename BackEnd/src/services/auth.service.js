const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwtUtil = require("../utils/jwt.util");
const mailer = require("../config/mail");

// Kích Hoạt Tài Khoản
async function activateAccount(token, password) {
  const user = await User.findOne({
    invitationToken: token,
    status: "INVITED",
  });

  if (!user) {
    throw new Error("INVALID_TOKEN");
  }

  if (user.invitationExpiresAt < new Date()) {
    user.status = "REJECTED";
    user.invitationToken = null;
    user.invitationExpiresAt = null;
    await user.save();
    throw new Error("EXPIRED");
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.status = "ACTIVE";

  user.invitationToken = null;
  user.invitationExpiresAt = null;

  await user.save();

  return user;
}

// Đăng Nhập + Cookie
async function login(email, password) {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.status === 'BLOCKED') {
      const error = new Error('Account is blocked');
      error.statusCode = 403;
      throw error;
    }

    if (user.status !== 'ACTIVE') {
      const error = new Error('Account is not active');
      error.statusCode = 403;
      throw error;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const error = new Error('Invalid password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwtUtil.sign(
      { 
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { user, token };
  } catch (error) {
    console.error('[AuthService] Login error:', error.message);
    throw error;
  }
}


// Quên Mật Khẩu
async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("EMAIL_NOT_FOUND");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.forgotPasswordOTP = otp;
  user.forgotPasswordExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();

  await mailer.sendMail({
    to: email,
    subject: "TechCare - OTP đặt lại mật khẩu",
    html: `
      <p>Mã OTP của bạn:</p>
      <h2>${otp}</h2>
      <p>Có hiệu lực trong 10 phút</p>
    `,
  });
}

// Xác Minh OTP
async function verifyForgotPasswordOTP(email, otp) {
  const user = await User.findOne({
    email,
    forgotPasswordOTP: otp,
  });

  if (!user) throw new Error("INVALID_OTP");

  if (user.forgotPasswordExpiresAt < new Date()) {
    throw new Error("OTP_EXPIRED");
  }

  return true;
}

// Reset Mật Khẩu
async function resetPassword(email, otp, newPassword) {
  const user = await User.findOne({
    email,
    forgotPasswordOTP: otp,
  });

  if (!user) throw new Error("INVALID_OTP");

  if (user.forgotPasswordExpiresAt < new Date()) {
    throw new Error("OTP_EXPIRED");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.forgotPasswordOTP = null;
  user.forgotPasswordExpiresAt = null;

  await user.save();
}

module.exports = { activateAccount, login, forgotPassword, verifyForgotPasswordOTP, resetPassword };
