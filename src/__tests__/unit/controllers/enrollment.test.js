const Enrollment = require('../../../models/Enrollment');
const Course = require('../../../models/Course');
const Student = require('../../../models/Student');
const enrollmentController = require('../../../controllers/enrollmentController');
const { validateEnrollment } = require('../../../validators/enrollmentValidator');
const logger = require('../../../config/logger');

jest.mock('../../../models/Enrollment');
jest.mock('../../../models/Course');
jest.mock('../../../models/Student');
jest.mock('../../../validators/enrollmentValidator');
jest.mock('../../../config/logger');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (params = {}, body = {}) => ({
    params,
    body
});

describe('Enrollment Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('enrollStudent', () => {
        it('should create enrollment when valid', async () => {
            const mockCourse = { _id: 'courseId', capacity: 10 };
            const mockStudent = { _id: 'studentId' };
            const mockEnrollmentInstance = {
                student: 'studentId',
                course: 'courseId',
                save: jest.fn().mockResolvedValue({
                    _id: 'enrollmentId',
                    student: 'studentId',
                    course: 'courseId'
                })
            };

            validateEnrollment.mockReturnValue({ error: null });
            Course.findOne.mockResolvedValue(mockCourse);
            Student.findOne.mockResolvedValue(mockStudent);
            Enrollment.findOne.mockResolvedValue(null);
            Enrollment.countDocuments.mockResolvedValue(5);
            Enrollment.mockImplementation(() => mockEnrollmentInstance);

            const req = mockRequest({}, { courseCode: 'CS101', studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.enrollStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockEnrollmentInstance);
        });

        it('should handle validation errors', async () => {
            validateEnrollment.mockReturnValue({
                error: { details: [{ message: 'Invalid data' }] }
            });

            const req = mockRequest({}, { courseCode: 'CS101' });
            const res = mockResponse();

            await enrollmentController.enrollStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
        });

        it('should handle course not found', async () => {
            validateEnrollment.mockReturnValue({ error: null });
            Course.findOne.mockResolvedValue(null);

            const req = mockRequest({}, { courseCode: 'CS101', studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.enrollStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Course not found' });
        });

        it('should handle student not found', async () => {
            validateEnrollment.mockReturnValue({ error: null });
            Course.findOne.mockResolvedValue({ _id: 'courseId' });
            Student.findOne.mockResolvedValue(null);

            const req = mockRequest({}, { courseCode: 'CS101', studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.enrollStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Student not found' });
        });

        it('should handle existing enrollment', async () => {
            validateEnrollment.mockReturnValue({ error: null });
            Course.findOne.mockResolvedValue({ _id: 'courseId' });
            Student.findOne.mockResolvedValue({ _id: 'studentId' });
            Enrollment.findOne.mockResolvedValue({ _id: 'existingEnrollment' });

            const req = mockRequest({}, { courseCode: 'CS101', studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.enrollStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Student is already enrolled in this course'
            });
        });

        it('should handle course capacity reached', async () => {
            validateEnrollment.mockReturnValue({ error: null });
            Course.findOne.mockResolvedValue({ _id: 'courseId', capacity: 10 });
            Student.findOne.mockResolvedValue({ _id: 'studentId' });
            Enrollment.findOne.mockResolvedValue(null);
            Enrollment.countDocuments.mockResolvedValue(10);

            const req = mockRequest({}, { courseCode: 'CS101', studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.enrollStudent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Course capacity reached' });
        });
    });

    describe('getStudentEnrollments', () => {
        it('should get student enrollments successfully', async () => {
            const mockStudent = { _id: 'studentId' };
            const mockEnrollments = [{ course: 'courseId', student: 'studentId' }];

            Student.findOne.mockResolvedValue(mockStudent);
            Enrollment.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockEnrollments)
                })
            });

            const req = mockRequest({ studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.getStudentEnrollments(req, res);

            expect(res.json).toHaveBeenCalledWith(mockEnrollments);
        });

        it('should handle student not found', async () => {
            Student.findOne.mockResolvedValue(null);

            const req = mockRequest({ studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.getStudentEnrollments(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Student not found' });
        });

        it('should handle database errors', async () => {
            Student.findOne.mockRejectedValue(new Error('Database error'));

            const req = mockRequest({ studentId: 'ST123' });
            const res = mockResponse();

            await enrollmentController.getStudentEnrollments(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getCourseEnrollments', () => {
        it('should get course enrollments successfully', async () => {
            const mockCourse = { _id: 'courseId' };
            const mockEnrollments = [{ course: 'courseId', student: 'studentId' }];

            Course.findOne.mockResolvedValue(mockCourse);
            Enrollment.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockEnrollments)
                })
            });

            const req = mockRequest({ courseId: 'CS101' });
            const res = mockResponse();

            await enrollmentController.getCourseEnrollments(req, res);

            expect(res.json).toHaveBeenCalledWith(mockEnrollments);
        });

        it('should handle course not found', async () => {
            Course.findOne.mockResolvedValue(null);

            const req = mockRequest({ courseId: 'CS101' });
            const res = mockResponse();

            await enrollmentController.getCourseEnrollments(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Course not found' });
        });

        it('should handle database errors', async () => {
            Course.findOne.mockRejectedValue(new Error('Database error'));

            const req = mockRequest({ courseId: 'CS101' });
            const res = mockResponse();

            await enrollmentController.getCourseEnrollments(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('cancelEnrollment', () => {
        it('should cancel enrollment successfully', async () => {
            const mockEnrollment = { _id: 'enrollmentId' };
            Enrollment.findByIdAndDelete.mockResolvedValue(mockEnrollment);

            const req = mockRequest({ id: 'enrollmentId' });
            const res = mockResponse();

            await enrollmentController.cancelEnrollment(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: 'Enrollment cancelled successfully'
            });
        });

        it('should handle enrollment not found', async () => {
            Enrollment.findByIdAndDelete.mockResolvedValue(null);

            const req = mockRequest({ id: 'nonexistentId' });
            const res = mockResponse();

            await enrollmentController.cancelEnrollment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Enrollment not found' });
        });

        it('should handle database errors', async () => {
            Enrollment.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            const req = mockRequest({ id: 'enrollmentId' });
            const res = mockResponse();

            await enrollmentController.cancelEnrollment(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });
});



// const Enrollment = require('../../../models/Enrollment');
// const Course = require('../../../models/Course');
// const Student = require('../../../models/Student');
// const enrollmentController = require('../../../controllers/enrollmentController');
// const { validateEnrollment } = require('../../../validators/enrollmentValidator');

// jest.mock('../../../models/Enrollment');
// jest.mock('../../../models/Course');
// jest.mock('../../../models/Student');
// jest.mock('../../../validators/enrollmentValidator');

// const mockResponse = () => {
//     const res = {};
//     res.status = jest.fn().mockReturnValue(res);
//     res.json = jest.fn().mockReturnValue(res);
//     return res;
// };

// const mockRequest = (params = {}, body = {}) => ({
//     params,
//     body
// });

// describe('Enrollment Controller', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('enrollStudent', () => {
//         it('should create enrollment when valid', async () => {
//             const mockCourse = { _id: 'courseId', capacity: 10 };
//             const mockStudent = { _id: 'studentId' };
//             const mockEnrollmentInstance = {
//                 student: 'studentId',
//                 course: 'courseId',
//                 save: jest.fn().mockResolvedValue({
//                     _id: 'enrollmentId',
//                     student: 'studentId',
//                     course: 'courseId'
//                 })
//             };

//             validateEnrollment.mockReturnValue({ error: null });
//             Course.findOne.mockResolvedValue(mockCourse);
//             Student.findOne.mockResolvedValue(mockStudent);
//             Enrollment.findOne.mockResolvedValue(null);
//             Enrollment.countDocuments.mockResolvedValue(5);
//             Enrollment.mockImplementation(() => mockEnrollmentInstance);

//             const req = mockRequest({}, { courseCode: 'CS101', studentId: 'ST123' });
//             const res = mockResponse();

//             await enrollmentController.enrollStudent(req, res);

//             expect(res.status).toHaveBeenCalledWith(201);
//             expect(res.json).toHaveBeenCalledWith(mockEnrollmentInstance);
//         });
//     });

//     describe('getStudentEnrollments', () => {
//         it('should get student enrollments', async () => {
//             const mockStudent = { _id: 'studentId' };
//             const mockEnrollments = [{ course: 'courseId', student: 'studentId' }];

//             Student.findOne.mockResolvedValue(mockStudent);
//             Enrollment.find.mockReturnValue({
//                 populate: jest.fn().mockReturnValue({
//                     populate: jest.fn().mockResolvedValue(mockEnrollments)
//                 })
//             });

//             const req = mockRequest({ studentId: 'ST123' });
//             const res = mockResponse();

//             await enrollmentController.getStudentEnrollments(req, res);

//             expect(res.json).toHaveBeenCalledWith(mockEnrollments);
//         });
//     });

//     describe('getCourseEnrollments', () => {
//         it('should get course enrollments', async () => {
//             const mockCourse = { _id: 'courseId' };
//             const mockEnrollments = [{ course: 'courseId', student: 'studentId' }];

//             Course.findOne.mockResolvedValue(mockCourse);
//             Enrollment.find.mockReturnValue({
//                 populate: jest.fn().mockReturnValue({
//                     populate: jest.fn().mockResolvedValue(mockEnrollments)
//                 })
//             });

//             const req = mockRequest({ courseId: 'CS101' });
//             const res = mockResponse();

//             await enrollmentController.getCourseEnrollments(req, res);

//             expect(res.json).toHaveBeenCalledWith(mockEnrollments);
//         });
//     });

//     describe('cancelEnrollment', () => {
//         it('should cancel enrollment', async () => {
//             const mockEnrollment = { _id: 'enrollmentId' };

//             Enrollment.findByIdAndDelete.mockResolvedValue(mockEnrollment);

//             const req = mockRequest({ id: 'enrollmentId' });
//             const res = mockResponse();

//             await enrollmentController.cancelEnrollment(req, res);

//             expect(res.json).toHaveBeenCalledWith({ message: 'Enrollment cancelled successfully' });
//         });
//     });
// });