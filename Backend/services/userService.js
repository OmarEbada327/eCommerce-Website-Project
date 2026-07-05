const bcrypt = require("bcrypt");
const User = require("./../models/userModel");

const registerUser = async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
        ...data,
        password: hashedPassword,
    });
    return user;
};