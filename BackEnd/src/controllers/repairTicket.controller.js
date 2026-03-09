const service = require('../services/repairTicket.service');
const RepairTicket = require('../models/repairTicket.model');

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
    const ticket = await service.assignTechnician(
      req.params.id,
      req.body.technicianId,
      req.user.userId
    );
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể phân công kỹ thuật viên');
  }
};

exports.diagnose = async (req, res) => {
  try {    console.log('Controller diagnose - req.user:', JSON.stringify(req.user));
    console.log('Controller diagnose - req.user.userId:', req.user.userId);
    console.log('Controller diagnose - req.user.id:', req.user.id);    const ticket = await service.diagnose(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể chẩn đoán và báo giá');
  }
};

exports.approveAtDesk = async (req, res) => {
  try {
    const ticket = await service.approveAtDesk(req.params.id, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể phê duyệt tại quầy');
  }
};

// Public endpoint - dùng service để tránh duplicate
exports.customerApprove = async (req, res) => {
  try {
    await service.customerApprove(req.params.token);
    res.json({ message: 'Đã đồng ý sửa chữa. Cảm ơn quý khách!' });
  } catch (err) {
    sendError(res, 400, err.message || 'Link không hợp lệ hoặc đã hết hạn');
  }
};

exports.customerReject = async (req, res) => {
  try {
    await service.customerReject(req.params.token);
    res.json({ message: 'Đã từ chối sửa chữa. Chúng tôi rất tiếc!' });
  } catch (err) {
    sendError(res, 400, err.message || 'Link không hợp lệ hoặc đã hết hạn');
  }
};

exports.getAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const sort = req.query.sort || '-createdAt';

    const result = await service.getAllTickets(
      {
        limit,
        sort,
        technicianId: req.query.technicianId
      },
      req.user
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách phiếu sửa chữa'
    });
  }
};
