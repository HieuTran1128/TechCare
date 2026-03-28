const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintCode: { type: String, required: true, unique: true },

    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairTicket', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

    category: {
      type: [String],
      enum: ['SERVICE_QUALITY', 'PRICE', 'TECHNICIAN', 'TURNAROUND_TIME', 'OTHER'],
      required: true,
    },

    description: { type: String, required: true },

    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'],
      default: 'OPEN',
    },

    // Token để khách submit form (từ link trong mail)
    complaintToken: { type: String },
    complaintTokenExpireAt: { type: Date },

    // Manager xử lý
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String },
    compensationType: {
      type: String,
      enum: ['NONE', 'REFUND', 'DISCOUNT', 'REDO'],
      default: 'NONE',
    },
    compensationAmount: { type: Number, default: 0 },

    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Complaint', complaintSchema);
