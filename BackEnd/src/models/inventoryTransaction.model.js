const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true
  },

  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairTicket'
  },

  quantity: {
    type: Number,
    required: true
  },

  unitPrice: {
    type: Number,
    default: 0
  },

  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

module.exports = mongoose.model(
  'InventoryTransaction',
  inventoryTransactionSchema
);
