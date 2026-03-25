const mongoose = require("mongoose");

const workScheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format YYYY-MM-DD
    shift: { type: String, enum: ['morning', 'afternoon'], required: true },
  },
  { timestamps: true },
);

// Compound index to prevent duplicate schedules for same user on same date and shift
workScheduleSchema.index({ userId: 1, date: 1, shift: 1 }, { unique: true });

module.exports = mongoose.model("WorkSchedule", workScheduleSchema);
