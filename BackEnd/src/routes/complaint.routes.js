const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/complaint.controller');

// --- Public (không cần đăng nhập) ---

/** GET /api/complaints/form/:token — Lấy thông tin form khiếu nại từ complaint token */
router.get('/form/:token', controller.getForm);

/** POST /api/complaints/submit/:token — Khách hàng gửi khiếu nại qua complaint token */
router.post('/submit/:token', controller.submit);

// --- Manager only ---

/** GET /api/complaints — Lấy danh sách khiếu nại có lọc và phân trang */
router.get('/', auth, role(ROLES.MANAGER), controller.list);

/** GET /api/complaints/stats — Thống kê số lượng khiếu nại theo trạng thái */
router.get('/stats', auth, role(ROLES.MANAGER), controller.stats);

/** GET /api/complaints/:id — Lấy chi tiết một khiếu nại theo ID */
router.get('/:id', auth, role(ROLES.MANAGER), controller.detail);

/** PATCH /api/complaints/:id/resolve — Xử lý khiếu nại và gửi email phản hồi cho khách */
router.patch('/:id/resolve', auth, role(ROLES.MANAGER), controller.resolve);

module.exports = router;
