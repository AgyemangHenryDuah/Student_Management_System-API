const User = require("../models/User")
const { validateLogin, validateRefreshToken, validateResetPassword } = require("../validators/authValidator")
const { generateAccessToken, generateRefreshToken } = require("../utils/token")
const jwt = require("jsonwebtoken")


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    const errors = validateLogin({ email, password })

    if (errors) {
      return res.status(400).json({ message: errors })
    }

    const user = await User.findOne({ email })

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" })
    }


    const accessToken = generateAccessToken(user._id, user.role)
    const refreshToken = generateRefreshToken(user._id, user.role)

    res.json({
      accessToken,
      refreshToken,
      role: user.role,
      message: "Login Successful"
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body
  const errors = validateRefreshToken({ refreshToken })

  if (errors) {
    return res.status(400).json({ message: errors })
  }


  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)

    const accessToken = generateAccessToken(decoded.id, decoded.role)
    res.json({ accessToken })
  }
  catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = validateResetPassword({ email, password });

    if (errors) {
      return res.status(400).json({ message: errors });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Update password
    user.password = password;
    await user.save();

    // Generate new tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.status(200).json({
      message: "Password reset successful",
      accessToken,
      refreshToken
    });

  } catch (error) {
    res.status(500).json({
      message: "Error resetting password",
      error: error.message
    });
  }
};
