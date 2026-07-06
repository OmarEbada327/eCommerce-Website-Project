const jwt = require("jsonwebtoken");
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authorized, no token"})
    };
        
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verfiy(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Not authorized, invalid token"})
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== "admins") {
        return res.status(403).json({ message: "Admin only"});
    }
    next();
};

module.exports = { protect, adminOnly };