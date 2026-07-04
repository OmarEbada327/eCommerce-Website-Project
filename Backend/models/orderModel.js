const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide user ID"],        
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Please provide product ID"],
        },
        quantity: {
            type: Number,
            required: [true, "Please provide product quantity"],
            min: [1, "Quantity must be at least 1"],
        },
    }],
    totalPrice: {
        type: Number,
        required: [true, "Please provide total price"],
        min: [0, "Total price cannot be negative"],
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    shippingAddress: {
        street: {type: String, trim: true},
        city: {type: String, trim: true},
        state: {type: String, trim: true},
        zip: {type: String, trim: true},
        country: {type: String, trim: true},
    },
    paymentMethod: {
        type: String,
        enum: ["credit_card", "paypal", "cash_on_delivery"],
        required: [true, "Please provide payment method"],
    },
}, { timestamps: true});

module.exports = mongoose.model("Order", orderSchema);