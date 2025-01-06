const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Student = require("../models/Student");
const { validateEnrollment } = require("../validators/enrollmentValidator");
const logger = require("../config/logger")

exports.enrollStudent = async (req, res) => {
  try {
    const { error } = validateEnrollment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const course = await Course.findOne({ courseCode: req.body.courseCode });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const student = await Student.findOne({ studentId: req.body.studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: student._id,
      course: course._id,
    });

    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "Student is already enrolled in this course" });
    }

    const enrolledCount = await Enrollment.countDocuments({
      course: course._id,
    });

    if (enrolledCount >= course.capacity) {
      return res.status(400).json({ message: "Course capacity reached" });
    }

    const enrollment = new Enrollment({
      student: student._id,
      course: course._id,
    });

    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentEnrollments = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({message: "Student not found"})
    }

    const enrollments = await Enrollment.find({ student: student._id })
      .populate("course")
      .populate("student");
    

    res.json(enrollments);
  } catch (error) {
    logger.error("Error in getting student enrollment:", error)
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseEnrollments = async (req, res) => {
  try {
    const course = await Course.findOne({ courseCode: req.params.courseId });
    if (!course) {
      return res.status(404).json({message: "Course not found"})
    }
    const enrollments = await Enrollment.find({ course: course._id })
      .populate("student")
      .populate("course");

    res.json(enrollments);
  } catch (error) {
    logger.error("Error in getting course enrollment:", error)
    res.status(500).json({ message: error.message });
  }
};

exports.cancelEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.json({ message: "Enrollment cancelled successfully" });
  } catch (error) {
    logger.error("Error in deleting enrollement:", error)
    res.status(500).json({ message: error.message });
  }
};
