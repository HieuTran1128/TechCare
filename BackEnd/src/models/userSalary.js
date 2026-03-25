const mongoose = require("mongoose");

const userSalaryConfigSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    hourlyRate: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' }
}, { timestamps: true });

module.exports = mongoose.model("UserSalaryConfig", userSalaryConfigSchema);