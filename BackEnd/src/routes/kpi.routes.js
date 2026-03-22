const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/kpi.controller');

router.get('/', auth, role(ROLES.MANAGER), controller.getKpi);

module.exports = router;
