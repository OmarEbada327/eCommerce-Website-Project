const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db/connect");

dotenv.config();

const app = express();