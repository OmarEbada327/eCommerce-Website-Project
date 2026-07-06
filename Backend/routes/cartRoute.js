const cartController = require("../controllers/cartController");
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, cartController.getCart,);
router.post("/", protect, cartController.addToCart);
router.put("/", protect, cartController.updateCartItem);
router.delete("/:productId", protect, cartController.removeFromCart);
router.delete("/", protect, cartController.clearCart);

module.exports = router;