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
    
}