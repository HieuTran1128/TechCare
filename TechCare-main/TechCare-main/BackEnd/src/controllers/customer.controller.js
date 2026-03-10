const service = require('../services/customer.service');

exports.create = async (req, res) => {
  try {
    const customer = await service.createCustomer(req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  const customers = await service.getAllCustomers();
  res.json(customers);
};

exports.update = async (req, res) => {
  try {
    const customer = await service.updateCustomer(req.params.id, req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
