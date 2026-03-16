const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/repairTicket.controller');

router.get('/public', controller.getPublic);

router.post('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.create);
router.get('/', auth, controller.getAll);

router.patch('/:id/assign', auth, role(ROLES.MANAGER), controller.assign);

router.patch('/:id/diagnose', auth, role(ROLES.TECHNICIAN), controller.diagnose);

router.patch('/:id/approve-desk', auth, role(ROLES.FRONTDESK), controller.approveAtDesk);

router.get('/customer-approve/:token', controller.customerApprove);
router.get('/customer-reject/:token', controller.customerReject);

module.exports = router;
