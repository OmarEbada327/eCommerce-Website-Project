const Order = require("./../models/orderModel");
const Cart = require("./../models/cartModel");

const createOrderFromCart = async (userId, paymentMethod, shippingAddress) => {
    const cart = await Cart.findOne({ user: userId }).populate("products.productId");
    if (!cart || cart.products.length === 0) {
        throw new Error("Cart is empty");
    };

    const orderProducts = cart.products.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
    }));

    const totalPrice = cart.products.reduce(
        (sum, item) => sum + item.totalPrice,
        0
    );

    const order = await Order.create({
        user: userId,
        products: orderProducts,
        totalPrice,
        paymentMethod,
        shippingAddress,
    });

    cart.products = [];
    await cart.save();
    return order;
};

const getOrdersByUser = async (userId) => {
    return await Order.find({ user: userId }).populate("products.productId");
};

const getAllOrders = async () => {
    return await Order.find()
        .populate("user", "name email phone")
        .populate("products.productId")
        .sort({ createdAt: -1 });
};

const getOrderById = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, user: userId }).populate("products.productId");

    if (!order) {
        throw new Error("Order not found");
    };
    return order;
};

const updateOrderStatus = async (orderId, status) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true }
    );

    if (!order) {
        throw new Error("Order not found");
    };
    return order;
};

const cancelOrder = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
        throw new Error("Order not found");
    }
    if (!["pending", "processing"].includes(order.status)) {
        throw new Error("Only orders that have not shipped can be cancelled");
    }

    order.status = "cancelled";
    await order.save();
    return order;
};

module.exports = { createOrderFromCart, getOrdersByUser, getAllOrders, getOrderById, updateOrderStatus, cancelOrder };
