const userService = require("../services/userService");

const getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        res.status(200).json(user);
    }
    catch (err) {
        res.status(404).json({ message: err.message });
    }
};

const UpdateProfile = async (req, res) => {
    try {
        const user = await userService.updateUserProfile(req.user.id, req.body);
        res.status(200).json(user)
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await userService.deleteUser(req.params.id);
        res.status(200).json({ message: "User deleted"});
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { getProfile, UpdateProfile, deleteUser };