const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/warranty.controller');

router.get('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.getAll);
router.patch('/:id/claim', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.claim);
router.patch('/ticket/:ticketId/complete', auth, role(ROLES.TECHNICIAN, ROLES.MANAGER), controller.completeWarranty);
router.patch('/ticket/:ticketId/start', auth, role(ROLES.TECHNICIAN, ROLES.MANAGER), controller.startWarranty);

module.exports = router;
