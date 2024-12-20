const jwt = require("jsonwebtoken")
const User = require("../models/User")

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  })
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = generateToken(user._id)
    res.json({ token, role: user.role, message: "Login Successful" },)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.resetPassword = async (req, res) => {
  res.status(501).json({ message: "Under Construction" })
}
