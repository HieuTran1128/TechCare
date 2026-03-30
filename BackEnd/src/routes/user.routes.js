const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles.constant');
const controller = require('../controllers/user.controller');
const upload = require('../middlewares/upload.middleware');

/** GET /api/users/me — Lấy thông tin người dùng hiện đang đăng nhập */
router.get('/me', auth, controller.getCurrentUser);

/** GET /api/users — Lấy danh sách tất cả nhân viên, có thể lọc theo role (manager, frontdesk) */
router.get('/', auth, role(ROLES.MANAGER, ROLES.FRONTDESK), controller.getAllUsers);

/** POST /api/users/invite — Tạo tài khoản nhân viên mới và gửi email mời kích hoạt (manager) */
router.post('/invite', auth, role(ROLES.MANAGER), controller.createUser);

/** POST /api/users/invite-bulk — Tạo nhiều tài khoản nhân viên cùng lúc (manager) */
router.post('/invite-bulk', auth, role(ROLES.MANAGER), controller.createUserBulk);

/** POST /api/users/avatar — Upload và cập nhật ảnh đại diện cho người dùng hiện tại */
router.post('/avatar', auth, upload.single('avatar'), controller.updateAvatar);

/** PATCH /api/users/profile — Cập nhật thông tin cá nhân (họ tên, số điện thoại) */
router.patch('/profile', auth, controller.updateProfile);

/** PATCH /api/users/password — Đổi mật khẩu sau khi xác minh mật khẩu hiện tại */
router.patch('/password', auth, controller.changePassword);

/** DELETE /api/users/:id — Xóa tài khoản nhân viên theo ID (manager) */
router.delete('/:id', auth, role(ROLES.MANAGER), controller.deleteUser);

/** PATCH /api/users/:id/block — Khóa hoặc mở khóa tài khoản nhân viên (manager) */
router.patch('/:id/block', auth, role(ROLES.MANAGER), controller.toggleBlockUser);

module.exports = router;
