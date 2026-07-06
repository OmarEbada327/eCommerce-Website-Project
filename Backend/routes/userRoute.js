const userController = require("../controllers/userController");
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);
router.delete("/:id", protect, adminOnly, userController.deleteUser);

module.exports = router;