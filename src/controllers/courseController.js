const { required } = require("joi")
const Course = require("../models/Course")
const { validateCourse } = require("../validators/courseValidator")
const { merge } = require("../server")
const { mergeSort, quickSort } = require("../utils/sortingAlgorithms")

exports.getAllCourses = async (req, res) => {
  try {
    const { department, semester, page = 1, limit = 10 } = req.query

    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters" })
    }
    
    const query = {}

    if (department) query.department = department
    if (semester) query.semester = semester

    const courses = await Course.find(query)
      .populate("instructor", "firstName lastName")
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Course.countDocuments(query)

    res.json({ courses, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), })
  } catch (error) {
    loggers.error("Error in getting all courses:", error)
    res.status(500).json({ message: error.message })
  }
}


exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      courseCode: req.params.courseCode,
    }).populate("instructor", "firstName lastName")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    logger.error("Error in getting Course:", error)
    res.status(500).json({ message: error.message })
  }
}


exports.createCourse = async (req, res) => {
  try {
    const { error } = validateCourse(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const course = new Course({...req.body, instructor: req.user._id,})

    await course.save()
    res.status(201).json({ course, message: "Course created succesfully"})
  } catch (error) {
    logger.error("Error in creating course:", error)
    res.status(500).json({ message: error.message })
  }
}


exports.updateCourse = async (req, res) => {
  try {
    const { error } = validateCourse(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }


    const course = await Course.findOneAndUpdate({ courseCode: req.params }, req.body, { new: true })

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    logger.error("Error in updating course:", error)
    res.status(500).json({ message: error.message })
  }
}


exports.deleteCourse = async (req, res) => {
  try {
    
    const course = await Course.findOneAndDelete({ courseCode: req.params.courseCode})

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json({ message: "Course deleted successfully" })
  } catch (error) {
  
    console.error("Error in deleteCourse:", error)
    res.status(500).json({ message: error.message })
  }
}



exports.sortCourses = async (req, res) => {
  try {
    const { field, algorithm = quick } = req.query
    
    if (!field) {
      return res.status(400).json({message: "Sorting field is required"})
    }


    const courses = await Course.find()
      .populate("instructor", "firstName lastName")
      .lean()
    const sortedCourses = algorithm === "merge" ? mergeSort(courses, field) : quickSort(courses, field)
    
    res.json({ field, algorithm, data: sortedCourses,})
    
  } catch (error) {
    logger.error("Error is sortCourses:", error)
    res.status(500).json({message: error.message})
  }
}
