const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Student = require('../../models/Student');
const User = require('../../models/User');

describe('Student API', () => {
  let instructorToken, studentToken, student, instructor;
  jest.setTimeout(30000)


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

  describe('Authentication & Authorization', () => {
    it('should reject requests without authorization token', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
    });

    it('should reject student access to instructor-only endpoints', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});
      expect(res.status).toBe(403);
    });
  });

  describe('Student Retrieval', () => {
    
    beforeEach(async () => {

      const userData = Array.from({ length: 15 }, (_, i) => ({
        email: `student${i}@test.com`,
        password: 'password123',
        firstName: 'Test',
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
          totalPages: 4,
          totalStudents: expect.any(Number)
        });
        expect(res.body.students).toHaveLength(5);
      });

      it('should filter by multiple criteria', async () => {
        const res = await request(app)
          .get('/api/students?department=Computer Science&grade=9')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.students.every(s =>
          s.department === 'Computer Science' && s.grade === 9
        )).toBe(true);
      });

      it('should handle name search case-insensitively', async () => {
        const res = await request(app)
          .get('/api/students?name=JOHN')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/students/:id', () => {
      it('should enforce student access restrictions', async () => {
        const otherStudentUser = await createTestUser(User, 'student');
        const otherStudent = await Student.create({
          user: otherStudentUser._id,
          studentId: 'STU456',
          grade: 11,
          gpa: 3.8,
          department: 'Mathematics'
        });

        const res = await request(app)
          .get(`/api/students/${otherStudent._id}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });

      it('should handle non-existent students', async () => {
        const res = await request(app)
          .get('/api/students/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(404);
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

      it('should validate student data', async () => {
        const invalidStudent = { ...validStudent, gpa: 5.0 };
        const res = await request(app)
          .post('/api/students')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send(invalidStudent);

        expect(res.status).toBe(400);
      });

      it('should create student with valid data', async () => {
        const res = await request(app)
          .post('/api/students')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send(validStudent);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
          message: expect.any(String),
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          student: expect.objectContaining({
            studentId: validStudent.studentId
          })
        });
      });
    });

    describe('PUT /api/students/:id', () => {
      it('should prevent duplicate studentId updates', async () => {
        const otherStudentUser = await createTestUser(User, 'student');
        await Student.create({
          user: otherStudentUser._id,
          studentId: 'STU999',
          grade: 10,
          gpa: 3.5,
          department: 'Computer Science'
        });

        const res = await request(app)
          .put(`/api/students/${student._id}`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            studentId: 'STU999',
            grade: 10,
            gpa: 3.5,
            department: 'Computer Science',
            email: 'test@test.com',
            firstName: 'Test',
            lastName: 'User'
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Student Id already exists');
      });

      it('should update authorized fields', async () => {
        const updates = {
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
        expect(res.body.student).toMatchObject({
          grade: updates.grade,
          gpa: updates.gpa
        });
      });

      it('should prevent user update errors', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(new Error('Database error'));


        const res = await request(app)
          .put(`/api/students/${student._id}`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            email: 'new@test.com',
            firstName: 'New',
            lastName: 'Name'
          });
        
        expect(res.status).toBe(500);
      });

      it('should handle invalid ObjectId', async () => {
        const res = await request(app)
          .put('/api/students/invalid-id')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({ grade: 11 });

        expect(res.status).toBe(400);
      });
    });
      
      

    describe('DELETE /api/students/:id', () => {
      it('should remove both student and user records', async () => {
        const res = await request(app)
          .delete(`/api/students/${student._id}`)
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);

        const [deletedStudent, deletedUser] = await Promise.all([
          Student.findById(student._id),
          User.findById(student.user)
        ]);

        expect(deletedStudent).toBeNull();
        expect(deletedUser).toBeNull();
      });

      it('should handle user deletion errors', async () => {
        jest.spyOn(User, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
          .delete(`/api/students/${student._id}`)
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(500);
      });
    });

  });
});