const jwt = require("jsonwebtoken");

const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

const generateRefreshToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};


module.exports = {
    generateAccessToken,
    generateRefreshToken,
};
