const cron = require('node-cron');
const RepairTicket = require('../models/repairTicket.model');

/**
 * Cron job chạy mỗi 5 phút: tự động từ chối các phiếu báo giá đã hết hạn chờ khách duyệt.
 */
cron.schedule('*/5 * * * *', async () => {
  await RepairTicket.updateMany(
    {
      status: 'QUOTED',
      approvalExpireAt: { $lt: new Date() }
    },
    {
      status: 'CUSTOMER_REJECTED'
    }
  );

  console.log('Approval auto-expire job executed');
});
