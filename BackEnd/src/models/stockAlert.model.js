const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema(
  {
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'RESOLVED'],
      default: 'OPEN',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('StockAlert', stockAlertSchema);
