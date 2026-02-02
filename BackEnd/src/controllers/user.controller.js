const userService = require('../services/user.service');

exports.createUser = async (req, res, next) => {
  try {
    await userService.createStaff(req.body);
    res.status(201).json({ message: 'Invitation sent' });
  } catch (err) {
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
  const users = await userService.getAllUsers();

  res.json({
    total: users.length,
    data: users
  });
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

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash -invitationToken -forgotPasswordOTP');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};