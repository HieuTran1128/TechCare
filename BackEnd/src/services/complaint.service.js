const Complaint = require('../models/complaint.model');
const RepairTicket = require('../models/repairTicket.model');
const { sendMail } = require('./mail.service');
const { complaintResolutionTemplate } = require('../utils/mailTemplates');

/**
 * Lấy thông tin form khiếu nại từ complaint token của phiếu sửa chữa.
 */
async function getFormByToken(token) {
  const ticket = await RepairTicket.findOne({ complaintToken: token })
    .populate({ path: 'device', populate: { path: 'customer', select: 'fullName email' } })
    .lean();

  if (!ticket) throw new Error('INVALID_TOKEN');
  if (!ticket.complaintTokenExpireAt || new Date(ticket.complaintTokenExpireAt) < new Date()) {
    throw new Error('TOKEN_EXPIRED');
  }

  // Kiểm tra đã khiếu nại chưa
  const existing = await Complaint.findOne({ ticket: ticket._id });
  if (existing) throw new Error('ALREADY_COMPLAINED');

  return {
    ticketCode: ticket.ticketCode,
    customerName: ticket.device?.customer?.fullName || '',
    deviceBrand: ticket.device?.brand || '',
    deviceModel: ticket.device?.model || '',
  };
}

/**
 * Khách hàng gửi khiếu nại thông qua complaint token (public).
 */
async function submitComplaint(token, { category, description }) {
  const ticket = await RepairTicket.findOne({ complaintToken: token })
    .populate({ path: 'device', populate: { path: 'customer' } });

  if (!ticket) throw new Error('INVALID_TOKEN');
  if (!ticket.complaintTokenExpireAt || new Date(ticket.complaintTokenExpireAt) < new Date()) {
    throw new Error('TOKEN_EXPIRED');
  }

  const existing = await Complaint.findOne({ ticket: ticket._id });
  if (existing) throw new Error('ALREADY_COMPLAINED');

  // category là array, ít nhất 1 phần tử
  const categories = Array.isArray(category) ? category : [category].filter(Boolean);
  if (categories.length === 0 || !description?.trim()) throw new Error('MISSING_FIELDS');

  // Dùng ticketCode làm complaintCode luôn
  const complaint = await Complaint.create({
    complaintCode: ticket.ticketCode,
    ticket: ticket._id,
    customer: ticket.device?.customer?._id,
    category: categories,
    description: description.trim(),
    status: 'OPEN',
  });

  return complaint;
}

/**
 * Lấy danh sách khiếu nại có phân trang và lọc theo trạng thái (dành cho manager).
 */
async function listComplaints({ status, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: 'ticket',
        select: 'ticketCode status finalCost completedAt',
        populate: [
          { path: 'technician', select: 'fullName role' },
          { path: 'createdBy', select: 'fullName role' },
          { path: 'device', select: 'brand model deviceType', populate: { path: 'customer', select: 'fullName' } },
        ],
      })
      .populate('customer', 'fullName phone email')
      .populate('assignedTo', 'fullName'),
    Complaint.countDocuments(filter),
  ]);

  return { complaints, total, page: Number(page), limit: Number(limit) };
}

/**
 * Lấy chi tiết một khiếu nại theo ID, bao gồm thông tin phiếu sửa và khách hàng.
 */
async function getComplaintById(id) {
  const complaint = await Complaint.findById(id)
    .populate({
      path: 'ticket',
      select: 'ticketCode status finalCost initialIssue completedAt createdAt quote repairParts statusHistory',
      populate: [
        { path: 'technician', select: 'fullName role avatar' },
        { path: 'createdBy', select: 'fullName role' },
        { path: 'managerAssignedBy', select: 'fullName role' },
        { path: 'device', populate: { path: 'customer', select: 'fullName phone email address' } },
        { path: 'repairParts.part', select: 'partName brand price warrantyMonths' },
        { path: 'statusHistory.changedBy', select: 'fullName role' },
      ],
    })
    .populate('customer', 'fullName phone email address')
    .populate('assignedTo', 'fullName role');
  if (!complaint) throw new Error('NOT_FOUND');
  return complaint;
}

/**
 * Xử lý khiếu nại, lưu kết quả giải quyết và gửi email phản hồi cho khách hàng.
 */
async function resolveComplaint(id, { resolution, compensationType, compensationAmount }, managerId) {
  const complaint = await Complaint.findById(id)
    .populate('ticket', 'ticketCode')
    .populate('customer', 'fullName email');

  if (!complaint) throw new Error('NOT_FOUND');
  if (complaint.status === 'CLOSED') throw new Error('ALREADY_CLOSED');
  if (!resolution?.trim()) throw new Error('RESOLUTION_REQUIRED');

  complaint.resolution = resolution.trim();
  complaint.compensationType = compensationType || 'NONE';
  complaint.compensationAmount = Number(compensationAmount) || 0;
  complaint.status = 'CLOSED';
  complaint.assignedTo = managerId;
  complaint.resolvedAt = new Date();
  complaint.closedAt = new Date();

  await complaint.save();

  // Gửi mail kết quả cho khách
  const customer = complaint.customer;
  if (customer?.email) {
    const html = complaintResolutionTemplate({
      customerName: customer.fullName,
      ticketCode: complaint.ticket?.ticketCode || '',
      complaintCode: complaint.complaintCode,
      category: complaint.category,
      resolution: complaint.resolution,
      compensationType: complaint.compensationType,
      compensationAmount: complaint.compensationAmount,
    });

    await sendMail({
      to: customer.email,
      subject: `TechCare - Phản hồi khiếu nại ${complaint.complaintCode}`,
      html,
    });
  }

  return complaint;
}

/**
 * Thống kê số lượng khiếu nại theo từng trạng thái.
 */
async function getComplaintStats() {
  const [open, inProgress, closed, total] = await Promise.all([
    Complaint.countDocuments({ status: 'OPEN' }),
    Complaint.countDocuments({ status: 'IN_PROGRESS' }),
    Complaint.countDocuments({ status: 'CLOSED' }),
    Complaint.countDocuments(),
  ]);
  return { open, inProgress, closed, total };
}

module.exports = {
  getFormByToken,
  submitComplaint,
  listComplaints,
  getComplaintById,
  resolveComplaint,
  getComplaintStats,
};
