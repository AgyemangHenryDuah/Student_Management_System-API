const Joi = require("joi");

const courseBaseSchema = Joi.object({
  courseCode: Joi.string(),
  credits: Joi.number().min(1).max(6),
  semester: Joi.string(),
  capacity: Joi.number().min(1),
  title: Joi.string(),
  description: Joi.string(),
  duration: Joi.number().positive(),
  category: Joi.string(),
  department: Joi.string(),
});

const courseSchema = courseBaseSchema.when(Joi.ref("$method"), {
  is: "POST",
  then: Joi.object({
    courseCode: Joi.string().required(),
    credits: Joi.number().required().min(1).max(6),
    semester: Joi.string().required(),
    capacity: Joi.number().required().min(1),
    title: Joi.string().required(),
    description: Joi.string().required(),
    duration: Joi.number().required().positive(),
    category: Joi.string().optional(),
    department: Joi.string().required(),
  }),
  otherwise: courseBaseSchema.min(1),
});

exports.validateCourse = (course, method) => {
  return courseSchema.validate(course, { context: { method } });
};
