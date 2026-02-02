const User = require('../models/user.model');
const crypto = require('crypto');
const mailer = require('../config/mail');
const cloudinary = require('../config/cloudinary');

async function createStaff(data) {
  const existed = await User.findOne({ email: data.email });
  if (existed) throw new Error('EMAIL_EXISTS');

  const token = crypto.randomUUID();

  const user = await User.create({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    role: data.role,
    passwordHash: null, 
    status: 'INVITED',
    invitationToken: token,
    invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await mailer.sendMail({
    to: user.email,
    subject: 'TechCare - Thư mời làm việc',
    html: `
      <p>Bạn được mời tham gia hệ thống <b>TechCare</b></p>
      <a href="http://localhost:5173/#/activate?token=${token}">
        Đồng ý làm việc
      </a>
      <p>Link có hiệu lực trong <b>24 giờ</b></p>
    `
  });

  return user;
}

async function uploadAvatar(userId, file) {
  if (!file) throw new Error('FILE_REQUIRED');

  const result = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    {
      folder: 'techcare/avatars'
    }
  );

  const user = await User.findByIdAndUpdate(
    userId,
    { avatar: result.secure_url },
    { new: true }
  );

  return user.avatar;
}

// Lấy tất cả nhân viên
async function getAllUsers() {
  const users = await User.find(
    {},
    {
      passwordHash: 0,
      invitationToken: 0
    }
  ).sort({ createdAt: -1 });

  return users;
}

async function updateProfile(userId, data) {
  const allowedFields = ['fullName']; 

  const updateData = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new Error('NO_FIELDS_TO_UPDATE');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!user) throw new Error('USER_NOT_FOUND');

  return user;
}

module.exports = { createStaff, uploadAvatar, getAllUsers, updateProfile };
