const crypto = require('crypto');
const RepairTicket = require('../models/repairTicket.model');
const User = require('../models/user.model');
const Part = require('../models/part.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const { sendMail } = require('./mail.service');
const { approvalTemplate, completionTemplate } = require('../utils/mailTemplates');
const ROLES = require('../constants/roles.constant');

function generateTicketCode() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TC-${year}-${random}`;
}

function appendHistory(ticket, status, changedBy, note) {
  ticket.statusHistory.push({
    status,
    changedBy: changedBy || null,
    changedAt: new Date(),
    note,
  });
}

async function createTicket(data, userId) {
  const ticket = await RepairTicket.create({
    ticketCode: generateTicketCode(),
    device: data.deviceId,
    createdBy: userId,
    initialIssue: data.initialIssue,
    status: 'RECEIVED',
    inventoryRequest: {
      status: 'NOT_REQUIRED',
      requiredParts: [],
    },
    statusHistory: [{ status: 'RECEIVED', changedBy: userId }],
  });

  return ticket;
}

async function assignTechnician(ticketId, technicianId, managerId) {
  const [ticket, technician] = await Promise.all([
    RepairTicket.findById(ticketId),
    User.findById(technicianId),
  ]);

  if (!ticket) throw new Error('NOT_FOUND');
  if (!technician || technician.role !== ROLES.TECHNICIAN) {
    throw new Error('INVALID_TECHNICIAN');
  }

  ticket.technician = technicianId;
  ticket.managerAssignedBy = managerId;
  ticket.status = 'MANAGER_ASSIGNED';
  appendHistory(ticket, 'MANAGER_ASSIGNED', managerId, 'Manager đã phân công kỹ thuật viên');

  await ticket.save();
  return ticket;
}

async function requestInventory(ticketId, data, technicianId) {
  const ticket = await RepairTicket.findById(ticketId);
  if (!ticket) throw new Error('NOT_FOUND');
  if (!ticket.technician || ticket.technician.toString() !== technicianId) {
    throw new Error('UNAUTHORIZED');
  }

  const requiredParts = Array.isArray(data.requiredParts) ? data.requiredParts : [];

  if (!data.needsReplacement) {
    ticket.inventoryRequest = {
      requestedBy: technicianId,
      status: 'NOT_REQUIRED',
      requiredParts: [],
      noteFromTechnician: data.noteFromTechnician || 'Không cần linh kiện thay thế',
    };
    return ticket.save();
  }

  const storekeeper = await User.findOne({ role: ROLES.STOREKEEPER, status: 'ACTIVE' }).sort({ createdAt: 1 });

  ticket.inventoryRequest = {
    requestedBy: technicianId,
    assignedTo: storekeeper?._id,
    status: 'PENDING',
    requiredParts,
    noteFromTechnician: data.noteFromTechnician,
  };
  ticket.status = 'WAITING_INVENTORY';
  appendHistory(ticket, 'WAITING_INVENTORY', technicianId, 'Yêu cầu kho kiểm tra linh kiện');

  await ticket.save();
  return ticket;
}

async function respondInventory(ticketId, data, storekeeperId) {
  const ticket = await RepairTicket.findById(ticketId);
  if (!ticket) throw new Error('NOT_FOUND');

  if (!ticket.inventoryRequest || ticket.inventoryRequest.status !== 'PENDING') {
    throw new Error('NO_PENDING_INVENTORY_REQUEST');
  }

  const status = data.available ? 'AVAILABLE' : 'UNAVAILABLE';

  ticket.inventoryRequest.status = status;
  ticket.inventoryRequest.noteFromStorekeeper = data.noteFromStorekeeper || '';
  ticket.inventoryRequest.respondedAt = new Date();
  ticket.status = 'MANAGER_ASSIGNED';

  appendHistory(ticket, 'MANAGER_ASSIGNED', storekeeperId, `Kho phản hồi: ${status}`);

  await ticket.save();
  return ticket;
}

async function sendQuotation(ticketId, data, technicianId) {
  const ticket = await RepairTicket.findById(ticketId).populate({
    path: 'device',
    populate: { path: 'customer' },
  });

  if (!ticket) throw new Error('NOT_FOUND');
  if (!ticket.technician || ticket.technician.toString() !== technicianId) {
    throw new Error('UNAUTHORIZED');
  }

  if (ticket.inventoryRequest?.status === 'PENDING') {
    throw new Error('WAITING_INVENTORY_RESPONSE');
  }

  ticket.quote = {
    diagnosisResult: data.diagnosisResult,
    estimatedCost: data.estimatedCost,
    workDescription: data.workDescription,
    estimatedCompletionDate: data.estimatedCompletionDate,
    sentAt: new Date(),
  };

  ticket.approvalToken = crypto.randomUUID();
  ticket.approvalExpireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  ticket.status = 'WAITING_CUSTOMER_APPROVAL';

  appendHistory(ticket, 'WAITING_CUSTOMER_APPROVAL', technicianId, 'Kỹ thuật viên gửi báo giá cho khách hàng');

  await ticket.save();

  const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const approveUrl = `${base}/api/ticket/customer-approve/${ticket.approvalToken}`;
  const rejectUrl = `${base}/api/ticket/customer-reject/${ticket.approvalToken}`;

  const customer = ticket.device?.customer;
  if (customer?.email) {
    const html = approvalTemplate({
      customerName: customer.fullName,
      ticketCode: ticket.ticketCode,
      diagnosisResult: data.diagnosisResult,
      estimatedCost: data.estimatedCost,
      workDescription: data.workDescription,
      estimatedCompletionDate: data.estimatedCompletionDate,
      approveUrl,
      rejectUrl,
    });

    await sendMail({
      to: customer.email,
      subject: `TechCare - Báo giá sửa chữa ${ticket.ticketCode}`,
      html,
    });
  }

  return ticket;
}

async function customerApprove(token) {
  const cleanToken = decodeURIComponent(String(token || '')).trim().replace(/[.\s]+$/g, '');
  const ticket = await RepairTicket.findOne({ approvalToken: cleanToken });

  if (!ticket) throw new Error('INVALID_OR_EXPIRED');
  if (!ticket.approvalExpireAt || ticket.approvalExpireAt <= new Date()) {
    throw new Error('INVALID_OR_EXPIRED');
  }

  if (ticket.status === 'APPROVED') return ticket;
  if (ticket.status === 'REJECTED') throw new Error('ALREADY_REJECTED');

  ticket.status = 'APPROVED';
  ticket.quote = ticket.quote || {};
  ticket.quote.customerDecisionAt = new Date();
  ticket.approvalToken = null;
  ticket.approvalExpireAt = null;

  appendHistory(ticket, 'APPROVED', null, 'Khách hàng đồng ý qua email');
  await ticket.save();
  return ticket;
}

async function customerReject(token) {
  const cleanToken = decodeURIComponent(String(token || '')).trim().replace(/[.\s]+$/g, '');
  const ticket = await RepairTicket.findOne({ approvalToken: cleanToken });

  if (!ticket) throw new Error('INVALID_OR_EXPIRED');
  if (!ticket.approvalExpireAt || ticket.approvalExpireAt <= new Date()) {
    throw new Error('INVALID_OR_EXPIRED');
  }

  if (ticket.status === 'REJECTED') return ticket;
  if (ticket.status === 'APPROVED') throw new Error('ALREADY_APPROVED');

  ticket.status = 'REJECTED';
  ticket.quote = ticket.quote || {};
  ticket.quote.customerDecisionAt = new Date();
  ticket.approvalToken = null;
  ticket.approvalExpireAt = null;

  appendHistory(ticket, 'REJECTED', null, 'Khách hàng từ chối qua email');
  await ticket.save();
  return ticket;
}

async function startRepair(ticketId, technicianId) {
  const ticket = await RepairTicket.findById(ticketId);
  if (!ticket) throw new Error('NOT_FOUND');
  if (!ticket.technician || ticket.technician.toString() !== technicianId) {
    throw new Error('UNAUTHORIZED');
  }
  if (ticket.status !== 'APPROVED') throw new Error('NOT_APPROVED_YET');

  ticket.status = 'IN_PROGRESS';
  appendHistory(ticket, 'IN_PROGRESS', technicianId, 'Bắt đầu sửa chữa');
  await ticket.save();
  return ticket;
}

async function completeTicket(ticketId, data, technicianId) {
  const ticket = await RepairTicket.findById(ticketId).populate({
    path: 'device',
    populate: { path: 'customer' },
  });

  if (!ticket) throw new Error('NOT_FOUND');
  if (!ticket.technician || ticket.technician.toString() !== technicianId) {
    throw new Error('UNAUTHORIZED');
  }

  if (ticket.status !== 'IN_PROGRESS' && ticket.status !== 'APPROVED') {
    throw new Error('INVALID_STATUS_TO_COMPLETE');
  }

  const usedParts = Array.isArray(data.usedParts) ? data.usedParts : [];

  for (const partItem of usedParts) {
    if (!partItem.part || !partItem.quantity) continue;

    const part = await Part.findById(partItem.part);
    if (!part) throw new Error('PART_NOT_FOUND');
    if (part.stock < partItem.quantity) throw new Error('PART_OUT_OF_STOCK');

    part.stock -= partItem.quantity;
    await part.save();

    await InventoryTransaction.create({
      part: part._id,
      ticket: ticket._id,
      quantity: partItem.quantity,
      type: 'OUT',
      createdBy: technicianId,
    });
  }

  ticket.repairParts = usedParts;
  ticket.finalCost = data.finalCost || ticket.quote?.estimatedCost || 0;
  ticket.status = 'COMPLETED';
  ticket.completedAt = new Date();

  appendHistory(ticket, 'COMPLETED', technicianId, 'Đã hoàn tất sửa chữa');
  await ticket.save();

  const customer = ticket.device?.customer;
  if (customer?.email) {
    const html = completionTemplate({
      customerName: customer.fullName,
      ticketCode: ticket.ticketCode,
      pickupNote: data.pickupNote,
    });

    await sendMail({
      to: customer.email,
      subject: `TechCare - Thiết bị ${ticket.ticketCode} đã hoàn thành`,
      html,
    });
  }

  return ticket;
}

async function getAllTickets(query = {}, user = null) {
  const { limit = 100, sort = '-createdAt', technicianId, status } = query;

  const filter = {};

  if (status) filter.status = status;
  if (technicianId) filter.technician = technicianId;

  if (user?.role === ROLES.TECHNICIAN) {
    filter.technician = user.userId;
  }

  if (user?.role === ROLES.STOREKEEPER) {
    filter['inventoryRequest.status'] = 'PENDING';
  }

  const tickets = await RepairTicket.find(filter)
    .sort(sort)
    .limit(Number(limit))
    .populate({
      path: 'device',
      select: 'brand model deviceType',
      populate: { path: 'customer', select: 'fullName phone email' },
    })
    .populate('technician', 'fullName role')
    .populate('createdBy', 'fullName role')
    .populate('managerAssignedBy', 'fullName role')
    .lean();

  const total = await RepairTicket.countDocuments(filter);

  return {
    success: true,
    data: tickets,
    total,
    limit: Number(limit),
  };
}

async function getManagerSummary() {
  const [all, completed, rejected] = await Promise.all([
    RepairTicket.countDocuments(),
    RepairTicket.countDocuments({ status: 'COMPLETED' }),
    RepairTicket.countDocuments({ status: 'REJECTED' }),
  ]);

  const revenueAgg = await RepairTicket.aggregate([
    { $match: { status: 'COMPLETED' } },
    { $group: { _id: null, totalRevenue: { $sum: '$finalCost' } } },
  ]);

  return {
    totalTickets: all,
    completedTickets: completed,
    rejectedTickets: rejected,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
  };
}

module.exports = {
  createTicket,
  assignTechnician,
  requestInventory,
  respondInventory,
  sendQuotation,
  customerApprove,
  customerReject,
  startRepair,
  completeTicket,
  getAllTickets,
  getManagerSummary,
};
