const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/customer.controller');

router.post('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.create);

router.get('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.getAll);

router.patch('/:id', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.update);

module.exports = router;
