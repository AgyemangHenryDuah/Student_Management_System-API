const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const errorHandler = require("./middleware/errorHandler");
const swaggerDocs = require("./swagger/swaggerDefinitions");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const instructorRoutes = require("./routes/instructorRoutes");

const app = express();

app.use(helmet());
app.use(cors("*"));
app.use(express.json());
app.use(morgan("dev"));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/instructors", instructorRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

app.use(errorHandler);

module.exports = app;