const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db/connect");
const { PORT } = require("./config/config");

const app = express();


connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});