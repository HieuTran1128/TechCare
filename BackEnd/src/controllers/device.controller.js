const service = require('../services/device.service');

/**
 * Tạo mới thiết bị và liên kết với khách hàng.
 */
exports.create = async (req, res) => {
  try {
    const device = await service.createDevice(req.body);
    res.json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Lấy danh sách thiết bị của một khách hàng theo customerId.
 */
exports.getByCustomer = async (req, res) => {
  const devices = await service.getDevicesByCustomer(req.params.customerId);
  res.json(devices);
};
