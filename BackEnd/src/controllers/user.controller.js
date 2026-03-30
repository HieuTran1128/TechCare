const userService = require('../services/user.service');
const User = require('../models/user.model');

/**
 * Tạo tài khoản nhân viên mới và gửi email mời kích hoạt.
 */
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

/**
 * Tạo nhiều tài khoản nhân viên cùng lúc từ danh sách staffList.
 */
exports.createUserBulk = async (req, res, next) => {
  try {
    const results = await userService.createStaffBulk(req.body.staffList);
    res.status(201).json({
      message: 'Bulk accounts processed',
      results,
    });
  } catch (err) {
    if (err.message === 'STAFF_LIST_REQUIRED') {
      return res.status(400).json({ message: 'Danh sách nhân viên không được để trống' });
    }
    next(err);
  }
};

/**
 * Upload và cập nhật ảnh đại diện cho người dùng hiện tại.
 */
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

/**
 * Lấy danh sách tất cả nhân viên, có thể lọc theo role.
 */
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

/**
 * Cập nhật thông tin cá nhân (họ tên, số điện thoại) của người dùng hiện tại.
 */
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

/**
 * Đổi mật khẩu người dùng hiện tại sau khi xác minh mật khẩu cũ.
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    await userService.changePassword(req.user.userId, currentPassword, newPassword);

    res.json({ message: 'Password updated' });
  } catch (err) {
    if (err.message === 'CURRENT_PASSWORD_REQUIRED') {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại' });
    }
    if (err.message === 'NEW_PASSWORD_REQUIRED') {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới' });
    }
    if (err.message === 'PASSWORD_TOO_SHORT') {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (err.message === 'PASSWORD_NOT_SET') {
      return res.status(400).json({ message: 'Tài khoản chưa có mật khẩu. Vui lòng dùng chức năng quên mật khẩu.' });
    }
    if (err.message === 'INVALID_CURRENT_PASSWORD') {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Xóa tài khoản nhân viên theo ID (không cho phép xóa manager hoặc chính mình).
 */
exports.deleteUser = async (req, res) => {
  try {
    await userService.removeUser(req.user.userId, req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Khóa hoặc mở khóa tài khoản nhân viên theo ID.
 */
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

/**
 * Lấy thông tin người dùng hiện đang đăng nhập.
 */
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
