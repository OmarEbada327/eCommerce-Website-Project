const cartService = require("./../services/cartService");

const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCartByUser(req.user.id);
        res.status(200).json(cart);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await cartService.addItemToCart(req.user.id, productId, quantity);
        res.status(200).json(cart);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await cartService.updateCartItem(req.user.id, productId, quantity);
        res.status(200).json(cart);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};


const removeFromCart = async (req, res) => {
    try {
        const cart = await cartService.removeItemFromCart(req.user.id, req.params.productId);
        res.status(200).json(cart);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCart(req.user.id);
        res.status(200).json(cart);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };