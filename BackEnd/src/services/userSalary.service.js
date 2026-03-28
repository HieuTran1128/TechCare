// salary.service.js
const WorkSchedule = require('../models/workSchedule.model');
const UserSalary = require('../models/userSalary');

exports.calculateSalary = async (userId, startDate, endDate) => {
  // 1. Lấy cấu hình lương của user
  const salaryConfig = await UserSalary.findOne({ userId });
  if (!salaryConfig) throw new Error("Chưa cấu hình lương cho nhân viên này");

  // 2. Lấy danh sách ca làm trong khoảng thời gian
  const schedules = await WorkSchedule.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  });

  const HOURS_PER_SHIFT = 4; // Theo yêu cầu của bạn
  const totalShifts = schedules.length;
  const totalHours = totalShifts * HOURS_PER_SHIFT;
  const totalEarnings = totalHours * salaryConfig.hourlyRate;

  return {
    userId,
    totalShifts,
    totalHours,
    hourlyRate: salaryConfig.hourlyRate,
    totalEarnings,
    currency: salaryConfig.currency,
    period: { startDate, endDate }
  };
};