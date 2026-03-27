const Complaint = require('../models/complaint.model');
const User = require('../models/user.model');
const { sendMail } = require('./mail.service');
const { complaintNotifyTemplate, complaintResolutionTemplate } = require('../utils/mailTemplates');

async function createComplaint({ ticketCode, customerName, customerEmail, category, content }) {
  if (!ticketCode || !customerName || !customerEmail || !content) {
    throw new Error('MISSING_REQUIRED_FIELDS');
  }

  const complaint = await Complaint.create({ ticketCode, customerName, customerEmail, category, content });

  // Gửi mail thông báo đến tất cả manager và frontdesk
  const staffList = await User.find({
    role: { $in: ['manager', 'frontdesk'] },
    status: 'ACTIVE',
  }).select('email');

  const html = complaintNotifyTemplate({
    customerName,
    ticketCode,
    category,
    content,
    complaintId: complaint._id.toString().slice(-6).toUpperCase(),
  });

  await Promise.all(
    staffList.map((staff) =>
      sendMail({ to: staff.email, subject: `[TechCare] Khiếu nại mới từ khách - Phiếu ${ticketCode}`, html }).catch(() => undefined)
    )
  );

  return complaint;
}

async function getAllComplaints({ status, page = 1, limit = 20 }) {
  const filter = {};
  if (status && status !== 'ALL') filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('resolvedBy', 'fullName role'),
    Complaint.countDocuments(filter),
  ]);

  return { data, total, page: Number(page), limit: Number(limit) };
}

async function resolveComplaint(complaintId, { resolution, resolvedBy }) {
  if (!resolution?.trim()) throw new Error('RESOLUTION_REQUIRED');

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new Error('NOT_FOUND');
  if (complaint.status === 'RESOLVED') throw new Error('ALREADY_RESOLVED');

  complaint.status = 'RESOLVED';
  complaint.resolution = resolution.trim();
  complaint.resolvedBy = resolvedBy;
  complaint.resolvedAt = new Date();
  await complaint.save();

  // Gửi mail kết quả cho khách
  const html = complaintResolutionTemplate({
    customerName: complaint.customerName,
    ticketCode: complaint.ticketCode,
    content: complaint.content,
    resolution: complaint.resolution,
    category: complaint.category,
  });

  await sendMail({
    to: complaint.customerEmail,
    subject: `TechCare - Phản hồi khiếu nại phiếu ${complaint.ticketCode}`,
    html,
  });

  return complaint;
}

async function updateStatus(complaintId, status) {
  const complaint = await Complaint.findByIdAndUpdate(
    complaintId,
    { status },
    { new: true }
  );
  if (!complaint) throw new Error('NOT_FOUND');
  return complaint;
}

module.exports = { createComplaint, getAllComplaints, resolveComplaint, updateStatus };
