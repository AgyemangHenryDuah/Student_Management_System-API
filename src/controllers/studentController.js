const { json } = require("express")
exports.getAllStudents = async (req, res) => {
  res.json({ Message: "Get all students" })
}

exports.getStudent = async (req, res) => {
  res.json({ Message: "Get one student" })
}

exports.createStudent = async (req, res) => {
  res.json({ Message: "Create student" })
}

exports.updateStudent = async (req, res) => {
  res.json({ Message: "Update one student" })
}

exports.deleteStudent = async (req, res) => {
  res.json({ Message: "Delete one student" })
}

exports.sortStudents = async (req, res) => {
  res.json({ Message: "Sort students" })
}
