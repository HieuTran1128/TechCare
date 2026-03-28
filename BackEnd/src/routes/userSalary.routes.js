// routes/userSalary.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant'); // Chắc chắn đường dẫn này đúng với dự án của bạn
const userSalaryController = require('../controllers/userSalary.controller');

// Lấy danh sách lương (chỉ Manager)
router.get('/', auth, role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK, ROLES.MANAGER), userSalaryController.getAllSalaries);

// Cập nhật mức lương cho 1 user cụ thể
router.put('/:userId', auth, role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK, ROLES.MANAGER), userSalaryController.updateSalary);

module.exports = router;