const { json } = require("express");

exports.enrollStudent = async (req, res) => {
  res.json({ Message: "Enroll Student" });
};

exports.getStudentEnrollments = async (req, res) => {
  res.json({ Message: "get Student Enrollments" });
};

exports.getCourseEnrollments = async (req, res) => {
  res.json({ Message: "Get  Course Enrollment" });
};

exports.updateEnrollment = async (req, res) => {
  res.json({ Message: "Update Course Enrollment" });
};

exports.cancelEnrollment = async (req, res) => {
  res.json({ Message: "Delete Course Enrollment" });
};
