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
        const productData = {
            ...req.body,
            image: {
                url: req.file.path,
                publicId: req.file.filename,
            },
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
        const updateDate = {... req.body };

        if (req.file) {
            updateData.image = {
                url: req.file.path,
                publicId: req.file.filename,
            };
        }
        const product = await productService.updateProduct(req.params.id, updateDate, { new: true, runValidator: true });
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