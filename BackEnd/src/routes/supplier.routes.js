const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/supplier.controller');

/** GET /api/suppliers — Lấy danh sách tất cả nhà cung cấp (manager) */
router.get('/', auth, role(ROLES.MANAGER), controller.getAll);

/** POST /api/suppliers — Tạo mới nhà cung cấp (manager) */
router.post('/', auth, role(ROLES.MANAGER), controller.create);

/** PATCH /api/suppliers/:id — Cập nhật thông tin nhà cung cấp theo ID (manager) */
router.patch('/:id', auth, role(ROLES.MANAGER), controller.update);

/** DELETE /api/suppliers/:id — Xóa nhà cung cấp theo ID (manager) */
router.delete('/:id', auth, role(ROLES.MANAGER), controller.remove);

module.exports = router;
