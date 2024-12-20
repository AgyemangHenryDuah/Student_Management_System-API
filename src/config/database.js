const mongoose = require("mongoose");
const logger = require("./logger")

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB Database Connected successfully")
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
