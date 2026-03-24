const express = require('express');
const router = express.Router();
const workScheduleController = require('../controllers/workSchedule.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');

router.use(auth);

// Staff endpoints
router.post('/register', role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK), workScheduleController.registerSchedule);
router.delete('/cancel', role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK), workScheduleController.cancelSchedule);
router.get('/my', role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK), workScheduleController.getMySchedules);

// Manager endpoint
router.get('/', role(ROLES.MANAGER), workScheduleController.getAllSchedules);

module.exports = router;
