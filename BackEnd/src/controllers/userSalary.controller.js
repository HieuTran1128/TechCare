const salaryService = require('../services/userSalary.service');
const User = require('../models/user.model')
const WorkSchedule = require('../models/workSchedule.model')
const UserSalary = require('../models/userSalary')

exports.getMySalary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // YYYY-MM-DD
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng chọn khoảng thời gian" });
    }

    const report = await salaryService.calculateSalary(req.user.userId, startDate, endDate);
    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserSalaryByManager = async (req, res) => {
    try {
      const { userId, startDate, endDate } = req.query;
      const report = await salaryService.calculateSalary(userId, startDate, endDate);
      res.json({ data: report });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
};

exports.getAllSalaries = async (req, res) => {
    try {
        // Lấy điều kiện thời gian (nếu có filter theo tháng trên UI)
        const { startDate, endDate } = req.query;
        let scheduleQuery = {};
        if (startDate && endDate) {
            scheduleQuery.date = { $gte: startDate, $lte: endDate };
        }

        // 1. Lấy tất cả nhân viên (có thể loại bỏ role manager nếu muốn)
        const users = await User.find({ role: { $ne: 'manager' } });
        
        // 2. Lấy tất cả cấu hình lương
        const salaryConfigs = await UserSalary.find();

        // 3. Tính toán cho từng nhân viên
        const report = await Promise.all(users.map(async (user) => {
            // Tìm config lương, nếu chưa có thì mặc định là 0
            const config = salaryConfigs.find(c => c.userId.toString() === user._id.toString()) || { hourlyRate: 0 };
            
            // Đếm số ca làm việc của user này
            const userScheduleQuery = { ...scheduleQuery, userId: user._id };
            const totalShifts = await WorkSchedule.countDocuments(userScheduleQuery);
            
            // Tính toán: 1 ca = 4 tiếng
            const totalHours = totalShifts * 4;
            const totalEarnings = totalHours * config.hourlyRate;

            return {
                userId: user._id,
                fullName: user.fullName,
                role: user.role,
                totalShifts,
                totalHours,
                hourlyRate: config.hourlyRate,
                totalEarnings
            };
        }));

        res.json({ data: report });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cập nhật mức lương theo giờ (Khi ấn nút "Lưu thay đổi" trên Modal UI)
exports.updateSalary = async (req, res) => {
    try {
        const { userId } = req.params;
        const { hourlyRate } = req.body;

        const updated = await UserSalary.findOneAndUpdate(
            { userId },
            { hourlyRate },
            { new: true, upsert: true } // Nếu lỡ user chưa có, tạo luôn
        );

        res.json({ message: "Cập nhật lương thành công", data: updated });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};