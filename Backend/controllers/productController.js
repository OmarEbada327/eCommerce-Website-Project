const productService = require("./../services/productService");

const getProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts(req.query);
        res.status(200).json(products);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProduct = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found"});
        }
        res.status(200).json(product);
    }
    catch (err) {
        res.status(500).json({ message: err.message});
    }
};

const createProduct = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one product image is required" });
        }

        const productData = {
            ...req.body,
            images:  req.files.map((file) => ({
                url: file.path,
                publicId: file.filename,
            })),
        };
        const product = await productService.createProduct(productData);
        res.status(201).json(product);
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
};

const updateProduct = async (req, res) => {
    try {
        const updateData = {... req.body };

        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map((file) => ({
                url: file.path,
                publicId: file.filename,
            }));
        }
        const product = await productService.updateProduct(req.params.id, updateData);
        if (!product) {
            return res.status(404).json({ message: "Product not found"});
        }
        res.status(200).json(product);
    }
    catch (err) {
        res.status(400).json({message: err.message});
    }
};

const deleteProduct = async(req, res) => {
    try {
        const product = await productService.deleteProduct(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found"});
        };
        res.status(200).json(product);
    }
    catch (err) {
        res.status(500).json({ message: err.message});
    }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };