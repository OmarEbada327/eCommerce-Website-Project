const Cart = require("./../models/cartModel");
const Product = require("./../models/productModel");

const getCartByUser = async (userId) => {
    return await Cart.findOne({ user: userId }).populate(products.productId);
};

const addItemToCart = async (userId, productId, quantity) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found").status(404);
    };

    let cart = Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({ user: userId, products: [] });
    };

    const existingItem = cart.products.find(
        (item) => item.productId.toString() === productId.toString()
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * product.price;
    } else {
        cart.products.push({
            productId,
            quantity,
            totalPrice: quantity * product.price,
        });
    };
    await cart.save();
    return cart;
};

const updateCartItem = async (userId, productId, quantity) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found").status(404);
    };
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new Error("Cart not found").status(404);
    };

    const existingItem = cart.products.find(
        (item => item.productId.toString() === productId.toString())
    );

    if (!existingItem) {
        throw new Error("Item not in cart").status(404);
    };

    existingItem.quantity = quantity;
    existingItem.totalPrice = quantity * product.price;

    await cart.save();
    return cart;
};

const removeItemFromCart = async (userId, productId) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new Error("Cart not found").status(404);
    };

    cart.products = cart.products.filter(
        (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    return cart;
};

const clearCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId});
    if (!cart) {
        throw new Error("Cart not found").status(404);
    };

    cart.products = [];

    await cart.save();
    return cart;
};

module.exports = { getCartByUser, addItemToCart, updateCartItem, removeItemFromCart, clearCart };