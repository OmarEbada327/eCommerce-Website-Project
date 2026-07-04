const Product = require("./../models/productModel");

const getAllProducts = async (filters = {}) => {
    return await Product.find(filters).sort({ createdAt: -1});
};

const getProductById = async (id) => {
    return await Product.findById(id);
};

const createProduct = async (data) => {
    return await Product.create(data);
};

const updateProduct = async (id, data) => {
    return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteProduct = async (id) => {
    return await Product.findByIdAndDelete(id);
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };