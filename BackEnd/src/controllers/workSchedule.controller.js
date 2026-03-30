const WorkSchedule = require('../models/workSchedule.model');
const UserSalary = require('../models/userSalary')

/**
 * Nhân viên đăng ký ca làm việc theo ngày và ca (sáng/chiều).
 */
exports.registerSchedule = async (req, res) => {
  try {
    const { date, shift } = req.body;
    if (!date || !['morning', 'afternoon'].includes(shift)) {
      return res.status(400).json({ message: 'Ngày hoặc ca làm không hợp lệ' });
    }

    // Upsert or create
    const schedule = await WorkSchedule.create({
      userId: req.user.userId,
      date,
      shift,
    });

    await UserSalary.updateOne(
      { userId: req.user.userId },
      { $setOnInsert: { hourlyRate: 0, currency: 'VND' } },
      { upsert: true }
    );

    res.status(201).json({ message: 'Đăng ký ca làm thành công', data: schedule });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Bạn đã đăng ký ca này rồi' });
    }
    res.status(500).json({ message: err.message });
  }
};

/**
 * Nhân viên hủy ca làm việc đã đăng ký theo ngày và ca.
 */
exports.cancelSchedule = async (req, res) => {
  try {
    const { date, shift } = req.query; // Send from via params or query
    if (!date || !shift) {
      return res.status(400).json({ message: 'Thiếu ngày hoặc ca làm' });
    }

    const deleted = await WorkSchedule.findOneAndDelete({
      userId: req.user.userId,
      date,
      shift
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy ca làm để hủy' });
    }

    res.json({ message: 'Hủy ca làm thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Nhân viên xem lịch làm việc của chính mình, có thể lọc theo khoảng thời gian.
 */
exports.getMySchedules = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { userId: req.user.userId };
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const schedules = await WorkSchedule.find(query).sort({ date: 1, shift: 1 });
    res.json({ data: schedules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Manager xem toàn bộ lịch làm việc của tất cả nhân viên, có thể lọc theo khoảng thời gian.
 */
exports.getAllSchedules = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const schedules = await WorkSchedule.find(query)
      .populate('userId', 'fullName role avatar')
      .sort({ date: 1, shift: 1 });

    res.json({ data: schedules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
