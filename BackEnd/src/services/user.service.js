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
async function getAllUsers(role) {
  const query = {};
  console.log('[getAllUsers Service] Input role param:', role, 'type:', typeof role);
  
  if (role) {
    const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role;
    query.role = normalizedRole;
    console.log('[getAllUsers Service] Searching for role:', normalizedRole);
  }
  
  console.log('[getAllUsers Service] MongoDB query filter:', JSON.stringify(query));

  try {
    const users = await User.find(
      query,
      {
        passwordHash: 0,
        invitationToken: 0
      }
    ).sort({ createdAt: -1 });

    console.log('[getAllUsers Service] Query returned:', users.length, 'users');
    
    if (users.length === 0 && role) {
      const allUsersDebug = await User.find({}, { fullName: 1, role: 1 });
      console.log('[getAllUsers Service] DEBUG: All users in DB with roles:', JSON.stringify(
        allUsersDebug.map(u => ({ fullName: u.fullName, role: u.role, roleType: typeof u.role })),
        null,
        2
      ));
    }
    
    if (users.length > 0) {
      console.log('[getAllUsers Service] First 3 users:', users.slice(0, 3).map(u => ({ fullName: u.fullName, role: u.role, status: u.status })));
    }

    return users;
  } catch (err) {
    console.error('[getAllUsers Service] Database query error:', err.message);
    throw err;
  }
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
