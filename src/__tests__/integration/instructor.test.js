const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Instructor = require('../../models/Instructor');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('Instructor API', () => {
  let adminToken;
  let adminUser;
  let testInstructor;
  let testUser;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    adminUser = await createTestUser(User, 'instructor');
    adminToken = generateToken(adminUser._id);

    testUser = await createTestUser(User, 'instructor');
    testInstructor = await Instructor.create({
      user: testUser._id,
      department: 'Computer Science',
      title: 'Professor',
      specialization: 'Software Engineering',
      officeHours: [{
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00'
      }]
    });
  });

  describe('GET Operations', () => {
    describe('GET /api/instructors', () => {
      it('should retrieve all instructors with pagination', async () => {
        const res = await request(app)
          .get('/api/instructors')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('instructors');
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body).toHaveProperty('currentPage');
        expect(res.body).toHaveProperty('totalInstructors');
        expect(Array.isArray(res.body.instructors)).toBe(true);
      });

      it('should filter instructors by department', async () => {
        const res = await request(app)
          .get('/api/instructors?department=Computer Science')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.instructors[0].department).toBe('Computer Science');
      });

      it('should filter instructors by title', async () => {
        const res = await request(app)
          .get('/api/instructors?title=Professor')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.instructors[0].title).toBe('Professor');
      });

      it('should handle invalid pagination parameters', async () => {
        const res = await request(app)
          .get('/api/instructors?page=-1&limit=invalid')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid pagination parameters');
      });
    });
  });

  describe('POST /api/instructors', () => {
    const newInstructorData = {
      email: 'new.instructor@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'Instructor',
      department: 'Computer Science',
      title: 'Assistant Professor',
      specialization: 'Machine Learning',
      officeHours: [
        { day: 'Monday', startTime: '09:00', endTime: '11:00' }
      ],
      publications: []
    };

    it('should create new instructor with valid data', async () => {
      const res = await request(app)
        .post('/api/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newInstructorData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.instructor).toHaveProperty('department', newInstructorData.department);
      expect(res.body.message).toBe('Instructor registered succefully');
    });

    it('should prevent duplicate email registration', async () => {
      await request(app)
        .post('/api/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newInstructorData);

      const res = await request(app)
        .post('/api/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newInstructorData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email is already in use');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'incomplete@test.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/instructors/:id', () => {
    it('should update instructor details', async () => {
      const res = await request(app)
        .put(`/api/instructors/${testInstructor._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Associate Professor',
          specialization: 'Machine Learning'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', 'Associate Professor');
      expect(res.body).toHaveProperty('specialization', 'Machine Learning');
    });

    it('should handle invalid instructor ID format', async () => {
      const res = await request(app)
        .put('/api/instructors/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Professor' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid instructor ID');
    });

    it('should handle non-existent instructor', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/instructors/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Professor' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Instructor not found');
    });
  });

  describe('DELETE /api/instructors/:id', () => {
    it('should delete instructor and associated user', async () => {
      const res = await request(app)
        .delete(`/api/instructors/${testInstructor._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Instructor profile deleted successfully');

      const deletedInstructor = await Instructor.findById(testInstructor._id);
      const deletedUser = await User.findById(testUser._id);

      expect(deletedInstructor).toBeNull();
      expect(deletedUser).toBeNull();
    });

    it('should handle invalid instructor ID format', async () => {
      const res = await request(app)
        .delete('/api/instructors/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid instructor ID');
    });

    it('should handle non-existent instructor', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/instructors/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Instructor not found');
    });
  });
});