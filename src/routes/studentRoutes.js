const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const cache = require("../middleware/cache");
const studentController = require("../controllers/studentController");


/**
 * @swagger
 * /api/students:
 *   get:
 *     tags: [Students]
 *     summary: Get all students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by student name
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalStudents:
 *                   type: integer
 */
router.get("/", auth, cache(400), studentController.getAllStudents);


/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student by ID
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
 *         description: Student details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *   put:
 *     tags: [Students]
 *     summary: Update student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *   delete:
 *     tags: [Students]
 *     summary: Delete student
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
 *         description: Student deleted successfully
 */
router.get("/:id", auth, studentController.getStudent);


/**
 * @swagger
 * /api/students:
 *   post:
 *     tags: [Students]
 *     summary: Create new student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.post("/", auth, authorize("instructor"), studentController.createStudent);

router.put("/:id", auth, studentController.updateStudent);

router.delete("/:id", auth, authorize("instructor"), studentController.deleteStudent);


/**
 * @swagger
 * /api/students/sort/students:
 *   get:
 *     tags: [Students]
 *     summary: Get sorted students
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
 *         description: Sorted list of students
 */
router.get("/sort/students", auth, authorize("instructor"), studentController.sortStudents);

module.exports = router;
