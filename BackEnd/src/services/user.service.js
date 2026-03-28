const User = require('../models/user.model');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mailer = require('../config/mail');
const cloudinary = require('../config/cloudinary');
const ROLES = require('../constants/roles.constant');
const { inviteTemplate } = require('../utils/mailTemplates');

async function createStaff(data) {
  const existed = await User.findOne({ email: data.email });
  if (existed) throw new Error('EMAIL_EXISTS');

  const allowedRoles = [ROLES.TECHNICIAN, ROLES.FRONTDESK, ROLES.STOREKEEPER];
  if (!allowedRoles.includes(data.role)) {
    throw new Error('INVALID_STAFF_ROLE');
  }

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

  const activationLink = `http://localhost:5173/#/activate?token=${token}`;

  await mailer.sendMail({
    to: user.email,
    subject: 'TechCare - Thư mời làm việc',
    html: inviteTemplate(user.fullName, activationLink),
  });

  return user;
}

async function createStaffBulk(staffList) {
  if (!Array.isArray(staffList) || staffList.length === 0) {
    throw new Error('STAFF_LIST_REQUIRED');
  }

  const allowedRoles = [ROLES.TECHNICIAN, ROLES.FRONTDESK, ROLES.STOREKEEPER];
  const results = [];

  for (const staff of staffList) {
    const existed = await User.findOne({ email: staff.email });
    if (existed) {
      results.push({
        email: staff.email,
        status: 'SKIPPED',
        reason: 'EMAIL_EXISTS',
      });
      continue;
    }

    if (!allowedRoles.includes(staff.role)) {
      results.push({
        email: staff.email,
        status: 'SKIPPED',
        reason: 'INVALID_STAFF_ROLE',
      });
      continue;
    }

    const token = crypto.randomUUID();

    const user = await User.create({
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      passwordHash: null,
      status: 'INVITED',
      invitationToken: token,
      invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const activationLink = `http://localhost:5173/#/activate?token=${token}`;

    await mailer.sendMail({
      to: user.email,
      subject: 'TechCare - Thư mời làm việc',
      html: inviteTemplate(user.fullName, activationLink),
    });

    results.push({
      email: user.email,
      status: 'CREATED',
    });
  }

  return results;
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
  const allowedFields = ['fullName', 'phone'];

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

async function removeUser(managerId, userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  if (user.role === 'manager') {
    throw new Error('CANNOT_DELETE_MANAGER');
  }

  if (user._id.toString() === managerId) {
    throw new Error('CANNOT_DELETE_SELF');
  }

  await User.findByIdAndDelete(userId);
}

async function setUserBlocked(userId, blocked) {
  const user = await User.findById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  if (user.role === 'manager') {
    throw new Error('CANNOT_BLOCK_MANAGER');
  }

  user.status = blocked ? 'BLOCKED' : 'ACTIVE';
  await user.save();

  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword) throw new Error('CURRENT_PASSWORD_REQUIRED');
  if (!newPassword) throw new Error('NEW_PASSWORD_REQUIRED');
  if (String(newPassword).length < 6) throw new Error('PASSWORD_TOO_SHORT');

  const user = await User.findById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');
  if (!user.passwordHash) throw new Error('PASSWORD_NOT_SET');

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new Error('INVALID_CURRENT_PASSWORD');

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
}

module.exports = {
  createStaff,
  createStaffBulk,
  uploadAvatar,
  getAllUsers,
  updateProfile,
  removeUser,
  setUserBlocked,
  changePassword,
};
