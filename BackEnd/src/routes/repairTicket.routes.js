const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { optionalAuth } = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/repairTicket.controller');

/** POST /api/ticket — Tạo phiếu sửa chữa mới (frontdesk, manager) */
router.post('/', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.create);

/** GET /api/ticket — Lấy danh sách phiếu sửa chữa, lọc theo role (optionalAuth) */
router.get('/', optionalAuth, controller.getAll);

/** GET /api/ticket/manager/summary — Lấy thống kê tổng quan cho manager */
router.get('/manager/summary', auth, role(ROLES.MANAGER), controller.getManagerSummary);

/** GET /api/ticket/frontdesk/find-by-code — Tìm phiếu theo mã chính xác (frontdesk, manager) */
router.get('/frontdesk/find-by-code', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.findByCode);

/** GET /api/ticket/frontdesk/search-by-code — Gợi ý danh sách phiếu theo từ khóa mã (frontdesk, manager) */
router.get('/frontdesk/search-by-code', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.searchByCode);

/** GET /api/ticket/customer-approve/:token — Khách hàng đồng ý báo giá qua link email (public) */
router.get('/customer-approve/:token', controller.customerApprove);

/** GET /api/ticket/customer-reject/:token — Khách hàng từ chối báo giá qua link email (public) */
router.get('/customer-reject/:token', controller.customerReject);

/** POST /api/ticket/payment/payos/webhook — Nhận webhook xác nhận thanh toán từ PayOS (public) */
router.post('/payment/payos/webhook', controller.payosWebhook);

/** PATCH /api/ticket/:id/assign — Phân công kỹ thuật viên cho phiếu (frontdesk) */
router.patch('/:id/assign', auth, role(ROLES.FRONTDESK), controller.assign);

/** PATCH /api/ticket/:id/inventory-request — Kỹ thuật viên gửi yêu cầu linh kiện kho */
router.patch('/:id/inventory-request', auth, role(ROLES.TECHNICIAN), controller.requestInventory);

/** PATCH /api/ticket/:id/inventory-response — Thủ kho duyệt hoặc từ chối yêu cầu linh kiện */
router.patch('/:id/inventory-response', auth, role(ROLES.STOREKEEPER), controller.respondInventory);

/** PATCH /api/ticket/:id/quotation — Kỹ thuật viên gửi báo giá cho khách qua email */
router.patch('/:id/quotation', auth, role(ROLES.TECHNICIAN), controller.sendQuotation);

/** PATCH /api/ticket/:id/inventory-reject-mail — Gửi email thông báo kho từ chối linh kiện cho khách */
router.patch('/:id/inventory-reject-mail', auth, role(ROLES.TECHNICIAN), controller.sendInventoryRejection);

/** PATCH /api/ticket/:id/start — Kỹ thuật viên bắt đầu sửa chữa sau khi khách đồng ý */
router.patch('/:id/start', auth, role(ROLES.TECHNICIAN), controller.startRepair);

/** PATCH /api/ticket/:id/complete — Kỹ thuật viên hoàn tất sửa chữa và gửi email thông báo khách */
router.patch('/:id/complete', auth, role(ROLES.TECHNICIAN), controller.complete);

/** POST /api/ticket/:id/payment/payos — Tạo link thanh toán PayOS cho phiếu đã hoàn thành (frontdesk, manager) */
router.post('/:id/payment/payos', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.createPayosPayment);

/** PATCH /api/ticket/:id/payment/mark-paid — Đánh dấu phiếu đã thanh toán (frontdesk, manager) */
router.patch('/:id/payment/mark-paid', auth, role(ROLES.FRONTDESK, ROLES.MANAGER), controller.markPaid);

module.exports = router;
