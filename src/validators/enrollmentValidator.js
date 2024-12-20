const Joi = require("joi");

const enrollmentBaseSchema = Joi.object({
  studentId: Joi.string(),
  courseCode: Joi.string(),
  grade: Joi.string().valid("A", "B", "C", "D", "F", "IP"),
});

const enrollmentSchema = enrollmentBaseSchema.when(Joi.ref("$method"), {
  is: "POST",
  then: Joi.object({
    studentId: Joi.string().required(),
    courseCode: Joi.string().required(),
    grade: Joi.string().valid("A", "B", "C", "D", "F", "IP").optional(),
  }),
  otherwise: enrollmentBaseSchema.min(1),
});

exports.validateEnrollment = (enrollment, method) => {
  return enrollmentSchema.validate(enrollment, { context: { method } });
};
