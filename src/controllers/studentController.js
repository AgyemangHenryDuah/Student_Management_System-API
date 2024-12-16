const { json } = require("express");

// Get all students with filtering, sorting, and pagination
exports.getAllStudents = async (req, res) => {
    res.send(json({"Message": "Get all students"}))
  
}

// Get single student by ID
exports.getStudent = async (req, res) => {
    res.send(json({ Message: "Get one student" }));
};

// Create new student
exports.createStudent = async (req, res) => {
  res.send(json({ Message: "Create student" }));
}

// Update student
exports.updateStudent = async (req, res) => {
  res.send(json({ Message: "Update one student" }));
};

// Delete student
exports.deleteStudent = async (req, res) => {
  res.send(json({ Message: "Delete one student" }));
};

// Sort students by specific criteria
exports.sortStudents = async (req, res) => {
    res.send(json({ Message: "Sort students one student" }));
}
