const Customer = require('../models/customer.model');

/**
 * Tạo mới khách hàng, kiểm tra trùng số điện thoại và email.
 */
async function createCustomer(data) {
  // createCustomer is used by receptionist and elsewhere - email should now always be provided
  const existedPhone = await Customer.findOne({ phone: data.phone });
  if (existedPhone) throw new Error('CUSTOMER_ALREADY_EXISTS');

  const existedEmail = await Customer.findOne({ email: data.email });
  if (existedEmail) throw new Error('EMAIL_ALREADY_EXISTS');

  return Customer.create(data);
}

/**
 * Cập nhật thông tin khách hàng theo ID, kiểm tra trùng email.
 */
async function updateCustomer(id, data) {
  if (data.email) {
    const conflict = await Customer.findOne({ email: data.email, _id: { $ne: id } });
    if (conflict) throw new Error('EMAIL_ALREADY_EXISTS');
  }
  return Customer.findByIdAndUpdate(id, data, { new: true });
}

/**
 * Lấy danh sách tất cả khách hàng, sắp xếp theo ngày tạo mới nhất.
 */
async function getAllCustomers() {
  return Customer.find().sort({ createdAt: -1 });
}

module.exports = {
  createCustomer,
  getAllCustomers,
  updateCustomer
};
