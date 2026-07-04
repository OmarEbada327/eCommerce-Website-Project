const Order = require("./../models/orderModel");
const Cart = require("./../models/cartModel");

const createOrderFromCart = async (userId, PaymentMethod, shippingAddress) => {
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
    return cart;
};

const getOrdersByUser = async (userId) => {
    return await order.find({ user: userId }).populate("products.productId");
};

const getOrderById = async (orderId) => {
    const order = Order.findById(orderId).populate("products.productId");

    if (!order) {
        throw new Error("Order not found");
    };
    return order;
};

const updateOrderStatus = async (orderId, status) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidator: true }
    );

    if (!order) {
        throw new Error("Order not found");
    };
    return order;
};

const cancelOrder = async (orderId) => {
    return await UpdateOrderStatus(orderId, "cancelled");
};

module.exports = { createOrderFromCart, getOrderByUser, getOrderById, updateOrderStatus, cancelOrder };