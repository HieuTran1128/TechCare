const router = require('express').Router();

const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/supplier.controller');

router.get('/', auth, role(ROLES.MANAGER), controller.getAll);
router.post('/', auth, role(ROLES.MANAGER), controller.create);
router.patch('/:id', auth, role(ROLES.MANAGER), controller.update);
router.delete('/:id', auth, role(ROLES.MANAGER), controller.remove);

module.exports = router;
