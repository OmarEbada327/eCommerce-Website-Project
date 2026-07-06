const orderController =  require("../controllers/orderController");
const express = require("express");
const router = express.Router();

router.post("/ckeckout", orderController.checkout);
router.get("/mine", orderController.getMyOrders);
router.get("/:id", orderController.getOrder);
router.patch("/:id/status", orderController.updateOrderStatus);
router.patch("/:id/cancel", orderController.cancelOrder);

module.exports = router;