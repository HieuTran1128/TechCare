const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/customer.controller');

/** POST /api/customers — Tạo mới khách hàng (frontdesk, manager) */
router.post('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.create);

/** GET /api/customers — Lấy danh sách tất cả khách hàng (frontdesk, manager) */
router.get('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.getAll);

/** PATCH /api/customers/:id — Cập nhật thông tin khách hàng theo ID (frontdesk, manager) */
router.patch('/:id', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.update);

module.exports = router;
