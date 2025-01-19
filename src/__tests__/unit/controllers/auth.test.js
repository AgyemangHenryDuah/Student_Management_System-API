const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const User = require('../../../models/User');

jest.mock('jsonwebtoken');
jest.mock('../../../models/User');

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        const mockUser = {
            _id: 'mock-user-id',
            email: 'test@example.com',
            role: 'user',
            comparePassword: jest.fn(),
        };

        const loginPayload = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should login successfully with valid credentials', async () => {
            // Mock both password comparison calls to return true
            mockUser.comparePassword
                .mockResolvedValueOnce(true)  // First call
                .mockResolvedValueOnce(true); // Second call for isValidPassword
            User.findOne.mockResolvedValueOnce(mockUser);
            jwt.sign
                .mockReturnValueOnce('mock-access-token')
                .mockReturnValueOnce('mock-refresh-token');

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                role: 'user',
                message: 'Login Successful',
            });

            expect(User.findOne).toHaveBeenCalledWith({ email: loginPayload.email });
            expect(mockUser.comparePassword).toHaveBeenCalledTimes(2);
            expect(mockUser.comparePassword).toHaveBeenCalledWith(loginPayload.password);
        });

        it('should return 401 with invalid credentials', async () => {
            User.findOne.mockResolvedValueOnce(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                message: 'Invalid credentials',
            });
        });

        it('should return 401 with invalid password', async () => {
            mockUser.comparePassword.mockResolvedValueOnce(false);
            User.findOne.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                message: 'Invalid credentials',
            });
        });

        it('should return 400 when validation fails', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBeDefined();
        });

        it('should return 500 when server error occurs', async () => {
            User.findOne.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
            });
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        const refreshTokenPayload = {
            refreshToken: 'valid-refresh-token'
        };

        it('should generate new access token with valid refresh token', async () => {
            jwt.verify.mockReturnValueOnce({ id: 'user-id', role: 'user' });
            jwt.sign.mockReturnValueOnce('mock-access-token');

            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send(refreshTokenPayload);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                accessToken: 'mock-access-token'
            });
        });

        it('should return 401 with invalid refresh token', async () => {
            jwt.verify.mockImplementationOnce(() => {
                throw new Error('Invalid token');
            });

            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send(refreshTokenPayload);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                message: 'Invalid or expired refresh token'
            });
        });

        it('should return 400 when refresh token is missing', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBeDefined();
        });
    });

    describe('POST /api/auth/reset-password', () => {
        const resetPayload = {
            email: 'test@example.com',
            password: 'newpassword123'
        };

        const mockUser = {
            _id: 'mock-user-id',
            email: 'test@example.com',
            role: 'user',
            save: jest.fn(),
        };

        it('should successfully reset password', async () => {
            User.findOne.mockResolvedValueOnce(mockUser);
            mockUser.save.mockResolvedValueOnce(mockUser);
            jwt.sign
                .mockReturnValueOnce('mock-access-token')  // For access token
                .mockReturnValueOnce('mock-refresh-token'); // For refresh token

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send(resetPayload);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Password reset successful',
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token'
            });

            expect(User.findOne).toHaveBeenCalledWith({ email: resetPayload.email });
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should return 404 when user not found', async () => {
            User.findOne.mockResolvedValueOnce(null);

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send(resetPayload);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'No user found with this email'
            });
        });

        it('should return 400 when validation fails', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBeDefined();
        });

        it('should return 500 when server error occurs', async () => {
            User.findOne.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send(resetPayload);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Error resetting password',
                error: 'Database error'
            });
        });
    });
});