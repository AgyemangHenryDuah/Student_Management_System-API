const jwt = require("jsonwebtoken")
const User = require("../models/User")

const generateToken = (id) => {
  try {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })
  } catch (error) {
    throw new Error('Token generation failed')
  }
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check for missing fields
    if (!email && !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" })
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    let isValidPassword
    try {
      isValidPassword = await user.comparePassword(password)
    } catch (error) {
      return res.status(500).json({ message: error.message })
    }

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = generateToken(user._id)
    res.json({ token, role: user.role, message: "Login Successful" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.resetPassword = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: "Email is required" })
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" })
  }

  res.status(501).json({ message: "Under Construction" })
}


// const jwt = require("jsonwebtoken")
// const User = require("../models/User")

// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: "24h",
//   })
// }

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body
//     const user = await User.findOne({ email })

//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: "Invalid credentials" })
//     }

//     const token = generateToken(user._id)
//     res.json({ token, role: user.role, message: "Login Successful" },)
//   } catch (error) {
//     res.status(500).json({ message: error.message })
//   }
// }

// exports.resetPassword = async (req, res) => {
//   res.status(501).json({ message: "Under Construction" })
// }
