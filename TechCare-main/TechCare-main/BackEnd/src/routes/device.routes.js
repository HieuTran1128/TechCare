const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/device.controller');

router.post('/', auth, role(ROLES.FRONTDESK), controller.create);

router.get('/customer/:customerId', auth, controller.getByCustomer);

module.exports = router;
