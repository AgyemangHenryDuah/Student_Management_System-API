const mongoose = require("mongoose");

const instructorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      enum: [
        "Professor",
        "Associate Professor",
        "Assistant Professor",
        "Lecturer",
      ],
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    officeHours: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
      },
    ],
    publications: [
      {
        title: String,
        year: Number,
        journal: String,
      },
    ],
  },
  { timestamps: true }
);

instructorSchema.index({ department: 1, title: 1 });

module.exports = mongoose.model("Instructor", instructorSchema);
