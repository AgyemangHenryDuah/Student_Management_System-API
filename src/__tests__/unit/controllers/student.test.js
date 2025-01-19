const Student = require('../../../models/Student');
const User = require('../../../models/User');
const studentController = require('../../../controllers/studentController');
const { validateStudent } = require('../../../validators/studentValidator');
const { generateAccessToken, generateRefreshToken } = require('../../../utils/token')
const { quickSort, mergeSort } = require('../../../utils/sortingAlgorithms');
const logger = require('../../../config/logger');


jest.mock('../../../utils/token')
jest.mock('../../../models/Student');
jest.mock('../../../models/User');
jest.mock('../../../validators/studentValidator');
jest.mock('jsonwebtoken');
jest.mock('../../../utils/sortingAlgorithms');
jest.mock('../../../config/logger');

const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
});

const mockRequest = (params = {}, body = {}, query = {}, user = {}) => ({
    params,
    body,
    query,
    user
});

describe('Student Controller', () => {
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = mockResponse();
    });

    describe('getAllStudents', () => {
        const mockStudentFind = {
            populate: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn()
        };

        beforeEach(() => {
            Student.find.mockReturnValue(mockStudentFind);
        });

        it('should get all students with pagination', async () => {
            const mockStudents = [{ id: 1 }, { id: 2 }];
            mockStudentFind.lean.mockResolvedValue(mockStudents);
            Student.countDocuments.mockResolvedValue(2);

            const req = mockRequest({}, {}, { page: 1, limit: 10 });
            await studentController.getAllStudents(req, res);

            expect(res.json).toHaveBeenCalledWith({
                students: mockStudents,
                totalPages: 1,
                currentPage: 1,
                totalStudents: 2
            });
        });

        it('should filter students by name', async () => {
            const mockUsers = [{ _id: 'user1' }, { _id: 'user2' }];
            const mockStudents = [{ id: 1, user: { firstName: 'John' } }];

            // Mock User.find()
            User.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsers)
            });

            mockStudentFind.lean.mockResolvedValue(mockStudents);
            Student.countDocuments.mockResolvedValue(1);

            const req = mockRequest({}, {}, { name: 'John' });
            await studentController.getAllStudents(req, res);

            // Verify User.find was called with correct regex
            expect(User.find).toHaveBeenCalledWith({
                $or: [
                    { firstName: expect.any(RegExp) },
                    { lastName: expect.any(RegExp) }
                ]
            });

            // Verify Student.find was called with user IDs
            expect(Student.find).toHaveBeenCalledWith({
                user: { $in: ['user1', 'user2'] }
            });
        });

        it('should filter students by grade and department', async () => {
            const mockStudents = [{ id: 1, grade: 'A', department: 'CS' }];
            mockStudentFind.lean.mockResolvedValue(mockStudents);
            Student.countDocuments.mockResolvedValue(1);

            const req = mockRequest({}, {}, { grade: 'A', department: 'CS' });
            await studentController.getAllStudents(req, res);

            expect(Student.find).toHaveBeenCalledWith({
                grade: 'A',
                department: 'CS'
            });
        });

        it('should sort students when sort parameter is provided', async () => {
            const mockStudents = [
                { id: 1, grade: 'B' },
                { id: 2, grade: 'A' }
            ];
            mockStudentFind.lean.mockResolvedValue(mockStudents);
            Student.countDocuments.mockResolvedValue(2);

            // Test ascending sort
            const reqAsc = mockRequest({}, {}, { sort: 'grade' });
            await studentController.getAllStudents(reqAsc, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                students: expect.arrayContaining([
                    expect.objectContaining({ id: 2, grade: 'A' }),
                    expect.objectContaining({ id: 1, grade: 'B' })
                ])
            }));

            // Test descending sort
            const reqDesc = mockRequest({}, {}, { sort: '-grade' });
            await studentController.getAllStudents(reqDesc, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                students: expect.arrayContaining([
                    expect.objectContaining({ id: 1, grade: 'B' }),
                    expect.objectContaining({ id: 2, grade: 'A' })
                ])
            }));
        });

        it('should handle countDocuments error', async () => {
            mockStudentFind.lean.mockResolvedValue([]);
            Student.countDocuments.mockRejectedValue(new Error('Count failed'));

            const req = mockRequest();
            await studentController.getAllStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Count failed'
            });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getStudent', () => {
        it('should get a student by id', async () => {
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' }
            };

            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent)
            });

            const req = mockRequest({ id: 'studentId' }, {}, {}, { role: 'instructor' });
            await studentController.getStudent(req, res);

            expect(res.json).toHaveBeenCalledWith(mockStudent);
        });

        it('should allow student to access their own data', async () => {
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' }
            };

            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent)
            });

            const req = mockRequest(
                { id: 'studentId' },
                {},
                {},
                { role: 'student', _id: 'userId' }
            );
            await studentController.getStudent(req, res);

            expect(res.json).toHaveBeenCalledWith(mockStudent);
        });

        it('should return 404 if student not found', async () => {
            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const req = mockRequest({ id: 'nonexistentId' });
            await studentController.getStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Student not found'
            });
        });

        it('should return 403 if unauthorized access', async () => {
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' }
            };

            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent)
            });

            const req = mockRequest(
                { id: 'studentId' },
                {},
                {},
                { role: 'student', _id: 'differentUserId' }
            );
            await studentController.getStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access denied'
            });
        });

        it('should handle database error', async () => {
            Student.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const req = mockRequest({ id: 'studentId' });
            await studentController.getStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database error'
            });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('createStudent', () => {
        const mockStudentData = {
            email: 'test@test.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            studentId: 'ST123',
            grade: 'A',
            gpa: 3.5,
            department: 'CS'
        };

        beforeEach(() => {
            validateStudent.mockReturnValue({ error: null });
            generateAccessToken.mockReturnValue('mockAccessToken');
            generateRefreshToken.mockReturnValue('mockRefreshToken');

            // Mock Student implementation
            Student.mockImplementation((data) => ({
                ...data,
                _id: 'mockStudentId',
                save: jest.fn().mockResolvedValue({ ...data, _id: 'mockStudentId' })
            }));
        });


        it('should create a new student successfully', async () => {
            const mockPopulatedStudent = {
                _id: 'mockStudentId',
                user: {
                    _id: 'mockUserId',
                    firstName: mockStudentData.firstName,
                    lastName: mockStudentData.lastName,
                    email: mockStudentData.email
                }
            };

            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPopulatedStudent)
            });

            const req = mockRequest({}, mockStudentData);
            await studentController.createStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Student created succefully',
                accessToken: 'mockAccessToken',
                refreshToken: 'mockRefreshToken',
                student: mockPopulatedStudent
            });
        });

        it('should handle validation error', async () => {
            validateStudent.mockReturnValue({
                error: { details: [{ message: 'Validation error' }] }
            });

            const req = mockRequest({}, mockStudentData);
            await studentController.createStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Validation error'
            });
        });

        it('should handle save error', async () => {
            const mockUser = {
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            };
            User.mockImplementation(() => mockUser);

            const req = mockRequest({}, mockStudentData);
            await studentController.createStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Save failed'
            });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('updateStudent', () => {
        const mockUpdateData = {
            email: 'updated@test.com',
            firstName: 'UpdatedJohn',
            lastName: 'UpdatedDoe',
            studentId: 'ST124',
            grade: 'A+',
            gpa: 4.0,
            department: 'CS'
        };

        beforeEach(() => {
            validateStudent.mockReturnValue({ error: null });
        });

        it('should update student successfully', async () => {
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' }
            };

            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent)
            });

            Student.findByIdAndUpdate.mockResolvedValue(mockStudent);
            User.findByIdAndUpdate.mockResolvedValue(mockStudent.user);
            Student.findOne.mockResolvedValue(null);

            const req = mockRequest(
                { id: 'studentId' },
                mockUpdateData,
                {},
                { role: 'instructor' }
            );

            await studentController.updateStudent(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: 'Student Updated Succesfully',
                student: expect.any(Object)
            });
        });

        it('should handle validation error in update', async () => {
            validateStudent.mockReturnValue({
                error: { details: [{ message: 'Invalid data' }] }
            });

            const req = mockRequest(
                { id: 'studentId' },
                mockUpdateData
            );

            await studentController.updateStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid data'
            });
        });

        it('should handle duplicate studentId', async () => {
            validateStudent.mockReturnValue({ error: null });
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' },
                studentId: 'ST123'
            };

            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent)
            });

            Student.findOne.mockResolvedValue({ _id: 'differentId' });

            const req = mockRequest(
                { id: 'studentId' },
                mockUpdateData,
                {},
                { role: 'instructor' }
            );

            await studentController.updateStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Student Id already exists'
            });
        });

        it('should return 403 when non-instructor tries to update another student', async () => {
            validateStudent.mockReturnValue({ error: null });
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' }
            };

            Student.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent)
            });

            const req = mockRequest(
                { id: 'studentId' },
                mockUpdateData,
                {},
                { role: 'student', _id: 'differentUserId' }
            );

            await studentController.updateStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access denied'
            });
        });

        it('should handle database error in update', async () => {
            validateStudent.mockReturnValue({ error: null });
            Student.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const req = mockRequest(
                { id: 'studentId' },
                mockUpdateData
            );

            await studentController.updateStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database error'
            });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('deleteStudent', () => {
        it('should delete student successfully', async () => {
            const mockStudent = {
                _id: 'studentId', user: { _id: 'userId' }
            };

            Student.findById.mockResolvedValue(mockStudent);
            User.findByIdAndDelete.mockResolvedValue({});
            Student.findByIdAndDelete.mockResolvedValue({});

            const req = mockRequest({ id: 'studentId' });
            await studentController.deleteStudent(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: 'Student deleted successfully'
            });
        });

        it('should return 404 if student not found', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            Student.findById.mockResolvedValue(null);

            const req = mockRequest({ id: 'nonexistentId' });
            await studentController.deleteStudent(req, res);

            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Student not found'
            });

            consoleSpy.mockRestore();
        });

        it('should handle deletion error for user', async () => {
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' }
            };

            Student.findById.mockResolvedValue(mockStudent);
            User.findByIdAndDelete.mockRejectedValue(new Error('Delete failed'));

            const req = mockRequest({ id: 'studentId' });
            await studentController.deleteStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Delete failed'
            });
            expect(logger.error).toHaveBeenCalledWith(
                'Error in deleteStudent:',
                expect.any(Error)
            );
        });

        it('should handle deletion error for student', async () => {
            const mockStudent = {
                _id: 'studentId',
                user: { _id: 'userId' }
            };

            Student.findById.mockResolvedValue(mockStudent);
            User.findByIdAndDelete.mockResolvedValue({});
            Student.findByIdAndDelete.mockRejectedValue(new Error('Delete failed'));

            const req = mockRequest({ id: 'studentId' });
            await studentController.deleteStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Delete failed'
            });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('sortStudents', () => {
        const mockStudents = [
            { id: 1, grade: 'B' },
            { id: 2, grade: 'A' }
        ];

        beforeEach(() => {
            Student.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockStudents)
                })
            });
        });

        it('should sort students using quickSort', async () => {
            quickSort.mockReturnValue([...mockStudents].reverse());

            const req = mockRequest({}, {}, { field: 'grade' });
            await studentController.sortStudents(req, res);

            expect(res.json).toHaveBeenCalledWith({
                field: 'grade',
                algorithm: 'quick',
                data: expect.any(Array)
            });
            expect(quickSort).toHaveBeenCalledWith(mockStudents, 'grade');
        });

        it('should sort students using mergeSort', async () => {
            mergeSort.mockReturnValue([...mockStudents].reverse());

            const req = mockRequest({}, {}, { field: 'grade', algorithm: 'merge' });
            await studentController.sortStudents(req, res);

            expect(res.json).toHaveBeenCalledWith({
                field: 'grade',
                algorithm: 'merge',
                data: expect.any(Array)
            });
            expect(mergeSort).toHaveBeenCalledWith(mockStudents, 'grade');
        });

        it('should return 400 if sorting field is missing', async () => {
            const req = mockRequest();
            await studentController.sortStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Sorting field is required'
            });
        });

        it('should handle database error in sorting', async () => {
            Student.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockRejectedValue(new Error('Sorting failed'))
                })
            });

            const req = mockRequest({}, {}, { field: 'grade' });
            await studentController.sortStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Sorting failed'
            });
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle sorting algorithm error', async () => {
            quickSort.mockImplementation(() => {
                throw new Error('Sorting algorithm failed');
            });

            const req = mockRequest({}, {}, { field: 'grade' });
            await studentController.sortStudents(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Sorting algorithm failed'
            });
            expect(logger.error).toHaveBeenCalled();
        });
    });
});