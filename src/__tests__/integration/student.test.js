const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Student = require('../../models/Student');
const User = require('../../models/User');


describe('Student API', () => {
  let instructorToken;
  let studentToken;
  let student;
  let instructor;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    try {
      await clearDatabase();
      // Drop indexes to prevent duplicate key errors
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
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  describe('GET /api/students', () => {
    beforeEach(async () => {
      try {
        // Create multiple students for testing pagination and filters
        const students = [];
        for (let i = 0; i < 15; i++) {
          const user = await createTestUser(User, 'student');
          students.push({
            user: user._id,
            studentId: `STU${2000 + i}`, // Changed to prevent conflicts
            grade: i % 3 + 9,
            gpa: 2.0 + (i * 0.1),
            department: i < 7 ? 'Computer Science' : 'Mathematics'
          });
        }
        await Student.insertMany(students);
      } catch (error) {
        console.error('Test data creation error:', error);
        throw error;
      }
    }, 30000)

    it('should paginate results correctly', async () => {
      const res = await request(app)
        .get('/api/students?page=2&limit=5')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.students.length).toBe(5);
      expect(res.body.currentPage).toBe(2);
      expect(res.body.totalPages).toBe(4);
    });

    it('should get all students with instructor token', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.students)).toBe(true);
    });

    it('should filter students by department', async () => {
      const res = await request(app)
        .get('/api/students?department=Computer Science')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.students.length).toBeGreaterThan(0);
      expect(res.body.students[0].department).toBe('Computer Science');
    });

    it('should handle multiple filters', async () => {
      const res = await request(app)
        .get('/api/students?department=Computer Science&grade=9')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.students.every(s =>
        s.department === 'Computer Science' && s.grade === 9
      )).toBe(true);
    });
  });

  describe('GET /api/students/:id', () => {
    it('should get student by id with instructor token', async () => {
      const res = await request(app)
        .get(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(student._id.toString());
    });

    it('should allow student to access their own data', async () => {
      const res = await request(app)
        .get(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(student._id.toString());
    });

    it('should return 404 for non-existent student', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/students/${fakeId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Student not found');
    });

    it('should not allow student to access other student data', async () => {
      const otherStudentUser = await createTestUser(User, 'student');
      const otherStudent = await Student.create({
        user: otherStudentUser._id,
        studentId: 'STU456',
        grade: 11,
        gpa: 3.8,
        department: 'Computer Science'
      });

      const res = await request(app)
        .get(`/api/students/${otherStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/students', () => {
    const newStudent = {
      email: 'new.student@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'Student',
      studentId: 'STU789',
      grade: 9,
      gpa: 3.2,
      department: 'Computer Science'
    };

    it('should create new student with instructor token', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newStudent);

      expect(res.status).toBe(201);
      expect(res.body.student).toHaveProperty('studentId', newStudent.studentId);
    });

    it('should not allow students to create new students', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newStudent);

      expect(res.status).toBe(403);
    });

    it('should reject invalid student data', async () => {
      const invalidStudent = { ...newStudent, gpa: 5.0 }; // Invalid GPA
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidStudent);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/students/:id', () => {
    const updateData = {
      grade: 11,
      gpa: 3.7
    };

    it('should update student with instructor token', async () => {
      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.student.grade).toBe(updateData.grade);
      expect(res.body.student.gpa).toBe(updateData.gpa);
    });

    it('should allow student to update their own data', async () => {
      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.student.grade).toBe(updateData.grade);
    });

    it('should prevent duplicate studentId update', async () => {
      // Create another student first
      const otherStudent = await Student.create({
        user: (await createTestUser(User, 'student'))._id,
        studentId: 'STU999',
        grade: 10,
        gpa: 3.5,
        department: 'Computer Science'
      });

      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ ...updateData, studentId: 'STU999' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Student Id already exists');
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('should delete student with instructor token', async () => {
      const res = await request(app)
        .delete(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Student deleted successfully');

      // Verify student is actually deleted
      const deletedStudent = await Student.findById(student._id);
      expect(deletedStudent).toBeNull();
    });

    it('should return 404 for non-existent student', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/students/${fakeId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Student not found');
    });
  });


  

  
});

