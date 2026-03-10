const userService = require('../services/user.service');
const User = require('../models/user.model');

exports.createUser = async (req, res, next) => {
  try {
    await userService.createStaff(req.body);
    res.status(201).json({ message: 'Invitation sent' });
  } catch (err) {
    if (err.message === 'INVALID_STAFF_ROLE') {
      return res.status(400).json({ message: 'Manager chỉ được tạo tài khoản technician/frontdesk/storekeeper' });
    }
    next(err);
  }
};

exports.updateAvatar = async (req, res) => {
  const avatarUrl = await userService.uploadAvatar(
    req.user.userId,
    req.file
  );

  res.json({
    message: 'Avatar updated',
    avatar: avatarUrl
  });
};

exports.getAllUsers = async (req, res) => {
  console.log('\n========== getAllUsers CONTROLLER ==========');
  console.log('Timestamp:', new Date().toISOString());
  try {
    console.log('[getAllUsers] Query params:', req.query);
    console.log('[getAllUsers] User from auth middleware:', JSON.stringify(req.user));
    
    let roleFilter = req.query.role;
    console.log('[getAllUsers] roleFilter from query:', roleFilter, 'type:', typeof roleFilter);
    
    if (typeof roleFilter === 'string') {
      roleFilter = roleFilter.toLowerCase();
    }
    console.log('[getAllUsers] roleFilter after lowercase:', roleFilter);
    
    const users = await userService.getAllUsers(roleFilter);
    console.log('[getAllUsers] Query returned count:', users.length);
    
    if (users.length === 0) {
      console.log('[getAllUsers] WARNING: No users found! Checking all users in DB...');
      const allUsers = await userService.getAllUsers(null);
      console.log('[getAllUsers] Total users in DB:', allUsers.length);
      if (allUsers.length > 0) {
        console.log('[getAllUsers] Sample roles in DB:', allUsers.slice(0, 5).map(u => ({ name: u.fullName, role: u.role, roleType: typeof u.role })));
      }
    } else {
      console.log('[getAllUsers] Sample users:', JSON.stringify(users.slice(0, 3).map(u => ({_id: u._id, fullName: u.fullName, role: u.role})), null, 2));
    }

    const responseBody = {
      total: users.length,
      data: users
    };
    console.log('[getAllUsers] Sending response:', JSON.stringify({...responseBody, data: `[${users.length} items]`}));
    
    res.json(responseBody);
    console.log('[getAllUsers] Response sent successfully');
  } catch (err) {
    console.error('[getAllUsers] Error caught:', err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
  console.log('========== END getAllUsers ==========\n');
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updated = await userService.updateProfile(req.user.userId, req.body);
    res.json({
      message: 'Profile updated',
      user: {
        id: updated._id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        avatar: updated.avatar,
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await userService.removeUser(req.user.userId, req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const { blocked } = req.body;
    const updated = await userService.setUserBlocked(req.params.id, Boolean(blocked));
    res.json({
      message: blocked ? 'User blocked' : 'User unblocked',
      user: {
        _id: updated._id,
        status: updated.status,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash -invitationToken -forgotPasswordOTP');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};