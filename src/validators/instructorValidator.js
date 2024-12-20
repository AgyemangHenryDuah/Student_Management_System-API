const Joi = require("joi");

const instructorBaseSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  department: Joi.string(),
  title: Joi.string().valid(
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Lecturer"
  ),
  specialization: Joi.string(),
  officeHours: Joi.array().items(
    Joi.object({
      day: Joi.string()
        .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
        .required(),
      startTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
      endTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
    })
  ),
  publications: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      year: Joi.number().integer().min(1900).max(new Date().getFullYear()),
      journal: Joi.string(),
    })
  ),
});

const instructorSchema = instructorBaseSchema.when(Joi.ref("$method"), {
  is: "POST",
  then: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    department: Joi.string().required(),
    title: Joi.string()
      .valid(
        "Professor",
        "Associate Professor",
        "Assistant Professor",
        "Lecturer"
      )
      .required(),
    specialization: Joi.string().required(),
    officeHours: Joi.array().items(
      Joi.object({
        day: Joi.string()
          .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
          .required(),
        startTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        endTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
      })
    ),
    publications: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        year: Joi.number().integer().min(1900).max(new Date().getFullYear()),
        journal: Joi.string(),
      })
    ),
  }),
  otherwise: instructorBaseSchema.min(1),
});

exports.validateInstructor = (instructor, method) => {
  return instructorSchema.validate(instructor, { context: { method } });
};
