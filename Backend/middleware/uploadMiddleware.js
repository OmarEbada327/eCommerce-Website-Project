const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = cloudinaryStorage({
    cloudinary,
    folder: "ecommerce-products",
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
});

const upload = multer({ storage });

module.exports = upload;