const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/device.controller');

/** POST /api/devices — Tạo mới thiết bị và liên kết với khách hàng (frontdesk) */
router.post('/', auth, role(ROLES.FRONTDESK), controller.create);

/** GET /api/devices/customer/:customerId — Lấy danh sách thiết bị của một khách hàng */
router.get('/customer/:customerId', auth, controller.getByCustomer);

module.exports = router;
