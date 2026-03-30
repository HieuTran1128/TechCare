const Device = require('../models/device.model');
const Customer = require('../models/customer.model');

/**
 * Tạo mới thiết bị và liên kết với khách hàng theo customerId.
 */
async function createDevice(data) {
  const customer = await Customer.findById(data.customerId);
  if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

  return Device.create({
    customer: data.customerId,
    deviceType: data.deviceType,
    brand: data.brand,
    model: data.model,
    serialNumber: data.serialNumber
  });
}

/**
 * Lấy danh sách thiết bị của một khách hàng theo customerId.
 */
async function getDevicesByCustomer(customerId) {
  return Device.find({ customer: customerId }).populate('customer');
}

module.exports = {
  createDevice,
  getDevicesByCustomer
};
