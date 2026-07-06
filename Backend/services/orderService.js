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

const getOrderById = async (orderId) => {
    const order = await Order.findById(orderId).populate("products.productId");

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

const cancelOrder = async (orderId) => {
    return await updateOrderStatus(orderId, "cancelled");
};

module.exports = { createOrderFromCart, getOrdersByUser, getOrderById, updateOrderStatus, cancelOrder };