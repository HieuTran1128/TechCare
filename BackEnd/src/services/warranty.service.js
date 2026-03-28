const Warranty = require('../models/warranty.model');
const RepairTicket = require('../models/repairTicket.model');
const Part = require('../models/part.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const StockAlert = require('../models/stockAlert.model');
const { sendMail } = require('./mail.service');
const { warrantyCompletionTemplate } = require('../utils/mailTemplates');

// Tạo warranty records sau khi thanh toán xong
async function createWarrantiesForTicket(ticketId) {
  const ticket = await RepairTicket.findById(ticketId)
    .populate('repairParts.part')
    .populate({ path: 'device', populate: { path: 'customer' } });

  if (!ticket) throw new Error('NOT_FOUND');

  const parts = ticket.repairParts || [];
  const customerId = ticket.device?.customer?._id;
  const startDate = ticket.payment?.paidAt || new Date();

  const warranties = [];
  for (const item of parts) {
    const months = item.warrantyMonths || 0;
    if (!item.part || months === 0) continue;

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const warranty = await Warranty.create({
      ticket: ticket._id,
      part: item.part._id || item.part,
      customer: customerId,
      warrantyMonths: months,
      startDate,
      endDate,
      isActive: true,
    });
    warranties.push(warranty);
  }

  return warranties;
}

// Lấy danh sách bảo hành
async function getWarranties({ ticketCode, phone, status } = {}) {
  const filter = {};
  if (status === 'active') filter.isActive = true;
  if (status === 'expired') filter.isActive = false;

  let warranties = await Warranty.find(filter)
    .populate({
      path: 'ticket',
      select: 'ticketCode status device isWarrantyClaim warrantyClaimType',
      populate: {
        path: 'device',
        select: 'brand model deviceType',
        populate: { path: 'customer', select: 'fullName phone email' },
      },
    })
    .populate('part', 'partName brand')
    .populate('claimedBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean();

  if (ticketCode) {
    const q = ticketCode.trim().toLowerCase();
    warranties = warranties.filter((w) =>
      String(w.ticket?.ticketCode || '').toLowerCase().includes(q)
    );
  }
  if (phone) {
    const q = phone.trim();
    warranties = warranties.filter((w) =>
      String(w.ticket?.device?.customer?.phone || '').includes(q)
    );
  }

  return warranties;
}

/**
 * Xử lý yêu cầu bảo hành — dùng lại ticket gốc, reset về RECEIVED
 * STORE_FAULT → miễn phí, bỏ qua báo giá
 * CUSTOMER_FAULT → tính phí, đi luồng báo giá bình thường
 */
async function claimWarranty(warrantyId, { claimType, claimNote }, userId) {
  const warranty = await Warranty.findById(warrantyId)
    .populate({
      path: 'ticket',
      populate: { path: 'device', populate: { path: 'customer' } },
    })
    .populate('part', 'partName brand');

  if (!warranty) throw new Error('NOT_FOUND');
  if (!warranty.isActive) throw new Error('WARRANTY_INACTIVE');
  if (warranty.endDate && warranty.endDate < new Date()) throw new Error('WARRANTY_EXPIRED');
  if (!['STORE_FAULT', 'CUSTOMER_FAULT'].includes(claimType)) throw new Error('INVALID_CLAIM_TYPE');

  // CUSTOMER_FAULT → từ chối bảo hành luôn, không động vào ticket
  if (claimType === 'CUSTOMER_FAULT') {
    warranty.isActive = false;
    warranty.claimType = 'CUSTOMER_FAULT';
    warranty.claimNote = claimNote || '';
    warranty.claimedAt = new Date();
    warranty.claimedBy = userId;
    await warranty.save();
    return { warranty, ticket: null };
  }

  // STORE_FAULT → reset ticket gốc về RECEIVED để đi lại luồng miễn phí
  const ticket = await RepairTicket.findById(warranty.ticket._id || warranty.ticket);
  if (!ticket) throw new Error('TICKET_NOT_FOUND');

  const issueNote = `[BẢO HÀNH - MIỄN PHÍ] ${claimNote || 'Lỗi linh kiện: ' + (warranty.part?.partName || '')}`;

  await RepairTicket.findByIdAndUpdate(ticket._id, {
    $set: {
      status: 'RECEIVED',
      isWarrantyClaim: true,
      warrantyClaimType: 'STORE_FAULT',
      initialIssue: issueNote,
      inventoryRequest: { status: 'NOT_REQUIRED', requiredParts: [] },
      repairParts: [],
    },
    $unset: {
      technician: '',
      managerAssignedBy: '',
      quote: '',
      approvalToken: '',
      approvalExpireAt: '',
      completedAt: '',
    },
    $push: {
      statusHistory: {
        status: 'RECEIVED',
        changedBy: userId,
        changedAt: new Date(),
        note: 'Bảo hành: lỗi cửa hàng (miễn phí)',
      },
    },
  });

  warranty.isActive = false;
  warranty.claimType = 'STORE_FAULT';
  warranty.claimNote = claimNote || '';
  warranty.claimedAt = new Date();
  warranty.claimedBy = userId;
  await warranty.save();

  const updatedTicket = await RepairTicket.findById(ticket._id).lean();
  return { warranty, ticket: updatedTicket };
}

/**
 * Bắt đầu sửa bảo hành STORE_FAULT (sau khi kho duyệt) → bỏ qua báo giá
 */
async function startWarrantyRepair(ticketId, userId) {
  const ticket = await RepairTicket.findById(ticketId);
  if (!ticket) throw new Error('NOT_FOUND');
  if (!ticket.isWarrantyClaim || ticket.warrantyClaimType !== 'STORE_FAULT') throw new Error('NOT_STORE_FAULT_WARRANTY');
  if (ticket.status !== 'INVENTORY_APPROVED') throw new Error('INVALID_STATUS');

  ticket.status = 'IN_PROGRESS';
  ticket.statusHistory.push({ status: 'IN_PROGRESS', changedBy: userId, note: 'Bắt đầu sửa bảo hành miễn phí' });
  await ticket.save();
  return ticket;
}

/**
 * Hoàn thành bảo hành STORE_FAULT → gửi mail khách đến lấy
 */
async function completeWarrantyTicket(ticketId, { pickupNote }, userId) {
  const ticket = await RepairTicket.findById(ticketId)
    .populate({ path: 'device', populate: { path: 'customer' } });

  if (!ticket) throw new Error('NOT_FOUND');
  if (!ticket.isWarrantyClaim || ticket.warrantyClaimType !== 'STORE_FAULT') throw new Error('NOT_WARRANTY_TICKET');
  if (ticket.status !== 'IN_PROGRESS') throw new Error('INVALID_STATUS');
  ticket.status = 'WARRANTY_DONE';
  ticket.completedAt = new Date();
  ticket.statusHistory.push({ status: 'WARRANTY_DONE', changedBy: userId, note: 'Hoàn thành bảo hành miễn phí' });
  await ticket.save();

  // Xuất kho linh kiện bảo hành — type WARRANTY_OUT, unitPrice = 0 (không tính doanh thu)
  const usedParts = ticket.inventoryRequest?.requiredParts || [];
  for (const item of usedParts) {
    if (!item.part || !item.quantity) continue;
    const partId = item.part._id || item.part;
    const part = await Part.findById(partId);
    if (!part) continue;

    part.stock = Math.max(0, part.stock - item.quantity);
    await part.save();

    await InventoryTransaction.create({
      part: part._id,
      ticket: ticket._id,
      quantity: item.quantity,
      unitPrice: 0, // miễn phí — không tính vào doanh thu
      type: 'WARRANTY_OUT',
      createdBy: userId,
    });

    if (part.stock <= part.minStock) {
      await StockAlert.create({
        part: part._id,
        createdBy: userId,
        message: `Tồn kho thấp sau bảo hành: ${part.stock}/${part.minStock}`,
      });
    }
  }

  // Lấy tên linh kiện từ warranty record
  const warrantyRecord = await Warranty.findOne({ ticket: ticket._id })
    .populate('part', 'partName brand');

  const customer = ticket.device?.customer;
  if (customer?.email) {
    const html = warrantyCompletionTemplate({
      customerName: customer.fullName,
      ticketCode: ticket.ticketCode,
      warrantyTicketCode: ticket.ticketCode,
      partName: warrantyRecord?.part
        ? `${warrantyRecord.part.partName}${warrantyRecord.part.brand ? ` (${warrantyRecord.part.brand})` : ''}`
        : 'Linh kiện',
      note: pickupNote || '',
    });

    await sendMail({
      to: customer.email,
      subject: `TechCare - Bảo hành hoàn tất ${ticket.ticketCode}`,
      html,
    });
  }

  return ticket;
}

module.exports = {
  createWarrantiesForTicket,
  getWarranties,
  claimWarranty,
  startWarrantyRepair,
  completeWarrantyTicket,
};
