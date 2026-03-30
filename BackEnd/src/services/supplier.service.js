const Supplier = require('../models/supplier.model');

/**
 * Lấy danh sách tất cả nhà cung cấp, sắp xếp theo ngày tạo mới nhất.
 */
async function listSuppliers() {
  return Supplier.find().sort({ createdAt: -1 });
}

/**
 * Tạo mới nhà cung cấp với thông tin được cung cấp.
 */
async function createSupplier(data) {
  if (!data.name) throw new Error('SUPPLIER_NAME_REQUIRED');
  return Supplier.create({
    name: data.name,
    phone: data.phone,
    address: data.address,
    email: data.email,
    note: data.note,
  });
}

/**
 * Cập nhật thông tin nhà cung cấp theo ID.
 */
async function updateSupplier(id, data) {
  const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true });
  if (!supplier) throw new Error('SUPPLIER_NOT_FOUND');
  return supplier;
}

/**
 * Xóa nhà cung cấp theo ID.
 */
async function deleteSupplier(id) {
  const supplier = await Supplier.findByIdAndDelete(id);
  if (!supplier) throw new Error('SUPPLIER_NOT_FOUND');
  return supplier;
}

module.exports = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
