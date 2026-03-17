const mongoose = require('mongoose');

const importItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImportOrder',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    importPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ImportItem', importItemSchema);
