const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    credits: {
      type: Number,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

courseSchema.index({ courseCode: 1, department: 1 });

module.exports = mongoose.model("Course", courseSchema);
