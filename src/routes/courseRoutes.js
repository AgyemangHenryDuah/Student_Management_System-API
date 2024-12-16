const express = require('express')
const router = express.Router()

const courseController = require('../controllers/courseController')

router.get('/', courseController.getAllCourses)
router.get('/:courseCode', courseController.getCourse)
router.post('/', courseController.createCourse)
router.put('/:courseCode', courseController.updateCourse)
router.delete('/:courseCode', courseController.deleteCourse)

module.exports = router