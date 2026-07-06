const cartController = require("../controllers/cartController");
const express = require("express");
const router = express.Router();

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.put("/", cartController.updateCartItem);
router.delete("/:productId", cartController.removeFromCart);
router.delete("/", cartController.clearCart);

module.exports = router;