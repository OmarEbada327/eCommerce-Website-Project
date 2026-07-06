const express = require("express");
const productController = require("../controllers/productController");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post("/", protect, adminOnly, productController.createProduct);
router.put("/:id", protect, adminOnly, productController.updateProduct);
router.delete("/:id", ptotect, adminOnly, productController.deleteProduct);

module.exports = router;