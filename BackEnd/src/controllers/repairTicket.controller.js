const service = require('../services/repairTicket.service');

const sendError = (res, status, message, code = 'error') => {
  res.status(status).json({ error: code, message });
};

exports.create = async (req, res) => {
  try {
    const ticket = await service.createTicket(req.body, req.user.userId);
    res.status(201).json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể tạo phiếu sửa chữa');
  }
};

exports.assign = async (req, res) => {
  try {
    const ticket = await service.assignTechnician(req.params.id, req.body.technicianId, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể phân công kỹ thuật viên');
  }
};

exports.requestInventory = async (req, res) => {
  try {
    const ticket = await service.requestInventory(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể gửi yêu cầu kho');
  }
};

exports.respondInventory = async (req, res) => {
  try {
    const ticket = await service.respondInventory(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể phản hồi kho');
  }
};

exports.sendQuotation = async (req, res) => {
  try {
    const ticket = await service.sendQuotation(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể gửi báo giá');
  }
};

exports.customerApprove = async (req, res) => {
  try {
    await service.customerApprove(req.params.token);
    res.json({ message: 'Khách hàng đã đồng ý sửa chữa.' });
  } catch (err) {
    sendError(res, 400, err.message || 'Link không hợp lệ hoặc đã hết hạn');
  }
};

exports.customerReject = async (req, res) => {
  try {
    await service.customerReject(req.params.token);
    res.json({ message: 'Khách hàng đã từ chối báo giá.' });
  } catch (err) {
    sendError(res, 400, err.message || 'Link không hợp lệ hoặc đã hết hạn');
  }
};

exports.startRepair = async (req, res) => {
  try {
    const ticket = await service.startRepair(req.params.id, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể bắt đầu sửa chữa');
  }
};

exports.complete = async (req, res) => {
  try {
    const ticket = await service.completeTicket(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể hoàn thành phiếu');
  }
};

exports.getAll = async (req, res) => {
  try {
    const result = await service.getAllTickets(
      {
        limit: req.query.limit || 100,
        sort: req.query.sort || '-createdAt',
        technicianId: req.query.technicianId,
        status: req.query.status,
      },
      req.user,
    );

    res.json(result);
  } catch (err) {
    sendError(res, 500, err.message || 'Không thể lấy danh sách phiếu sửa chữa');
  }
};

exports.getManagerSummary = async (req, res) => {
  try {
    const summary = await service.getManagerSummary();
    res.json(summary);
  } catch (err) {
    sendError(res, 500, err.message || 'Không thể lấy thống kê');
  }
};
