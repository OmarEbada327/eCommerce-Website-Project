const { registerUser } = require("../services/userService");
const { loginUser } = require("../services/authService");
const asyncHandler = require("../middleware/asyncHandler");

const register = asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { token, user } = await loginUser(email, password);
    res.status(200).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
})

module.exports = { register, login };