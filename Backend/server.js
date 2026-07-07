const express = require("express");
const connectDB = require("./db/connect");
const { PORT } = require("./config/config");
const errorHandler = require("./middleware/errorHandler");


const productRoutes = require("./routes/productRoute");
const cartRoutes = require("./routes/cartRoute");
const orderRoutes = require("./routes/orderRoute");
const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");

const app = express();

app.use(express.json());

app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);

app.use(errorHandler);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});