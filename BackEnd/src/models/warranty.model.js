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

  startDate: Date,
  endDate: Date,

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Warranty', warrantySchema);
