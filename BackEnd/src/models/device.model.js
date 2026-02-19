const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  deviceType: String,
  brand: String,
  model: String,
  serialNumber: String
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
