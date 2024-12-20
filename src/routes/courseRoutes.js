const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const cache = require("../middleware/cache");
const courseController = require("../controllers/courseController");

/**
 * @swagger
 * /api/courses:
 *   get:
 *     tags: [Courses]
 *     summary: Get all courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */
router.get("/", auth, cache(300), courseController.getAllCourses);

/**
 * @swagger
 * /api/courses/{courseCode}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *   put:
 *     tags: [Courses]
 *     summary: Update course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *   delete:
 *     tags: [Courses]
 *     summary: Delete course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 */
router.get("/:courseCode", auth, cache(300), courseController.getCourse);
router.put("/:courseCode", auth, authorize("instructor"), courseController.updateCourse);
router.delete("/:courseCode", auth, authorize("instructor"), courseController.deleteCourse);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create new course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.post("/", auth, authorize("instructor"), courseController.createCourse);

/**
 * @swagger
 * /api/courses/sort/courses:
 *   get:
 *     tags: [Courses]
 *     summary: Get sorted courses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: algorithm
 *         schema:
 *           type: string
 *           enum: [quick, merge]
 *         description: Sorting algorithm to use
 *     responses:
 *       200:
 *         description: Sorted list of courses
 */
router.get("/sort/courses", auth, authorize("instructor"), courseController.sortCourses);

module.exports = router;