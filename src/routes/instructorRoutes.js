const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const instructorController = require("../controllers/instructorController");

/**
 * @swagger
 * /api/instructors:
 *   get:
 *     tags: [Instructors]
 *     summary: Get all instructors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by title
 *     responses:
 *       200:
 *         description: List of instructors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 instructors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Instructor'
 *   post:
 *     tags: [Instructors]
 *     summary: Create new instructor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Instructor'
 *     responses:
 *       201:
 *         description: Instructor created successfully
 */
router.get("/", auth,authorize("instructor"), instructorController.getAllInstructors);
router.post("/", auth, authorize("instructor"), instructorController.createInstructor);

/**
 * @swagger
 * /api/instructors/{id}:
 *   get:
 *     tags: [Instructors]
 *     summary: Get instructor by ID
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
 *         description: Instructor details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Instructor'
 *   put:
 *     tags: [Instructors]
 *     summary: Update instructor
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
 *             $ref: '#/components/schemas/Instructor'
 *     responses:
 *       200:
 *         description: Instructor updated successfully
 *   delete:
 *     tags: [Instructors]
 *     summary: Delete instructor
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
 *         description: Instructor deleted successfully
 */
router.get("/:id", auth, instructorController.getInstructor);
router.put("/:id", auth, authorize("instructor"), instructorController.updateInstructor);
router.delete("/:id", auth, authorize("instructor"), instructorController.deleteInstructor);

module.exports = router;