const router = require('express').Router();

const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/part.controller');

// Shared (manager + storekeeper + technician)
router.get('/', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER, ROLES.TECHNICIAN), controller.getAll);

// Manager only - CRUD parts
router.post('/', auth, role(ROLES.MANAGER), controller.create);
router.patch('/:id', auth, role(ROLES.MANAGER), controller.update);
router.delete('/:id', auth, role(ROLES.MANAGER), controller.remove);

// Manager only - import stock & view import history
router.post('/:id/import', auth, role(ROLES.MANAGER), controller.importStock);
router.post('/import', auth, role(ROLES.MANAGER), controller.importOrder);
router.get('/import-history', auth, role(ROLES.MANAGER), controller.getImportHistory);

// Manager + storekeeper - usage history (parts taken for repairs)
router.get('/usage-history', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER), controller.getUsageHistory);

// Manager dashboard stats
router.get('/stats/summary', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER), controller.getStats);

// Inventory KPI
router.get('/kpi', auth, role(ROLES.MANAGER), controller.getKPI);

// Storekeeper alerts manager about out-of-stock/low-stock
router.post('/:id/alert', auth, role(ROLES.STOREKEEPER), controller.createAlert);

// Manager can view alerts, storekeeper can view too
router.get('/alerts', auth, role(ROLES.MANAGER, ROLES.STOREKEEPER), controller.getAlerts);

module.exports = router;
