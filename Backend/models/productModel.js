const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide product name"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Please provide product price"],
        min: [0, "Price cannot be negative"],
    },
    quantity: {
        type: Number,
        required: [true, "Please provide product quantity"],
        min: [0, "Quantity cannot be negative"]
    },
    description: {
        type: String,
        required: [true, "Please provide product description"],
        trim: true,
    },
    category: {
        type: String,
        required: [true, "Please provide product category"],
        trim: true,
    },
}, { timestamps: true });


module.exports = mongoose.model("Product", productSchema) 