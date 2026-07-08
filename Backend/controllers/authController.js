const { registerUser } = require("../services/userService");
const { loginUser } = require("../services/authService");
const asyncHandler = require("../middleware/asyncHandler");
const sanitize = require("mongo-sanitize");

const register = asyncHandler(async (req, res) => {
    const data = sanitize(req.body)
    const user = await registerUser(data);
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
});

const login = asyncHandler(async (req, res) => {
    const email = sanitize(req.body.email);
    const password = sanitize(req.body.password);
    const { token, user } = await loginUser(email, password);
    res.status(200).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
})

module.exports = { register, login };