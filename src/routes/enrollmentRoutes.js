const express = require('express')
const router = express.Router()
const enrollmentController = require('../controllers/enrollmentController.js')

router.post('/', enrollmentController.enrollStudent)
router.get('/student/:studentId', enrollmentController.getStudentEnrollments)
router.get('/course/:courseId', enrollmentController.getCourseEnrollments)
router.put('/:enrollmentId', enrollmentController.updateEnrollment)
router.delete('/:enrollmentId', enrollmentController.cancelEnrollment)

module.exports = router