const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Enrollment = require('../../models/Enrollment');
const Course = require('../../models/Course');
const Student = require('../../models/Student');
const User = require('../../models/User');

describe('Enrollment API', () => {
  let studentToken;
  let instructorToken;
  let student;
  let instructor;
  let course;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test users with unique emails
    const studentUser = await createTestUser(User, 'student');
    const instructorUser = await createTestUser(User, 'instructor');

    student = await Student.create({
      user: studentUser._id,
      studentId: 'STU123',
      grade: 10,
      gpa: 3.5,
      department: 'Computer Science'
    });

    instructor = instructorUser;

    course = await Course.create({
      courseCode: 'CS101',
      title: 'Intro to Programming',
      department: 'Computer Science',
      instructor: instructor._id,
      credits: 3,
      semester: 'Fall 2024',
      capacity: 30
    });

    studentToken = generateToken(studentUser._id);
    instructorToken = generateToken(instructor._id);
  });

  describe('POST /api/enrollments', () => {
    it('should enroll student in course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('student');
      expect(res.body).toHaveProperty('course');
    });

    it('should prevent duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      // Attempt duplicate enrollment
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already enrolled');
    });
  });

  describe('GET /api/enrollments/student/:studentId', () => {
    beforeEach(async () => {
      await Enrollment.create({
        student: student._id,
        course: course._id
      });
    });

    it('should get student enrollments', async () => {
      const res = await request(app)
        .get(`/api/enrollments/student/${student.studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/enrollments/course/:courseId', () => {
    beforeEach(async () => {
      await Enrollment.create({
        student: student._id,
        course: course._id
      });
    });

    it('should get course enrollments with instructor token', async () => {
      const res = await request(app)
        .get(`/api/enrollments/course/${course.courseCode}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('should not allow students to view course enrollments', async () => {
      const res = await request(app)
        .get(`/api/enrollments/course/${course.courseCode}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });
});