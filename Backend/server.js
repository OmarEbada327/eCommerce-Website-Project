const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db/connect");

dotenv.config();
const app = express();

const  PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});