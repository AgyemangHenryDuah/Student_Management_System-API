const Instructor = require("../models/Instructor")
const User = require("../models/User")
const { validateInstructor } = require("../validators/instructorValidator")
const logger = require("../config/logger")
const jwt = require("jsonwebtoken")



exports.getAllInstructors = async (req, res) => {
  try {
    const { department, title, page = 1, limit = 10 } = req.query
    const query = {}


    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return res.status(400).json({message: "Invalid pagination parameters"})
    }

    if (department) query.department = department
    if (title) query.title = title

    const instructors = await Instructor.find(query)
      .populate("user", "firstName lastName email")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const total = await Instructor.countDocuments(query)

    res.json({
      instructors,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalInstructors: total,
    })
  } catch (error) {
    logger.error("Error in getting all Instructors:", error)
    res.status(500).json({ message: error.message })
  }
}

exports.getInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id).populate(
      "user",
      "firstName lastName email"
    )

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" })
    }

    res.json(instructor)
  } catch (error) {
    logger.error("Error in getInstructor:", error)
    res.status(500).json({ message: error.message })
  }
}

exports.createInstructor = async (req, res) => {

  try {

    const { error } = validateInstructor(req.body, "POST")
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const existingUser = await User.findOne({ email: req.body.email })
    
    if (existingUser) {
      return res.status(400).json({message: "Email is already in use"})
    }



    const user = new User({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: "instructor",
    })
    await user.save()

    const instructor = new Instructor({
      user: user._id,
      department: req.body.department,
      title: req.body.title,
      specialization: req.body.specialization,
      officeHours: req.body.officeHours || [],
      publications: req.body.publications || [],
    })

    await instructor.save()

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" })

    const populatedInstructor = await Instructor.findById(
      instructor._id
    ).populate("user", "firstName lastName email")

    res.status(201).json({
      message: "Instructor registered succefully",
      token,
      instructor: populatedInstructor,
    })

  } catch (error) {
    logger.error(`Error in createInstructor - User Email: ${req.body.email}:`, error);
    res.status(500).json({ message: error.message })
  } finally {
  }
}


exports.updateInstructor = async (req, res) => {
  try {
    const { error } = validateInstructor(req.body, "PUT")
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const instructor = await Instructor.findByIdAndUpdate(req.params.id,{$set: req.body},{ new: true }).populate("user", "firstName lastName email")

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" })
    }

    res.json(instructor)
  } catch (error) {
    logger.error("Error in updateInstructor:", error)
    res.status(500).json({ message: error.message })
  }
}



exports.deleteInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" })
    }

    const userId = instructor.user._id

    await User.findByIdAndDelete(userId)

    await Instructor.findByIdAndDelete(req.params.id)

    res.json({ message: "Instructor profile deleted successfully" })
    logger.info(`Deleting user with ID: ${userId}`)
  } catch (error) {
    logger.error("Error in deleteInstructor:", error)
    res.status(500).json({ message: error.message })
  }
}
