const cron = require('node-cron');
const RepairTicket = require('../models/repairTicket.model');

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
