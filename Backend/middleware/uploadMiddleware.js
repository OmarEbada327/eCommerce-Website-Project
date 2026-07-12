const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per image
        files: 5,
    },
});

function uploadBufferToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "ecommerce-products" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
}

function uploadProductImages(fieldName = "images", maxCount = 5) {
    const parseFiles = upload.array(fieldName, maxCount);

    return (req, res, next) => {
        parseFiles(req, res, async (err) => {
            if (err) {
                console.error("Upload error:", err);
                if (err instanceof multer.MulterError) {
                    const messages = {
                        LIMIT_FILE_SIZE: "Each image must be 5MB or smaller.",
                        LIMIT_FILE_COUNT: "You can upload up to 5 images per product.",
                        LIMIT_UNEXPECTED_FILE: "Only .jpg, .jpeg, .png, and .webp images are allowed.",
                    };
                    return res.status(400).json({
                        message: messages[err.code] || `Upload error: ${err.message}`,
                    });
                }
                return res.status(400).json({
                    message: err.message || "Image upload failed. Please try again.",
                });
            }

            if (!req.files || req.files.length === 0) {
                return next();
            }

            try {
                const results = await Promise.all(
                    req.files.map((file) => uploadBufferToCloudinary(file.buffer))
                );

                req.files = results.map((result) => ({
                    path: result.secure_url,
                    filename: result.public_id,
                }));

                next();
            } catch (uploadErr) {
                console.error("Cloudinary upload failed:", uploadErr);
                return res.status(502).json({
                    message: "Couldn't upload images to Cloudinary. Please check your Cloudinary credentials and try again.",
                });
            }
        });
    };
}

module.exports = upload;
module.exports.uploadProductImages = uploadProductImages;