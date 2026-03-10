const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles.constant");
const controller = require("../controllers/user.controller");
const upload = require("../middlewares/upload.middleware");

router.post("/invite", auth, role(ROLES.MANAGER), controller.createUser);
router.post("/avatar", auth, upload.single("avatar"), controller.updateAvatar);
router.get("/", auth, role(ROLES.MANAGER), controller.getAllUsers);
router.delete('/:id', auth, role(ROLES.MANAGER), controller.deleteUser);
router.patch('/:id/block', auth, role(ROLES.MANAGER), controller.toggleBlockUser);
router.patch("/profile", auth, controller.updateProfile);
router.get('/me', auth, controller.getCurrentUser);

module.exports = router;
