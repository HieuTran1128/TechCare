const service = require('../services/complaint.service');

const sendError = (res, status, message) => res.status(status).json({ message });

// Public: lấy thông tin form từ token
exports.getForm = async (req, res) => {
  try {
    const data = await service.getFormByToken(req.params.token);
    res.json(data);
  } catch (err) {
    const status = err.message === 'INVALID_TOKEN' || err.message === 'TOKEN_EXPIRED' ? 410 : 400;
    sendError(res, status, err.message);
  }
};

// Public: khách submit khiếu nại
exports.submit = async (req, res) => {
  try {
    const complaint = await service.submitComplaint(req.params.token, req.body);
    res.status(201).json({ message: 'Khiếu nại đã được gửi thành công.', complaintCode: complaint.complaintCode });
  } catch (err) {
    const status = err.message === 'INVALID_TOKEN' || err.message === 'TOKEN_EXPIRED' ? 410
      : err.message === 'ALREADY_COMPLAINED' ? 409 : 400;
    sendError(res, status, err.message);
  }
};

// Manager: danh sách
exports.list = async (req, res) => {
  try {
    const result = await service.listComplaints(req.query);
    res.json(result);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// Manager: chi tiết
exports.detail = async (req, res) => {
  try {
    const complaint = await service.getComplaintById(req.params.id);
    res.json(complaint);
  } catch (err) {
    sendError(res, err.message === 'NOT_FOUND' ? 404 : 500, err.message);
  }
};

// Manager: xử lý + gửi mail
exports.resolve = async (req, res) => {
  try {
    const complaint = await service.resolveComplaint(req.params.id, req.body, req.user.userId);
    res.json(complaint);
  } catch (err) {
    const status = err.message === 'NOT_FOUND' ? 404 : err.message === 'ALREADY_CLOSED' ? 409 : 400;
    sendError(res, status, err.message);
  }
};

// Manager: thống kê
exports.stats = async (_req, res) => {
  try {
    const stats = await service.getComplaintStats();
    res.json(stats);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
