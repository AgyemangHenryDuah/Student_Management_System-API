const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};


const OwnProfile = (req, res, next) => {
  const studentId = req.params.id;
  if (req.user.role === 'instructor') {
    return next();
  }

  if (req.user._id.toString() !== studentId.toString()) {
    return res.status(403).json({
      message: "You can only update your own profile"
    });
  }
  next();
};

module.exports = OwnProfile;


module.exports = { auth, authorize, OwnProfile };
