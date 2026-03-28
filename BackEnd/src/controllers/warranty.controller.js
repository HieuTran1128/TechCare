const { getWarranties, claimWarranty, completeWarrantyTicket, startWarrantyRepair } = require('../services/warranty.service');

exports.getAll = async (req, res) => {
  try {
    const { ticketCode, phone, status } = req.query;
    const data = await getWarranties({ ticketCode, phone, status });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.claim = async (req, res) => {
  try {
    const result = await claimWarranty(req.params.id, req.body, req.user.userId);
    res.json(result);
  } catch (err) {
    const statusMap = { NOT_FOUND: 404, WARRANTY_INACTIVE: 400, WARRANTY_EXPIRED: 400, INVALID_CLAIM_TYPE: 400 };
    res.status(statusMap[err.message] || 500).json({ message: err.message });
  }
};

exports.completeWarranty = async (req, res) => {
  try {
    const ticket = await completeWarrantyTicket(req.params.ticketId, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    const statusMap = { NOT_FOUND: 404, NOT_WARRANTY_TICKET: 400, INVALID_STATUS: 400 };
    res.status(statusMap[err.message] || 500).json({ message: err.message });
  }
};

exports.startWarranty = async (req, res) => {
  try {
    const ticket = await startWarrantyRepair(req.params.ticketId, req.user.userId);
    res.json(ticket);
  } catch (err) {
    const statusMap = { NOT_FOUND: 404, NOT_STORE_FAULT_WARRANTY: 400, INVALID_STATUS: 400 };
    res.status(statusMap[err.message] || 500).json({ message: err.message });
  }
};
