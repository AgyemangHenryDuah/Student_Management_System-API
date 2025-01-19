const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Student = require('../../models/Student');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('Student API', () => {
  let instructorToken, studentToken, student, instructor;
  jest.setTimeout(30000);

  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());

  beforeEach(async () => {
    await clearDatabase();
    await Student.collection.dropIndexes();

    instructor = await createTestUser(User, 'instructor');
    const studentUser = await createTestUser(User, 'student');

    student = await Student.create({
      user: studentUser._id,
      studentId: 'STU123',
      grade: 10,
      gpa: 3.5,
      department: 'Computer Science'
    });

    instructorToken = generateToken(instructor._id);
    studentToken = generateToken(studentUser._id);
  });

  describe('Student Retrieval', () => {
    beforeEach(async () => {
      const userData = Array.from({ length: 15 }, (_, i) => ({
        email: `student${i}@test.com`,
        password: 'password123',
        firstName: `Test${i}`,
        lastName: `Student${i}`,
        role: 'student'
      }));

      const users = await User.insertMany(userData);

      const studentData = users.map((user, i) => ({
        user: user._id,
        studentId: `STU${2000 + i}`,
        grade: i % 3 + 9,
        gpa: 2.0 + (i * 0.1),
        department: i < 7 ? 'Computer Science' : 'Mathematics'
      }));

      await Student.insertMany(studentData);
    });

    describe('GET /api/students', () => {
      it('should implement pagination correctly', async () => {
        const res = await request(app)
          .get('/api/students?page=2&limit=5')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          students: expect.any(Array),
          currentPage: 2,
          totalPages: expect.any(Number),
          totalStudents: expect.any(Number)
        });
        expect(res.body.students).toHaveLength(5);
      });

      it('should filter by name search', async () => {
        // Create a specific user for testing name search
        const specificUser = await User.create({
          email: 'specific@test.com',
          password: 'password123',
          firstName: 'SearchTest',
          lastName: 'SearchUser',
          role: 'student'
        });

        await Student.create({
          user: specificUser._id,
          studentId: 'STU_SEARCH',
          grade: 10,
          gpa: 3.5,
          department: 'Computer Science'
        });

        const res = await request(app)
          .get('/api/students?name=SearchTest')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        const hasMatch = res.body.students.some(s =>
          s.user && (s.user.firstName === 'SearchTest' || s.user.lastName === 'SearchUser')
        );
        expect(hasMatch).toBe(true);
      });

      it('should sort students by field', async () => {
        const res = await request(app)
          .get('/api/students?sort=gpa')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        const gpas = res.body.students.map(s => s.gpa);
        expect(gpas).toEqual([...gpas].sort((a, b) => a - b));
      });
    });

    describe('GET /api/students/:id', () => {
      it('should allow instructor access to any student', async () => {
        const res = await request(app)
          .get(`/api/students/${student._id}`)
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('studentId', student.studentId);
      });

      it('should allow student access to their own record', async () => {
        const res = await request(app)
          .get(`/api/students/${student._id}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('studentId', student.studentId);
      });

      it('should deny student access to other student records', async () => {
        const otherStudentUser = await User.create({
          email: 'other@test.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'Student',
          role: 'student'
        });

        const otherStudent = await Student.create({
          user: otherStudentUser._id,
          studentId: 'STU456',
          grade: 11,
          gpa: 3.0, // Added required gpa field
          department: 'Mathematics'
        });

        const res = await request(app)
          .get(`/api/students/${otherStudent._id}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Access denied');
      });
    });
  });

  describe('Student Management', () => {
    describe('POST /api/students', () => {
      const validStudent = {
        email: 'new.student@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Student',
        studentId: 'STU789',
        grade: 9,
        gpa: 3.2,
        department: 'Computer Science'
      };

      it('should create student and return tokens', async () => {
        const res = await request(app)
          .post('/api/students')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send(validStudent);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
          message: 'Student created succefully',
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          student: expect.objectContaining({
            studentId: validStudent.studentId
          })
        });
      });
    });

    describe('PUT /api/students/:id', () => {
      it('should update both student and user information', async () => {
        const updates = {
          studentId: 'STU999',
          grade: 11,
          gpa: 3.7,
          department: 'Mathematics',
          email: 'updated@test.com',
          firstName: 'Updated',
          lastName: 'Name'
        };

        const res = await request(app)
          .put(`/api/students/${student._id}`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send(updates);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Student Updated Succesfully');
        expect(res.body.student).toMatchObject({
          studentId: updates.studentId,
          grade: updates.grade,
          gpa: updates.gpa,
          department: updates.department
        });
      });
    });
  });

  describe('GET /api/students/sort', () => {
    beforeEach(async () => {
      // Create test data for sorting
      const users = await User.insertMany([
        { email: 'test1@test.com', password: 'pass123', firstName: 'Test1', lastName: 'User1', role: 'student' },
        { email: 'test2@test.com', password: 'pass123', firstName: 'Test2', lastName: 'User2', role: 'student' }
      ]);

      await Student.insertMany([
        { user: users[0]._id, studentId: 'S001', grade: 10, gpa: 3.5, department: 'CS' },
        { user: users[1]._id, studentId: 'S002', grade: 9, gpa: 3.8, department: 'CS' }
      ]);
    });

    it('should require sorting field', async () => {
      const res = await request(app)
        .get('/api/students/sort/students')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Sorting field is required');
    });

    it('should sort by gpa using default algorithm', async () => {
      const res = await request(app)
        .get('/api/students/sort/students?field=gpa')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should sort by grade using merge algorithm', async () => {
      const res = await request(app)
        .get('/api/students/sort/students?field=grade&algorithm=merge')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});