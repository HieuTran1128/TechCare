const express = require('express');
const router = express.Router();
const workScheduleController = require('../controllers/workSchedule.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');

// Tất cả route đều yêu cầu đăng nhập
router.use(auth);

/** POST /api/schedules/register — Nhân viên đăng ký ca làm việc theo ngày và ca (technician, storekeeper, frontdesk) */
router.post('/register', role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK), workScheduleController.registerSchedule);

/** DELETE /api/schedules/cancel — Nhân viên hủy ca làm việc đã đăng ký (technician, storekeeper, frontdesk) */
router.delete('/cancel', role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK), workScheduleController.cancelSchedule);

/** GET /api/schedules/my — Nhân viên xem lịch làm việc của chính mình (technician, storekeeper, frontdesk) */
router.get('/my', role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK), workScheduleController.getMySchedules);

/** GET /api/schedules — Manager xem toàn bộ lịch làm việc của tất cả nhân viên */
router.get('/', role(ROLES.MANAGER), workScheduleController.getAllSchedules);

module.exports = router;
