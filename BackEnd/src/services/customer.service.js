const Customer = require('../models/customer.model');

async function createCustomer(data) {
  // Nếu trùng email thì trả về customer cũ
  const existedEmail = await Customer.findOne({ email: data.email });
  if (existedEmail) return existedEmail;

  // Nếu không trùng email, tạo mới
  return Customer.create(data);
}

async function updateCustomer(id, data) {
  if (data.email) {
    const conflict = await Customer.findOne({ email: data.email, _id: { $ne: id } });
    if (conflict) throw new Error('EMAIL_ALREADY_EXISTS');
  }
  return Customer.findByIdAndUpdate(id, data, { new: true });
}

async function getAllCustomers() {
  return Customer.find().sort({ createdAt: -1 });
}

async function getCustomerByPhone(phone) {
  return Customer.findOne({ phone: phone.trim() });
}

async function getCustomerByEmail(email) {
  return Customer.findOne({ email: email.trim().toLowerCase() });
}

module.exports = {
  createCustomer,
  getAllCustomers,
  updateCustomer,
  getCustomerByPhone,
  getCustomerByEmail
};
