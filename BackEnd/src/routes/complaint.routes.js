const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/complaint.controller');

// Public - khách hàng submit từ link trong mail (không cần đăng nhập)
router.post('/', controller.create);

// Nội bộ - manager + frontdesk xem danh sách
router.get('/', auth, role(ROLES.MANAGER, ROLES.FRONTDESK), controller.getAll);

// Manager xử lý và gửi mail phản hồi
router.patch('/:id/resolve', auth, role(ROLES.MANAGER), controller.resolve);

// Cập nhật trạng thái (IN_PROGRESS)
router.patch('/:id/status', auth, role(ROLES.MANAGER, ROLES.FRONTDESK), controller.updateStatus);

module.exports = router;
