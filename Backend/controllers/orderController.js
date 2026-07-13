const orderService = require("../services/orderService");

const checkout = async (req, res) => {
    try {
        const { paymentMethod, shippingAddress } = req.body;
        const order = await orderService.createOrderFromCart(req.user.id, paymentMethod, shippingAddress);
        res.status(201).json(order);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await orderService.getOrdersByUser(req.user.id);
        res.status(200).json(orders);
    }
    catch (err) {
        res.status(500).json({ message: err.message});
    }
};

const getAllOrders = async (_req, res) => {
    try {
        const orders = await orderService.getAllOrders();
        res.status(200).json(orders);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getOrder = async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id, req.user.id);
        res.status(200).json(order);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
        res.status(200).json(order);
    }catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const order = await orderService.cancelOrder(req.params.id, req.user.id);
        res.status(200).json(order);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { checkout, getMyOrders, getAllOrders, getOrder, updateOrderStatus, cancelOrder };
