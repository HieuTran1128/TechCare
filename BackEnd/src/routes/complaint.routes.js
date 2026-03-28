const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/complaint.controller');

// Public - khách hàng (không cần login)
router.get('/form/:token', controller.getForm);
router.post('/submit/:token', controller.submit);

// Manager only
router.get('/', auth, role(ROLES.MANAGER), controller.list);
router.get('/stats', auth, role(ROLES.MANAGER), controller.stats);
router.get('/:id', auth, role(ROLES.MANAGER), controller.detail);
router.patch('/:id/resolve', auth, role(ROLES.MANAGER), controller.resolve);

module.exports = router;
