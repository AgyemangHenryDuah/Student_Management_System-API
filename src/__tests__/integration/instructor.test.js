/**
 * Instructor API Test Suite
 * 
 * Test Categories:
 * 1. Setup & Authentication
 * 2. Instructor Retrieval (GET operations)
 * 3. Instructor Creation
 * 4. Instructor Updates
 * 5. Instructor Deletion
 * 6. Error Handling & Edge Cases
 */

const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Instructor = require('../../models/Instructor');
const User = require('../../models/User');

describe('Instructor API', () => {
  // ===================================
  // Global Test Setup
  // ===================================
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
    // Create admin user for authentication
    adminUser = await createTestUser(User, 'instructor');
    adminToken = generateToken(adminUser._id);

    // Create test instructor
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

  // ===================================
  // 1. Instructor Retrieval Tests
  // ===================================
  describe('GET Operations', () => {
    describe('GET /api/instructors - List All', () => {
      it('should retrieve all instructors with pagination', async () => {
        const res = await request(app)
          .get('/api/instructors')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('instructors');
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body).toHaveProperty('currentPage');
        expect(Array.isArray(res.body.instructors)).toBe(true);
      });

      it('should filter instructors by department', async () => {
        const res = await request(app)
          .get('/api/instructors?department=Computer Science')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.instructors[0].department).toBe('Computer Science');
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

  // ===================================
  // 2. Instructor Creation Tests
  // ===================================
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
      ]
    };

    describe('Successful Creation', () => {
      it('should create new instructor with valid data', async () => {
        const res = await request(app)
          .post('/api/instructors')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newInstructorData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.instructor).toHaveProperty('department', newInstructorData.department);
      });
    });

    describe('Creation Validation', () => {
      it('should prevent duplicate email registration', async () => {
        // First creation
        await request(app)
          .post('/api/instructors')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newInstructorData);

        // Duplicate attempt
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
  });

  // ===================================
  // 3. Instructor Update Tests
  // ===================================
  describe('PUT /api/instructors/:id', () => {
    describe('Successful Updates', () => {
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

      it('should handle database errors', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
          .put(`/api/instructors/${instructor._id}`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            department: 'New Department'
          });

        expect(res.status).toBe(500);
      });
    });

    describe('Update Validation', () => {
      it('should handle non-existent instructor', async () => {
        const nonExistentId = '507f1f77bcf86cd799439011';
        const res = await request(app)
          .put(`/api/instructors/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Professor' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Instructor not found');
      });

      it('should validate update data', async () => {
        const res = await request(app)
          .put(`/api/instructors/${testInstructor._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: '' });

        expect(res.status).toBe(400);
      });
    });
  });

  // ===================================
  // 4. Instructor Deletion Tests
  // ===================================
  describe('DELETE /api/instructors/:id', () => {
    describe('Successful Deletion', () => {
      it('should delete instructor and associated user', async () => {
        const res = await request(app)
          .delete(`/api/instructors/${testInstructor._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);

        // Verify cascade deletion
        const deletedInstructor = await Instructor.findById(testInstructor._id);
        const deletedUser = await User.findById(testUser._id);

        expect(deletedInstructor).toBeNull();
        expect(deletedUser).toBeNull();
      });
      it('should handle cascade deletion errors', async () => {
        jest.spyOn(Course, 'deleteMany').mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
          .delete(`/api/instructors/${instructor._id}`)
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(500);
      });
    });

    describe('Deletion Validation', () => {
      it('should handle non-existent instructor', async () => {
        const nonExistentId = '507f1f77bcf86cd799439011';
        const res = await request(app)
          .delete(`/api/instructors/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Instructor not found');
      });

      it('should validate instructor ID format', async () => {
        const res = await request(app)
          .delete('/api/instructors/invalidid')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid instructor ID');
      });
    });
  });
});