const service = require('../services/supplier.service');

/**
 * Gửi response lỗi với status code và message.
 */
const sendError = (res, status, message) => {
  res.status(status).json({ message });
};

/**
 * Lấy danh sách tất cả nhà cung cấp.
 */
exports.getAll = async (_req, res) => {
  try {
    const suppliers = await service.listSuppliers();
    res.json(suppliers);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * Tạo mới nhà cung cấp từ dữ liệu request body.
 */
exports.create = async (req, res) => {
  try {
    const supplier = await service.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Cập nhật thông tin nhà cung cấp theo ID.
 */
exports.update = async (req, res) => {
  try {
    const supplier = await service.updateSupplier(req.params.id, req.body);
    res.json(supplier);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

/**
 * Xóa nhà cung cấp theo ID.
 */
exports.remove = async (req, res) => {
  try {
    await service.deleteSupplier(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};
