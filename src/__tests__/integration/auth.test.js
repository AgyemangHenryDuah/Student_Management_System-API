require('dotenv').config();

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { connectDB } = require('../../config/database');
const mongoose = require('mongoose');

describe('Auth API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      });
      await user.save();
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('role', 'student');
      expect(res.body).toHaveProperty('message', 'Login Successful');
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 501 as feature is under construction', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'test@example.com'
        });

      expect(res.status).toBe(501);
      expect(res.body).toHaveProperty('message', 'Under Construction');
    });
  });
});