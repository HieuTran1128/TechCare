const WorkSchedule = require('../models/workSchedule.model');

// Staff registers a shift
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
    
    res.status(201).json({ message: 'Đăng ký ca làm thành công', data: schedule });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Bạn đã đăng ký ca này rồi' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Staff deletes a registered shift
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

// Staff view their own schedules
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

// Manager view all schedules
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
