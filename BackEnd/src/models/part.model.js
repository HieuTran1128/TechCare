const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  partName: {
    type: String,
    required: true
  },
  brand: String,
  imageUrl: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  warrantyMonths: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  minStock: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Part', partSchema);
