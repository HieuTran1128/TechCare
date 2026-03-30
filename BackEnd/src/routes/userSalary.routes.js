const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const userSalaryController = require('../controllers/userSalary.controller');

/** GET /api/salary — Lấy bảng lương tổng hợp của tất cả nhân viên (tất cả role) */
router.get(
  '/',
  auth,
  role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK, ROLES.MANAGER),
  userSalaryController.getAllSalaries,
);

/** PUT /api/salary/:userId — Cập nhật mức lương theo giờ của một nhân viên (tất cả role) */
router.put(
  '/:userId',
  auth,
  role(ROLES.TECHNICIAN, ROLES.STOREKEEPER, ROLES.FRONTDESK, ROLES.MANAGER),
  userSalaryController.updateSalary,
);

module.exports = router;
