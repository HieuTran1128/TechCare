const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/warranty.controller');

/** GET /api/warranties — Lấy danh sách bảo hành, lọc theo mã phiếu/SĐT/trạng thái (frontdesk, manager) */
router.get('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.getAll);

/** PATCH /api/warranties/:id/claim — Xử lý yêu cầu bảo hành (STORE_FAULT/CUSTOMER_FAULT) (frontdesk, manager) */
router.patch('/:id/claim', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.claim);

/** PATCH /api/warranties/ticket/:ticketId/start — Bắt đầu sửa bảo hành sau khi kho duyệt (technician, manager) */
router.patch('/ticket/:ticketId/start', auth, role(ROLES.TECHNICIAN, ROLES.MANAGER), controller.startWarranty);

/** PATCH /api/warranties/ticket/:ticketId/complete — Hoàn thành bảo hành và gửi email thông báo khách (technician, manager) */
router.patch('/ticket/:ticketId/complete', auth, role(ROLES.TECHNICIAN, ROLES.MANAGER), controller.completeWarranty);

module.exports = router;
