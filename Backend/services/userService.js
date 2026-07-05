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

const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

const getUserById = async (id) => {
    const user = await User.findById(id).select("-password");
    if (!user) {
        throw new Error("User not found")
    };
    return user;
};

const updateUserProfile = async (id, data) => {
    const { role, ...safeData} = data;

    const user = await User.findByIdAndUpdate(id, safeData, {new: true, runValidators: true}).select("-password");

    if (!user) {
        throw new Error("User not found");
    };

    return user;
};

const updateUserRole = async (id, role) => {
    const user = await User.findByIdAndUpdate(id, { role } , {new: true, runValidators: true}).select("-password");

    if (!user) {
        throw new Error("User not found");
    };

    return user;
};

const deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
        throw new Error("User not found");
    };

    return user;
};

module.exports = { registerUser, findUserByEmail, getUserById, updateUserProfile, updateUserRole, deleteUser};