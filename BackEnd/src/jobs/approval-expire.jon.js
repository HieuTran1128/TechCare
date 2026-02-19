const cron = require('node-cron');
const RepairTicket = require('../models/repairTicket.model');

cron.schedule('*/5 * * * *', async () => {
  await RepairTicket.updateMany(
    {
      status: 'WAITING_APPROVAL',
      approvalExpireAt: { $lt: new Date() }
    },
    {
      status: 'REJECTED'
    }
  );

  console.log('Approval auto-expire job executed');
});
