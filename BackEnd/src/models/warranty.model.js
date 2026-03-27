const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairTicket',
    required: true
  },
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  warrantyMonths: {
    type: Number,
    default: 0
  },
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  // Kết quả xử lý bảo hành
  claimType: {
    type: String,
    enum: ['STORE_FAULT', 'CUSTOMER_FAULT'], // STORE_FAULT: free | CUSTOMER_FAULT: từ chối
  },
  claimNote: String,
  claimedAt: Date,
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Warranty', warrantySchema);
