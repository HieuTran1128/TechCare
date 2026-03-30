const service = require('../services/part.service');

/**
 * Gửi response lỗi với status code và message cho trước.
 */
const sendError = (res, status, message) => {
  res.status(status).json({ message });
};

/**
 * Lấy danh sách linh kiện, hỗ trợ lọc theo tồn kho thấp, hết hàng và tìm kiếm.
 */
exports.getAll = async (req, res) => {
  try {
    const parts = await service.listParts({
      lowStock: req.query.lowStock === 'true',
      outOfStock: req.query.outOfStock === 'true',
      search: req.query.search,
    });
    res.json(parts);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * Tạo mới một linh kiện.
 */
exports.create = async (req, res) => {
  try {
    const part = await service.createPart(req.body);
    res.status(201).json(part);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Cập nhật thông tin linh kiện theo ID.
 */
exports.update = async (req, res) => {
  try {
    const part = await service.updatePart(req.params.id, req.body);
    res.json(part);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Xóa linh kiện theo ID.
 */
exports.remove = async (req, res) => {
  try {
    await service.deletePart(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Nhập kho cho một linh kiện cụ thể theo ID.
 */
exports.importStock = async (req, res) => {
  try {
    const part = await service.importStock(req.params.id, req.body, req.user.userId);
    res.json(part);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Tạo đơn nhập kho gồm nhiều linh kiện cùng lúc.
 */
exports.importOrder = async (req, res) => {
  try {
    const result = await service.importStockOrder(req.body, req.user.userId);
    res.json(result);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Lấy lịch sử nhập kho của tất cả linh kiện.
 */
exports.getImportHistory = async (_req, res) => {
  try {
    const history = await service.listImportHistory();
    res.json(history);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * Lấy lịch sử xuất kho (sử dụng linh kiện) của tất cả linh kiện.
 */
exports.getUsageHistory = async (_req, res) => {
  try {
    const history = await service.listUsageHistory();
    res.json(history);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * Tạo cảnh báo tồn kho thấp cho một linh kiện.
 */
exports.createAlert = async (req, res) => {
  try {
    const alert = await service.createStockAlert(req.params.id, req.body.message, req.user.userId);
    res.status(201).json(alert);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Lấy danh sách tất cả cảnh báo tồn kho.
 */
exports.getAlerts = async (_req, res) => {
  try {
    const alerts = await service.listStockAlerts();
    res.json(alerts);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * Lấy thống kê tổng quan kho linh kiện.
 */
exports.getStats = async (_req, res) => {
  try {
    const stats = await service.getInventoryStats();
    res.json(stats);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * Lấy dữ liệu KPI kho linh kiện theo khoảng thời gian.
 */
exports.getKPI = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const kpi = await service.getInventoryKPI({ fromDate, toDate });
    res.json(kpi);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
