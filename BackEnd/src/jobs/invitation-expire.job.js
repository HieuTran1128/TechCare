const cron = require('node-cron');
const User = require('../models/user.model');

/**
 * Cron job chạy mỗi 10 phút: đánh dấu các lời mời đã hết hạn thành 'expired' và vô hiệu hóa tài khoản.
 */
cron.schedule('*/10 * * * *', async () => {
  try {
    const now = new Date();

    const result = await User.updateMany(
      {
        invitationStatus: 'pending',
        invitationExpiresAt: { $lt: now }
      },
      {
        invitationStatus: 'expired',
        isActive: false
      }
    );

    console.log('Invite expire job executed:', result.modifiedCount);
  } catch (error) {
    console.error('Invite expire job error:', error);
  }
});
