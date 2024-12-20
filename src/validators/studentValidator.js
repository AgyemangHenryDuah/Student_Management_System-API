const Joi = require("joi");

const studentBaseSchema = Joi.object({
  studentId: Joi.string(),
  grade: Joi.number().min(1).max(12),
  gpa: Joi.number().min(0).max(4),
  department: Joi.string(),
  email: Joi.string().email(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  password: Joi.string().min(6),
});

const studentSchema = studentBaseSchema.when(Joi.ref("$method"), {
  is: "POST",
  then: Joi.object({
    studentId: Joi.string().required(),
    grade: Joi.number().required().min(1).max(12),
    gpa: Joi.number().required().min(0).max(4),
    department: Joi.string().required(),
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().min(6).required(),
  }),
  otherwise: studentBaseSchema.min(1), // Require at least one field for PUT
});

exports.validateStudent = (student, method) => {
  return studentSchema.validate(student, { context: { method } });
};
