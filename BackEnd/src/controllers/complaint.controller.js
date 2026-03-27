const service = require('../services/complaint.service');

const err = (res, status, msg) => res.status(status).json({ message: msg });

exports.create = async (req, res) => {
  try {
    const complaint = await service.createComplaint(req.body);
    res.status(201).json({ message: 'Khiếu nại đã được gửi thành công.', complaint });
  } catch (e) {
    err(res, 400, e.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    const result = await service.getAllComplaints({
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (e) {
    err(res, 500, e.message);
  }
};

exports.resolve = async (req, res) => {
  try {
    const complaint = await service.resolveComplaint(req.params.id, {
      resolution: req.body.resolution,
      resolvedBy: req.user.userId,
    });
    res.json({ message: 'Đã xử lý và gửi mail phản hồi cho khách.', complaint });
  } catch (e) {
    err(res, 400, e.message);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const complaint = await service.updateStatus(req.params.id, req.body.status);
    res.json(complaint);
  } catch (e) {
    err(res, 400, e.message);
  }
};
