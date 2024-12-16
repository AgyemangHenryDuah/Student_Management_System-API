const { json } = require("express");

exports.getAllStudents = async (req, res) => {
    res.send(json({"Message": "Get all students"}))
  
}

exports.getStudent = async (req, res) => {
    res.send(json({ Message: "Get one student" }));
};

exports.createStudent = async (req, res) => {
  res.send(json({ Message: "Create student" }));
}

exports.updateStudent = async (req, res) => {
  res.send(json({ Message: "Update one student" }));
};

exports.deleteStudent = async (req, res) => {
  res.send(json({ Message: "Delete one student" }));
};

exports.sortStudents = async (req, res) => {
    res.send(json({ Message: "Sort students one student" }));
}
