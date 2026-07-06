const orderController =  require("../controllers/orderController");
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/ckeckout", protect, orderController.checkout);
router.get("/mine", protect, orderController.getMyOrders);
router.get("/:id", protect, orderController.getOrder);
router.patch("/:id/status", protect, adminOnly, orderController.updateOrderStatus);
router.patch("/:id/cancel", protect, orderController.cancelOrder);

module.exports = router;