const express = require("express");
const productController = require("../controllers/productController");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { uploadProductImages } = require("../middleware/uploadMiddleware");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post("/", protect, adminOnly, uploadProductImages("images", 5), productController.createProduct);
   router.put("/:id", protect, adminOnly, uploadProductImages("images", 5), productController.updateProduct);
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

module.exports = router;
