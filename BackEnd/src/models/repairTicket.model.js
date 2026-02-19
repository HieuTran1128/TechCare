const mongoose = require('mongoose');

const repairPartSchema = new mongoose.Schema({
  part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' },
  quantity: Number,
  unitPrice: Number
});

const statusHistorySchema = new mongoose.Schema({
  status: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now }
});

const repairTicketSchema = new mongoose.Schema({
  ticketCode: String,
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  initialIssue: String,
  diagnosisResult: String,
  estimatedCost: Number,
  finalCost: Number,

  status: {
    type: String,
    enum: [
      'RECEIVED',
      'ASSIGNED',
      'WAITING_APPROVAL',
      'IN_PROGRESS',
      'REJECTED',
      'COMPLETED'
    ],
    default: 'RECEIVED'
  },

  approvalToken: String,
  approvalExpireAt: Date,

  repairParts: [repairPartSchema],
  statusHistory: [statusHistorySchema]

}, { timestamps: true });

module.exports = mongoose.model('RepairTicket', repairTicketSchema);
