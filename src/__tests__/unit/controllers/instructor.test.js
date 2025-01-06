const Instructor = require('../../../models/Instructor');
const User = require('../../../models/User');
const instructorController = require('../../../controllers/instructorController');
const { validateInstructor } = require('../../../validators/instructorValidator');
const jwt = require('jsonwebtoken');

jest.mock('../../../models/Instructor');
jest.mock('../../../models/User');
jest.mock('../../../validators/instructorValidator');
jest.mock('jsonwebtoken');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (params = {}, body = {}, query = {}) => ({
    params,
    body,
    query
});

describe('Instructor Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllInstructors', () => {
        it('should get all instructors with pagination', async () => {
            const mockInstructors = [{ id: 1 }, { id: 2 }];

            Instructor.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockInstructors)
                        })
                    })
                })
            });

            Instructor.countDocuments.mockResolvedValue(2);

            const req = mockRequest({}, {}, { page: 1, limit: 10 });
            const res = mockResponse();

            await instructorController.getAllInstructors(req, res);

            expect(res.json).toHaveBeenCalledWith({
                instructors: mockInstructors,
                totalPages: 1,
                currentPage: 1,
                totalInstructors: 2
            });
        });

        it('should handle invalid pagination parameters', async () => {
            const req = mockRequest({}, {}, { page: -1, limit: 0 });
            const res = mockResponse();

            await instructorController.getAllInstructors(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Invalid pagination parameters"
            });
        });

        it('should handle department and title filters', async () => {
            const mockInstructors = [{ id: 1 }];
            const query = { department: 'CS', title: 'Professor' };

            Instructor.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockInstructors)
                        })
                    })
                })
            });

            Instructor.countDocuments.mockResolvedValue(1);

            const req = mockRequest({}, {}, { ...query, page: 1, limit: 10 });
            const res = mockResponse();

            await instructorController.getAllInstructors(req, res);

            expect(Instructor.find).toHaveBeenCalledWith(query);
        });

        it('should handle database error', async () => {
            Instructor.find.mockImplementation(() => {
                throw new Error('Database error');
            });

            const req = mockRequest();
            const res = mockResponse();

            await instructorController.getAllInstructors(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getInstructor', () => {
        it('should get instructor by id', async () => {
            const mockInstructor = { id: 1, name: 'Test Instructor' };

            Instructor.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockInstructor)
            });

            const req = mockRequest({ id: 1 });
            const res = mockResponse();

            await instructorController.getInstructor(req, res);

            expect(res.json).toHaveBeenCalledWith(mockInstructor);
        });

        it('should handle instructor not found', async () => {
            Instructor.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const req = mockRequest({ id: 'nonexistent' });
            const res = mockResponse();

            await instructorController.getInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle database error', async () => {
            Instructor.findById.mockImplementation(() => {
                throw new Error('Database error');
            });

            const req = mockRequest({ id: 1 });
            const res = mockResponse();

            await instructorController.getInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('createInstructor', () => {
        it('should create new instructor and user', async () => {
            const instructorData = {
                email: 'test@test.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                department: 'CS',
                title: 'Professor'
            };

            validateInstructor.mockReturnValue({ error: null });
            User.findOne.mockResolvedValue(null);

            const mockUser = {
                _id: 'userId',
                ...instructorData
            };

            User.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(mockUser)
            }));

            const mockInstructor = {
                _id: 'instructorId',
                user: mockUser._id,
                department: instructorData.department
            };

            Instructor.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(mockInstructor)
            }));

            Instructor.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockInstructor)
            });

            jwt.sign.mockReturnValue('token123');

            const req = mockRequest({}, instructorData);
            const res = mockResponse();

            await instructorController.createInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Instructor registered succefully",
                token: 'token123',
                instructor: mockInstructor
            });
        });

        it('should handle validation error', async () => {
            validateInstructor.mockReturnValue({
                error: { details: [{ message: 'Validation error' }] }
            });

            const req = mockRequest({}, { email: 'invalid' });
            const res = mockResponse();

            await instructorController.createInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle existing email', async () => {
            validateInstructor.mockReturnValue({ error: null });
            User.findOne.mockResolvedValue({ id: 'existingUser' });

            const req = mockRequest({}, { email: 'existing@test.com' });
            const res = mockResponse();

            await instructorController.createInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email is already in use"
            });
        });

        it('should handle database error during creation', async () => {
            validateInstructor.mockReturnValue({ error: null });
            User.findOne.mockResolvedValue(null);
            User.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Database error'))
            }));

            const req = mockRequest({}, { email: 'test@test.com' });
            const res = mockResponse();

            await instructorController.createInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateInstructor', () => {
        it('should handle validation error', async () => {
            validateInstructor.mockReturnValue({
                error: { details: [{ message: 'Validation error' }] }
            });

            const req = mockRequest({ id: 1 }, { title: '' });
            const res = mockResponse();

            await instructorController.updateInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle instructor not found', async () => {
            validateInstructor.mockReturnValue({ error: null });
            Instructor.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const req = mockRequest({ id: 'nonexistent' }, { title: 'Professor' });
            const res = mockResponse();

            await instructorController.updateInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteInstructor', () => {
        it('should handle instructor not found', async () => {
            Instructor.findById.mockResolvedValue(null);

            const req = mockRequest({ id: 'nonexistent' });
            const res = mockResponse();

            await instructorController.deleteInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle database error during deletion', async () => {
            const mockInstructor = {
                _id: 'instructorId',
                user: { _id: 'userId' }
            };

            Instructor.findById.mockResolvedValue(mockInstructor);
            User.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            const req = mockRequest({ id: 'instructorId' });
            const res = mockResponse();

            await instructorController.deleteInstructor(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});



// const Instructor = require('../../../models/Instructor');
// const User = require('../../../models/User');
// const instructorController = require('../../../controllers/instructorController');
// const { validateInstructor } = require('../../../validators/instructorValidator');
// const jwt = require('jsonwebtoken');

// jest.mock('../../../models/Instructor');
// jest.mock('../../../models/User');
// jest.mock('../../../validators/instructorValidator');
// jest.mock('jsonwebtoken');

// const mockResponse = () => {
//     const res = {};
//     res.status = jest.fn().mockReturnValue(res);
//     res.json = jest.fn().mockReturnValue(res);
//     return res;
// };

// const mockRequest = (params = {}, body = {}, query = {}) => ({
//     params,
//     body,
//     query
// });

// describe('Instructor Controller', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('getAllInstructors', () => {
//         it('should get all instructors with pagination', async () => {
//             const mockInstructors = [{ id: 1 }, { id: 2 }];

//             Instructor.find.mockReturnValue({
//                 populate: jest.fn().mockReturnValue({
//                     skip: jest.fn().mockReturnValue({
//                         limit: jest.fn().mockReturnValue({
//                             lean: jest.fn().mockResolvedValue(mockInstructors)
//                         })
//                     })
//                 })
//             });

//             Instructor.countDocuments.mockResolvedValue(2);

//             const req = mockRequest({}, {}, { page: 1, limit: 10 });
//             const res = mockResponse();

//             await instructorController.getAllInstructors(req, res);

//             expect(res.json).toHaveBeenCalledWith({
//                 instructors: mockInstructors,
//                 totalPages: 1,
//                 currentPage: 1,
//                 totalInstructors: 2
//             });
//         });
//     });

//     describe('createInstructor', () => {
//         it('should create new instructor and user', async () => {
//             const instructorData = {
//                 email: 'test@test.com',
//                 password: 'password123',
//                 firstName: 'Test',
//                 lastName: 'User',
//                 department: 'CS',
//                 title: 'Professor'
//             };

//             validateInstructor.mockReturnValue({ error: null });
//             User.findOne.mockResolvedValue(null);

//             const mockUser = {
//                 _id: 'userId',
//                 ...instructorData
//             };

//             User.mockImplementation(() => ({
//                 save: jest.fn().mockResolvedValue(mockUser)
//             }));

//             const mockInstructor = {
//                 _id: 'instructorId',
//                 user: mockUser._id,
//                 department: instructorData.department
//             };

//             Instructor.mockImplementation(() => ({
//                 save: jest.fn().mockResolvedValue(mockInstructor)
//             }));

//             Instructor.findById.mockReturnValue({
//                 populate: jest.fn().mockResolvedValue(mockInstructor)
//             });

//             jwt.sign.mockReturnValue('token123');

//             const req = mockRequest({}, instructorData);
//             const res = mockResponse();

//             await instructorController.createInstructor(req, res);

//             expect(res.status).toHaveBeenCalledWith(201);
//             expect(res.json).toHaveBeenCalledWith({
//                 message: "Instructor registered succefully",
//                 token: 'token123',
//                 instructor: mockInstructor
//             });
//         });
//     });

//     describe('updateInstructor', () => {
//         it('should update instructor', async () => {
//             const updateData = { title: 'Senior Professor' };
//             const mockInstructor = { _id: 'instructorId', ...updateData };

//             validateInstructor.mockReturnValue({ error: null });
//             Instructor.findByIdAndUpdate.mockReturnValue({
//                 populate: jest.fn().mockResolvedValue(mockInstructor)
//             });

//             const req = mockRequest({ id: 'instructorId' }, updateData);
//             const res = mockResponse();

//             await instructorController.updateInstructor(req, res);

//             expect(res.json).toHaveBeenCalledWith(mockInstructor);
//         });
//     });

//     describe('deleteInstructor', () => {
//         it('should delete instructor and associated user', async () => {
//             const mockInstructor = {
//                 _id: 'instructorId',
//                 user: { _id: 'userId' }
//             };

//             Instructor.findById.mockResolvedValue(mockInstructor);
//             User.findByIdAndDelete.mockResolvedValue({});
//             Instructor.findByIdAndDelete.mockResolvedValue({});

//             const req = mockRequest({ id: 'instructorId' });
//             const res = mockResponse();

//             await instructorController.deleteInstructor(req, res);

//             expect(res.json).toHaveBeenCalledWith({
//                 message: 'Instructor profile deleted successfully'
//             });
//         });
//     });
// });