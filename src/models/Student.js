const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    grade: {
      type: Number,
      required: true,
    },
    gpa: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
    },
    department: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

studentSchema.index({ studentId: 1, gpa: 1 });

module.exports = mongoose.model("Student", studentSchema);
