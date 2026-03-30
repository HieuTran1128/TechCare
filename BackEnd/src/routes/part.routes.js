const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/part.controller');

/** GET /api/parts — Lấy danh sách linh kiện, hỗ trợ lọc tồn kho thấp/hết hàng (manager, storekeeper, technician) */
router.get('/', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER, ROLES.TECHNICIAN), controller.getAll);

/** GET /api/parts/stats/summary — Lấy thống kê tổng quan kho linh kiện (manager, storekeeper) */
router.get('/stats/summary', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER), controller.getStats);

/** GET /api/parts/kpi — Lấy dữ liệu KPI kho theo khoảng thời gian (manager) */
router.get('/kpi', auth, role(ROLES.MANAGER), controller.getKPI);

/** GET /api/parts/import-history — Lấy lịch sử nhập kho (manager) */
router.get('/import-history', auth, role(ROLES.MANAGER), controller.getImportHistory);

/** GET /api/parts/usage-history — Lấy lịch sử xuất kho/sử dụng linh kiện (manager, storekeeper) */
router.get('/usage-history', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER), controller.getUsageHistory);

/** GET /api/parts/alerts — Lấy danh sách cảnh báo tồn kho thấp (manager, storekeeper) */
router.get('/alerts', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER), controller.getAlerts);

/** POST /api/parts — Tạo mới linh kiện (manager) */
router.post('/', auth, role(ROLES.MANAGER), controller.create);

/** POST /api/parts/import — Tạo đơn nhập kho nhiều linh kiện cùng lúc (manager) */
router.post('/import', auth, role(ROLES.MANAGER), controller.importOrder);

/** PATCH /api/parts/:id — Cập nhật thông tin linh kiện theo ID (manager) */
router.patch('/:id', auth, role(ROLES.MANAGER), controller.update);

/** DELETE /api/parts/:id — Xóa linh kiện theo ID (manager) */
router.delete('/:id', auth, role(ROLES.MANAGER), controller.remove);

/** POST /api/parts/:id/import — Nhập kho cho một linh kiện cụ thể (manager) */
router.post('/:id/import', auth, role(ROLES.MANAGER), controller.importStock);

/** POST /api/parts/:id/alert — Tạo cảnh báo tồn kho thấp cho linh kiện (storekeeper) */
router.post('/:id/alert', auth, role(ROLES.STOREKEEPER), controller.createAlert);

module.exports = router;
