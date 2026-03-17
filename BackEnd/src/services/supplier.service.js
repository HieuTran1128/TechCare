const Supplier = require('../models/supplier.model');

async function listSuppliers() {
  return Supplier.find().sort({ createdAt: -1 });
}

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

async function updateSupplier(id, data) {
  const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true });
  if (!supplier) throw new Error('SUPPLIER_NOT_FOUND');
  return supplier;
}

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
