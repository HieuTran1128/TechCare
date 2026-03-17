const service = require('../services/supplier.service');

const sendError = (res, status, message) => {
  res.status(status).json({ message });
};

exports.getAll = async (_req, res) => {
  try {
    const suppliers = await service.listSuppliers();
    res.json(suppliers);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const supplier = await service.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const supplier = await service.updateSupplier(req.params.id, req.body);
    res.json(supplier);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    await service.deleteSupplier(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};
