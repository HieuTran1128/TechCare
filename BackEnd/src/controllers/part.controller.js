const service = require('../services/part.service');

const sendError = (res, status, message) => {
  res.status(status).json({ message });
};

exports.getAll = async (req, res) => {
  try {
    const parts = await service.listParts({
      lowStock: req.query.lowStock === 'true',
      outOfStock: req.query.outOfStock === 'true',
      search: req.query.search,
    });
    res.json(parts);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const part = await service.createPart(req.body);
    res.status(201).json(part);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const part = await service.updatePart(req.params.id, req.body);
    res.json(part);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    await service.deletePart(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.importStock = async (req, res) => {
  try {
    const part = await service.importStock(req.params.id, req.body, req.user.userId);
    res.json(part);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.importOrder = async (req, res) => {
  try {
    const result = await service.importStockOrder(req.body, req.user.userId);
    res.json(result);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.getImportHistory = async (_req, res) => {
  try {
    const history = await service.listImportHistory();
    res.json(history);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getUsageHistory = async (_req, res) => {
  try {
    const history = await service.listUsageHistory();
    res.json(history);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.createAlert = async (req, res) => {
  try {
    const alert = await service.createStockAlert(req.params.id, req.body.message, req.user.userId);
    res.status(201).json(alert);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

exports.getAlerts = async (_req, res) => {
  try {
    const alerts = await service.listStockAlerts();
    res.json(alerts);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getStats = async (_req, res) => {
  try {
    const stats = await service.getInventoryStats();
    res.json(stats);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

exports.getInventoryKpi = async (req, res) => {
  try {
    const data = await service.getInventoryKpi({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      groupBy: req.query.groupBy || 'month',
    });
    res.json(data);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};
