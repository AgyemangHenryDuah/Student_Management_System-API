const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const cache = require("../middleware/cache");
const enrollmentController = require("../controllers/enrollmentController");


/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     tags: [Enrollments]
 *     summary: Enroll student in a course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - courseCode
 *             properties:
 *               studentId:
 *                 type: string
 *               courseCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enrollment successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 */
router.post("/", auth, enrollmentController.enrollStudent);


/**
 * @swagger
 * /api/enrollments/student/{studentId}:
 *   get:
 *     tags: [Enrollments]
 *     summary: Get student enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of student enrollments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Enrollment'
 */
router.get("/student/:studentId", auth, enrollmentController.getStudentEnrollments);


/**
 * @swagger
 * /api/enrollments/course/{courseId}:
 *   get:
 *     tags: [Enrollments]
 *     summary: Get course enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of course enrollments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Enrollment'
 */
router.get("/course/:courseId", auth, authorize("instructor"), enrollmentController.getCourseEnrollments);


/**
 * @swagger
 * /api/enrollments/{id}:
 *   delete:
 *     tags: [Enrollments]
 *     summary: Cancel enrollment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment cancelled successfully
 */
router.delete("/:id", auth, enrollmentController.cancelEnrollment);

module.exports = router;
