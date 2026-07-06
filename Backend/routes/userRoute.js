const userController = require("../controllers/userController");
const express = require("express");
const router = express.Router();

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.delete("/:id", userController.deleteUser);

module.exports = router;