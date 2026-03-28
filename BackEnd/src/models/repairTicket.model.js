const mongoose = require('mongoose');

const repairPartSchema = new mongoose.Schema(
  {
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    warrantyMonths: { type: Number, default: 0 },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);

const inventoryRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NOT_REQUIRED',
    },
    requiredParts: [repairPartSchema],
    noteFromTechnician: String,
    noteFromStorekeeper: String,
    respondedAt: Date,
  },
  { _id: false },
);

const quoteSchema = new mongoose.Schema(
  {
    diagnosisResult: String,
    estimatedCost: Number,
    laborCost: Number,
    workDescription: String,
    estimatedCompletionDate: Date,
    sentAt: Date,
    customerDecisionAt: Date,
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['CASH', 'PAYOS'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
    },
    paidAt: Date,
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    payosOrderCode: String,
    payosCheckoutUrl: String,
  },
  { _id: false },
);

const repairTicketSchema = new mongoose.Schema(
  {
    ticketCode: String,
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerAssignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    initialIssue: String,

    status: {
      type: String,
      enum: [
        'RECEIVED',
        'MANAGER_ASSIGNED',
        'DIAGNOSING',
        'WAITING_INVENTORY',
        'INVENTORY_APPROVED',
        'INVENTORY_REJECTED',
        'QUOTED',
        'CUSTOMER_APPROVED',
        'CUSTOMER_REJECTED',
        'IN_PROGRESS',
        'COMPLETED',
        'PAYMENTED',
        'DONE_INVENTORY_REJECTED',
        'WARRANTY_DONE',
      ],
      default: 'RECEIVED',
    },

    quote: quoteSchema,

    approvalToken: String,
    approvalExpireAt: Date,

    inventoryRequest: inventoryRequestSchema,

    finalCost: Number,
    completedAt: Date,
    payment: paymentSchema,

    repairParts: [repairPartSchema],
    statusHistory: [statusHistorySchema],

    // Bảo hành
    isWarrantyClaim: { type: Boolean, default: false },
    originalTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairTicket' },
    warrantyClaimType: { type: String, enum: ['STORE_FAULT', 'CUSTOMER_FAULT'] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('RepairTicket', repairTicketSchema);
