const service = require('../services/device.service');

exports.create = async (req, res) => {
  try {
    const device = await service.createDevice(req.body);
    res.json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getByCustomer = async (req, res) => {
  const devices = await service.getDevicesByCustomer(req.params.customerId);
  res.json(devices);
};
