const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Instructor = require('../../models/Instructor');
const User = require('../../models/User');

describe('Instructor Routes', () => {
  let adminInstructorToken;
  let instructor;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create admin instructor with unique email
    const adminUser = await createTestUser(User, 'instructor');
    adminInstructorToken = generateToken(adminUser._id);

    // Create test instructor
    const instructorUser = await createTestUser(User, 'instructor');
    instructor = await Instructor.create({
      user: instructorUser._id,
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

  describe('GET /api/instructors', () => {
    it('should get all instructors', async () => {
      const res = await request(app)
        .get('/api/instructors')
        .set('Authorization', `Bearer ${adminInstructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('instructors');
      expect(Array.isArray(res.body.instructors)).toBe(true);
    });

    it('should filter instructors by department', async () => {
      const res = await request(app)
        .get('/api/instructors?department=Computer Science')
        .set('Authorization', `Bearer ${adminInstructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.instructors.length).toBeGreaterThan(0);
      expect(res.body.instructors[0].department).toBe('Computer Science');
    });
  });

  describe('PUT /api/instructors/:id', () => {
    it('should update instructor details', async () => {
      const res = await request(app)
        .put(`/api/instructors/${instructor._id}`)
        .set('Authorization', `Bearer ${adminInstructorToken}`)
        .send({
          title: 'Associate Professor',
          specialization: 'Machine Learning'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', 'Associate Professor');
      expect(res.body).toHaveProperty('specialization', 'Machine Learning');
    });
  });
}, 30000); // Increase timeout to 30 seconds



describe('Instructor Controller Additional Tests', () => {
  let adminToken;
  let adminUser;

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
  });

  describe('getAllInstructors edge cases', () => {
    it('should handle invalid pagination parameters', async () => {
      const res = await request(app)
        .get('/api/instructors?page=-1&limit=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid pagination parameters');
    });

    it('should filter by multiple criteria', async () => {
      await Instructor.create({
        user: adminUser._id,
        department: 'Computer Science',
        title: 'Professor',
        specialization: 'AI'
      });

      const res = await request(app)
        .get('/api/instructors?department=Computer Science&title=Professor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.instructors.length).toBe(1);
    });
  });

  describe('createInstructor validation and edge cases', () => {
    const newInstructor = {
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

    it('should handle duplicate email registration', async () => {
      // First create an instructor
      await request(app)
        .post('/api/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newInstructor);

      // Try to create another with same email
      const res = await request(app)
        .post('/api/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newInstructor);

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

    it('should handle database errors during creation', async () => {
      jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .post('/api/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newInstructor);

      expect(res.status).toBe(500);
    });
  });

  describe('updateInstructor edge cases', () => {
    let instructor;

    beforeEach(async () => {
      const user = await createTestUser(User, 'instructor');
      instructor = await Instructor.create({
        user: user._id,
        department: 'Computer Science',
        title: 'Professor',
        specialization: 'Software Engineering'
      });
    });

    it('should handle non-existent instructor update', async () => {

      const nonExistentId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .put(`/api/instructors/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Professor'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Instructor not found")
    });

    it('should validate update data', async () => {
      const res = await request(app)
        .put(`/api/instructors/${instructor._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '' // Invalid empty title
        });

      expect(res.status).toBe(400);
    });
  });

  describe('deleteInstructor edge cases', () => {
    let instructor;
    let instructorUser;

    beforeEach(async () => {
      instructorUser = await createTestUser(User, 'instructor');
      instructor = await Instructor.create({
        user: instructorUser._id,
        department: 'Computer Science',
        title: 'Professor',
        specialization: 'Software Engineering'
      });
    });

    it('should handle non-existent instructor deletion', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .delete(`/api/instructors/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Instructor not found")
    });
    
    it('should handle invalid instructor ID format', async () => {
      const res = await request(app)
        .delete('/api/instructors/invalidid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid instructor ID');
    });

    it('should handle database errors during user deletion', async () => {
      jest.spyOn(User, 'findByIdAndDelete').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .delete(`/api/instructors/${instructor._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });

    it('should successfully delete both instructor and user records', async () => {
      const res = await request(app)
        .delete(`/api/instructors/${instructor._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify both records are deleted
      const deletedInstructor = await Instructor.findById(instructor._id);
      const deletedUser = await User.findById(instructorUser._id);

      expect(deletedInstructor).toBeNull();
      expect(deletedUser).toBeNull();
    });
  });
});