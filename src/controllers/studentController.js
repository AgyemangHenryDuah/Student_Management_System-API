const Student = require("../models/Student");
const User = require("../models/User");
const { validateStudent } = require("../validators/studentValidator");
const { quickSort, mergeSort } = require("../utils/sortingAlgorithms");
const logger = require("../config/logger");
const jwt = require("jsonwebtoken");


exports.getAllStudents = async (req, res) => {
  try {
    const { name, grade, department, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    
    if (name) {
      const nameRegex = new RegExp(name, "i");
      query["$or"] = [
        { "user.firstName": nameRegex },
        { "user.lastName": nameRegex },
      ];
    }
    if (grade) query.grade = grade;
    if (department) query.department = department;


    const students = await Student.find(query)
      .populate("user", "firstName lastName email")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Student.countDocuments(query);

    
    if (sort) {
      const sortField = sort.startsWith("-") ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith("-") ? -1 : 1;
      students.sort((a, b) => (a[sortField] - b[sortField]) * sortOrder);
    }

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalStudents: total,
    });
  } catch (error) {
    logger.error("Error in getAllStudents:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "user",
      "firstName lastName email"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if user has permission to view this student
    if (
      req.user.role !== "instructor" &&
      req.user._id.toString() !== student.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(student);
  } catch (error) {
    logger.error("Error in getStudent:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.createStudent = async (req, res) => {
  try {
    const { error } = validateStudent(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = new User({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: "student",
    });

    await user.save();

    const student = new Student({
      user: user._id,
      studentId: req.body.studentId,
      grade: req.body.grade,
      gpa: req.body.gpa,
      department: req.body.department,
    });

    await student.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const populatedStudent = await Student.findById(student._id).populate(
      "user",
      "firstName lastName email"
    );

    res.status(201).json({
      message: "Student created succefully",
      token,
      student: populatedStudent,
    });
  } catch (error) {
    logger.error("Error in creating Student:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { error } = validateStudent(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const student = await Student.findById(req.params.id).populate("user");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (
      req.user.role !== "instructor" &&
      req.user._id.toString() !== student.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const studentUpdates = {};
    const userUpdates = {};

    const { studentId, grade, gpa, department, email, firstName, lastName } =
      req.body;

    if (studentId && studentId !== student.studentId) {
      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: "Student Id already exists" });
      }

      studentUpdates.studentId = studentId;
    }

    studentUpdates.grade = grade;
    studentUpdates.gpa = gpa;
    studentUpdates.department = department;

    userUpdates.email = email;
    userUpdates.firstName = firstName;
    userUpdates.lastName = lastName;

    if (Object.keys(studentUpdates).length > 0) {
      await Student.findByIdAndUpdate(student._id, studentUpdates, {
        new: true,
      });
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(student.user._id, userUpdates, {
        new: true,
      });
    }

    const updatedStudent = await Student.findById(student._id).populate(
      "user",
      "firstName lastName email"
    );

    res.json({
      message: "Student Updated Succesfully",
      student: updatedStudent,
    });
  } catch (error) {
    logger.error("Error in updating Student:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log(req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = student.user._id;

    await User.findByIdAndDelete(userId);

    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteStudent:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.sortStudents = async (req, res) => {
  try {
    const { field, algorithm = "quick" } = req.query;

    if (!field) {
      return res.status(400).json({ message: "Sorting field is required" });
    }

    const students = await Student.find()
      .populate("user", "firstName lastName email")
      .lean();

    const sortedStudents =
      algorithm === "merge"
        ? mergeSort(students, field)
        : quickSort(students, field);

    res.json({
      field,
      algorithm,
      data: sortedStudents,
    });
  } catch (error) {
    logger.error("Error in sortStudents:", error);
    res.status(500).json({ message: error.message });
  }
};
