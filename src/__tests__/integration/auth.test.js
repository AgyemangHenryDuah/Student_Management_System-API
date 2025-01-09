/**
 * Authentication API Test Suite
 * Tests cover: Login, Token Refresh, Password Reset
 * 
 * Test Structure:
 * 1. Setup & Configuration
 * 2. Basic Authentication Flow
 * 3. Token Management
 * 4. Password Management
 * 5. Error Handling & Edge Cases
 */

require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { connectDB } = require('../../config/database');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

describe('Authentication API', () => {
  // ===================================
  // Setup & Teardown
  // ===================================
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // ===================================
  // Test Data Setup
  // ===================================
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'student'
  };

  // ===================================
  // 1. Basic Authentication Flow
  // ===================================
  describe('Login Flow', () => {
    beforeEach(async () => {
      const user = new User(testUser);
      await user.save();
    });

    describe('Successful Login', () => {
      it('should authenticate user with valid credentials and return tokens', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password
          });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          role: testUser.role,
          message: 'Login Successful'
        });
      });
    });

    describe('Login Validation', () => {
      it('should reject empty credentials', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: '',
            password: ''
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
      });

      it('should reject invalid email format', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'invalid-email',
            password: testUser.password
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
      });
    });
  });

  // ===================================
  // 2. Token Management
  // ===================================
  describe('Token Management', () => {
    let validRefreshToken;

    beforeEach(async () => {
      const user = new User(testUser);
      await user.save();

      validRefreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });

    describe('Token Refresh', () => {
      it('should issue new access token with valid refresh token', async () => {
        const res = await request(app)
          .post('/api/auth/refresh-token')
          .send({ refreshToken: validRefreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
      });
    });

    describe('Token Security', () => {
      it('should reject expired refresh tokens', async () => {
        const expiredToken = jwt.sign(
          { id: 'someId', role: 'student' },
          process.env.JWT_SECRET,
          { expiresIn: '0s' }
        );

        const res = await request(app)
          .post('/api/auth/refresh-token')
          .send({ refreshToken: expiredToken });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Invalid or expired refresh token');
      });

      it('should reject malformed tokens', async () => {
        const res = await request(app)
          .post('/api/auth/refresh-token')
          .send({ refreshToken: 'malformed-token' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Invalid or expired refresh token');
      });
    });
  });

  // ===================================
  // 3. Password Management
  // ===================================
  describe('Password Management', () => {
    beforeEach(async () => {
      const user = new User(testUser);
      await user.save();
    });

    describe('Password Reset', () => {
      it('should successfully reset password and issue new tokens', async () => {
        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({
            email: testUser.email,
            password: 'newPassword123'
          });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          message: 'Password reset successful',
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        });
      });
    });

    describe('Password Reset Security', () => {
      it('should prevent reset for non-existent users', async () => {
        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({
            email: 'nonexistent@example.com',
            password: 'newPassword123'
          });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'No user found with this email');
      });

      it('should validate password requirements', async () => {
        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({
            email: testUser.email,
            password: ''  // Invalid password
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
      });
    });
  });
});