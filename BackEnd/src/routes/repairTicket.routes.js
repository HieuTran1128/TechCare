const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/repairTicket.controller');

router.post('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.create);
router.get('/', auth, controller.getAll);

router.patch('/:id/assign', auth, role(ROLES.MANAGER), controller.assign);

router.patch(
  '/:id/inventory-request',
  auth,
  role(ROLES.TECHNICIAN),
  controller.requestInventory,
);

router.patch(
  '/:id/inventory-response',
  auth,
  role(ROLES.STOREKEEPER),
  controller.respondInventory,
);

router.patch('/:id/quotation', auth, role(ROLES.TECHNICIAN), controller.sendQuotation);
router.patch('/:id/inventory-reject-mail', auth, role(ROLES.TECHNICIAN), controller.sendInventoryRejection);
router.patch('/:id/start', auth, role(ROLES.TECHNICIAN), controller.startRepair);
router.patch('/:id/complete', auth, role(ROLES.TECHNICIAN), controller.complete);

router.get('/customer-approve/:token', controller.customerApprove);
router.get('/customer-reject/:token', controller.customerReject);

router.get('/manager/summary', auth, role(ROLES.MANAGER), controller.getManagerSummary);

module.exports = router;
