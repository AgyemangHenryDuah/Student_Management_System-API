const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController.js')

// Public routes
router.get('/', studentController.getAllStudents)
router.get('/:id', studentController.getStudent)

// Protected routes
router.post('/', studentController.createStudent)
router.put('/:id', studentController.updateStudent)
router.delete('/:id', studentController.deleteStudent)


router.get('/sort/students', studentController.sortStudents)

module.exports = router