const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    ticketCode: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    category: {
      type: String,
      enum: ['SERVICE', 'QUALITY', 'PRICE', 'ATTITUDE', 'OTHER'],
      default: 'OTHER',
    },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
      default: 'OPEN',
    },
    resolution: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Complaint', complaintSchema);
