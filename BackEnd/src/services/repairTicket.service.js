const RepairTicket = require("../models/repairTicket.model");
const { sendMail } = require("./mail.service");
const { approvalTemplate } = require("../utils/mailTemplates");
const crypto = require("crypto");

function generateTicketCode() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TC-${year}-${random}`;
}

async function createTicket(data, userId) {
  const ticket = await RepairTicket.create({
    ticketCode: generateTicketCode(),
    device: data.deviceId,
    createdBy: userId,
    initialIssue: data.initialIssue,
    status: "RECEIVED",
    statusHistory: [{ status: "RECEIVED", changedBy: userId }],
  });

  return ticket;
}

async function assignTechnician(ticketId, technicianId, userId) {
  const ticket = await RepairTicket.findById(ticketId);
  if (!ticket) throw new Error("NOT_FOUND");

  ticket.technician = technicianId;
  ticket.status = "ASSIGNED";

  ticket.statusHistory.push({
    status: "ASSIGNED",
    changedBy: userId,
  });

  await ticket.save();
  return ticket;
}

async function diagnose(ticketId, data, userId) {
  console.log('Service diagnose - parameters:');
  console.log('  ticketId:', ticketId);
  console.log('  data:', JSON.stringify(data));
  console.log('  userId:', userId);

  const ticket = await RepairTicket.findById(ticketId).populate({
    path: "device",
    populate: { path: "customer" },
  });

  if (!ticket) throw new Error("NOT_FOUND");

  console.log('Diagnose check - ticket.technician:', ticket.technician);
  console.log('Diagnose check - userId:', userId);
  console.log('Diagnose check - ticket.technician.toString():', ticket.technician?.toString());
  console.log('Diagnose check - comparison:', ticket.technician?.toString() !== userId);

  // Kiểm tra xem user có phải là technician được assign không
  if (!ticket.technician || ticket.technician.toString() !== userId) {
    throw new Error("UNAUTHORIZED: Chỉ kỹ thuật viên được phân công mới có thể chẩn đoán");
  }

  ticket.diagnosisResult = data.diagnosisResult;
  ticket.estimatedCost = data.estimatedCost;
  ticket.status = "WAITING_APPROVAL";

  ticket.approvalToken = crypto.randomUUID();
  ticket.approvalExpireAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  ticket.statusHistory.push({
    status: "WAITING_APPROVAL",
    changedBy: userId,
  });

  await ticket.save();

  const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  if (!process.env.BASE_URL) {
    console.warn('BASE_URL not set in environment, using', base);
  }
  const approveUrl = `${base}/api/ticket/customer-approve/${ticket.approvalToken}`;
  const rejectUrl = `${base}/api/ticket/customer-reject/${ticket.approvalToken}`;

  const customer = ticket.device.customer;

  if (!customer?.email) {
    console.warn(`Ticket ${ticket._id} has no customer email, skipping notification`);
  } else {
    const html = approvalTemplate(
      ticket.device.customer.fullName,
      ticket.ticketCode,
      ticket.diagnosisResult,
      ticket.estimatedCost,
      approveUrl,
      rejectUrl,
    );

    await sendMail({
      to: customer.email,
      subject: `Báo giá sửa chữa ${ticket.ticketCode}`,
      html,
    });
  }

  return ticket;
}

async function approveAtDesk(ticketId, userId) {
  const ticket = await RepairTicket.findById(ticketId);
  if (!ticket) throw new Error("NOT_FOUND");

  ticket.status = "IN_PROGRESS";
  ticket.approvalToken = null;
  ticket.approvalExpireAt = null;

  ticket.statusHistory.push({
    status: "IN_PROGRESS",
    changedBy: userId,
  });

  await ticket.save();
  return ticket;
}

async function customerApprove(token) {
  const ticket = await RepairTicket.findOne({
    approvalToken: token,
    approvalExpireAt: { $gt: new Date() },
  });

  if (!ticket) throw new Error("INVALID_OR_EXPIRED");

  ticket.status = "IN_PROGRESS";
  ticket.approvalToken = null;
  ticket.approvalExpireAt = null;

  // Push history để audit (khách approve)
  ticket.statusHistory.push({
    status: "IN_PROGRESS",
    changedBy: null, // hoặc 'customer' nếu bạn có user khách
    changedAt: new Date(),
    note: "Khách hàng phê duyệt qua email",
  });

  await ticket.save();
  return ticket; // trả về để controller dùng nếu cần
}

async function customerReject(token) {
  const ticket = await RepairTicket.findOne({
    approvalToken: token,
    approvalExpireAt: { $gt: new Date() }, // thêm check expire như approve
  });

  if (!ticket) throw new Error("INVALID_OR_EXPIRED");

  ticket.status = "REJECTED";
  ticket.approvalToken = null;
  ticket.approvalExpireAt = null;

  ticket.statusHistory.push({
    status: "REJECTED",
    changedBy: null,
    changedAt: new Date(),
    note: "Khách hàng từ chối qua email",
  });

  await ticket.save();
  return ticket;
}

async function getAllTickets({ limit = 6, sort = "-createdAt" } = {}) {
  try {
    const tickets = await RepairTicket.find()
      .sort(sort)
      .limit(limit)
      .populate({
        path: "device",
        select: "brand model deviceType",
        populate: {
          path: "customer",
          select: "fullName phone",
        },
      })
      .lean(); // trả plain object để nhanh hơn

    const total = await RepairTicket.countDocuments();

    return {
      success: true,
      data: tickets,
      total,
      limit,
    };
  } catch (err) {
    console.error("Lỗi get all tickets in service:", err);
    throw new Error("Không thể lấy danh sách phiếu sửa chữa");
  }
}

module.exports = {
  createTicket,
  assignTechnician,
  diagnose,
  approveAtDesk,
  customerApprove,
  customerReject,
  getAllTickets,
};
