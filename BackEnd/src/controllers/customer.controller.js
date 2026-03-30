const service = require('../services/customer.service');

/**
 * Tạo mới khách hàng từ dữ liệu request body.
 */
exports.create = async (req, res) => {
  try {
    const customer = await service.createCustomer(req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Lấy danh sách tất cả khách hàng.
 */
exports.getAll = async (req, res) => {
  const customers = await service.getAllCustomers();
  res.json(customers);
};

/**
 * Cập nhật thông tin khách hàng theo ID.
 */
exports.update = async (req, res) => {
  try {
    const customer = await service.updateCustomer(req.params.id, req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
