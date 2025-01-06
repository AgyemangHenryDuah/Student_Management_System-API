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
            mockUser.comparePassword.mockResolvedValueOnce(true);
            User.findOne.mockResolvedValueOnce(mockUser);
            jwt.sign.mockReturnValueOnce('mock-token');

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                token: 'mock-token',
                role: 'user',
                message: 'Login Successful',
            });

            expect(User.findOne).toHaveBeenCalledWith({ email: loginPayload.email });
            expect(mockUser.comparePassword).toHaveBeenCalledWith(loginPayload.password);
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
        });

        it('should return 401 with invalid email', async () => {
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

        it('should return 500 when database error occurs', async () => {
            User.findOne.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
            });
        });

        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Email is required',
            });
        });

        it('should return 400 when password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Password is required',
            });
        });

        it('should return 400 when email is invalid format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Invalid email format',
            });
        });

        it('should return 400 when request body is empty', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Email and password are required',
            });
        });

        it('should handle token generation failure', async () => {
            mockUser.comparePassword.mockResolvedValueOnce(true);
            User.findOne.mockResolvedValueOnce(mockUser);
            jwt.sign.mockImplementationOnce(() => {
                throw new Error('Token generation failed');
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Token generation failed',
            });
        });

        it('should return 400 when password is too short', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Password must be at least 6 characters',
            });
        });

        it('should handle comparePassword throwing an error', async () => {
            mockUser.comparePassword.mockRejectedValueOnce(new Error('Password comparison failed'));
            User.findOne.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginPayload);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Password comparison failed',
            });
        });


    });

    describe('POST /api/auth/reset-password', () => {

        it('should return 400 when email is missing for reset password', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Email is required',
            });
        });

        it('should return 400 when email format is invalid for reset password', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: 'invalid-email' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Invalid email format',
            });
        });
    });
});





// const request = require('supertest');
// const jwt = require('jsonwebtoken');
// const app = require('../../../app');
// const User = require('../../../models/User');

// // Mock JWT and User model
// jest.mock('jsonwebtoken');
// jest.mock('../../../models/User');

// describe('Auth Controller', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('POST /api/auth/login', () => {
//         const mockUser = {
//             _id: 'mock-user-id',
//             email: 'test@example.com',
//             role: 'user',
//             comparePassword: jest.fn(),
//         };

//         const loginPayload = {
//             email: 'test@example.com',
//             password: 'password123',
//         };

//         it('should login successfully with valid credentials', async () => {
//             // Mock successful password comparison
//             mockUser.comparePassword.mockResolvedValueOnce(true);
//             User.findOne.mockResolvedValueOnce(mockUser);
//             jwt.sign.mockReturnValueOnce('mock-token');

//             const response = await request(app)
//                 .post('/api/auth/login')
//                 .send(loginPayload);

//             expect(response.status).toBe(200);
//             expect(response.body).toEqual({
//                 token: 'mock-token',
//                 role: 'user',
//                 message: 'Login Successful',
//             });

//             expect(User.findOne).toHaveBeenCalledWith({ email: loginPayload.email });
//             expect(mockUser.comparePassword).toHaveBeenCalledWith(loginPayload.password);
//             expect(jwt.sign).toHaveBeenCalledWith(
//                 { id: mockUser._id },
//                 process.env.JWT_SECRET,
//                 { expiresIn: '24h' }
//             );
//         });

//         it('should return 401 with invalid email', async () => {
//             User.findOne.mockResolvedValueOnce(null);

//             const response = await request(app)
//                 .post('/api/auth/login')
//                 .send(loginPayload);

//             expect(response.status).toBe(401);
//             expect(response.body).toEqual({
//                 message: 'Invalid credentials',
//             });
//         });

//         it('should return 401 with invalid password', async () => {
//             mockUser.comparePassword.mockResolvedValueOnce(false);
//             User.findOne.mockResolvedValueOnce(mockUser);

//             const response = await request(app)
//                 .post('/api/auth/login')
//                 .send(loginPayload);

//             expect(response.status).toBe(401);
//             expect(response.body).toEqual({
//                 message: 'Invalid credentials',
//             });
//         });

//         it('should return 500 when database error occurs', async () => {
//             User.findOne.mockRejectedValueOnce(new Error('Database error'));

//             const response = await request(app)
//                 .post('/api/auth/login')
//                 .send(loginPayload);

//             expect(response.status).toBe(500);
//             expect(response.body).toEqual({
//                 message: 'Database error',
//             });
//         });
//     });

//     describe('POST /api/auth/reset-password', () => {
//         it('should return 501 status code', async () => {
//             const response = await request(app)
//                 .post('/api/auth/reset-password')
//                 .send({});

//             expect(response.status).toBe(501);
//             expect(response.body).toEqual({
//                 message: 'Under Construction',
//             });
//         });
//     });
// });