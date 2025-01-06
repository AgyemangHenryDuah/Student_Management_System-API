const Course = require('../../../models/Course');
const courseController = require('../../../controllers/courseController');
const { validateCourse } = require('../../../validators/courseValidator');
const {mergeSort, quickSort} = require('../../../utils/sortingAlgorithms');
const logger = require('../../../config/logger');

jest.mock('../../../models/Course');
jest.mock('../../../validators/courseValidator');
jest.mock('../../../utils/sortingAlgorithms', () => ({
    quickSort: jest.fn(), mergeSort: jest.fn()
}));
jest.mock('../../../config/logger');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (params = {}, body = {}, query = {}, user = {}) => ({
    params,
    body,
    query,
    user,
});

describe('Course Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllCourses', () => {
        it('should get all courses with pagination', async () => {
            const mockCourses = [
                { _id: '1', name: 'Course 1' },
                { _id: '2', name: 'Course 2' }
            ];

            Course.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue(mockCourses)
                    })
                })
            });
            Course.countDocuments.mockResolvedValue(2);

            const req = mockRequest({}, {}, { page: 1, limit: 10 });
            const res = mockResponse();

            await courseController.getAllCourses(req, res);

            expect(res.json).toHaveBeenCalledWith({
                courses: mockCourses,
                totalPages: 1,
                currentPage: 1
            });
        });

        it('should return 400 for invalid pagination parameters', async () => {
            const req = mockRequest({}, {}, { page: -1, limit: 0 });
            const res = mockResponse();

            await courseController.getAllCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Invalid pagination parameters"
            });
        });

        it('should filter courses by department and semester', async () => {
            const mockCourses = [{ department: 'CS', semester: 'Fall 2024' }];
            Course.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue(mockCourses)
                    })
                })
            });

            const req = mockRequest({}, {}, {
                department: 'CS',
                semester: 'Fall 2024'
            });
            const res = mockResponse();

            await courseController.getAllCourses(req, res);

            expect(Course.find).toHaveBeenCalledWith({
                department: 'CS',
                semester: 'Fall 2024'
            });
        });

        it('should handle database errors', async () => {
            Course.find.mockImplementation(() => {
                throw new Error('Database error');
            });

            const req = mockRequest();
            const res = mockResponse();

            await courseController.getAllCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getCourse', () => {
        it('should get course by courseCode', async () => {
            const mockCourse = { _id: '1', name: 'Course 1' };
            Course.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockCourse)
            });

            const req = mockRequest({ courseCode: 'CS101' });
            const res = mockResponse();

            await courseController.getCourse(req, res);

            expect(res.json).toHaveBeenCalledWith(mockCourse);
        });

        it('should handle course not found', async () => {
            Course.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const req = mockRequest({ courseCode: 'NOTFOUND101' });
            const res = mockResponse();

            await courseController.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course not found'
            });
        });

        it('should handle database errors', async () => {
            Course.findOne.mockImplementation(() => {
                throw new Error('Database error');
            });

            const req = mockRequest({ courseCode: 'CS101' });
            const res = mockResponse();

            await courseController.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('createCourse', () => {
        it('should create a new course', async () => {
            const courseData = {
                name: 'New Course',
                courseCode: 'CS101'
            };

            validateCourse.mockReturnValue({ error: null });

            const savedCourse = {
                _id: 'testId',
                ...courseData,
                instructor: 'testUserId'
            };

            const mockCourseInstance = {
                ...courseData,
                instructor: 'testUserId',
                save: jest.fn().mockResolvedValue(savedCourse)
            };

            Course.mockImplementation(() => mockCourseInstance);

            const req = mockRequest({}, courseData, {}, { _id: 'testUserId' });
            const res = mockResponse();

            await courseController.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                course: mockCourseInstance,
                message: 'Course created succesfully'
            });
        });

        it('should handle validation errors', async () => {
            validateCourse.mockReturnValue({
                error: { details: [{ message: 'Invalid course data' }] }
            });

            const req = mockRequest({}, { invalidData: true });
            const res = mockResponse();

            await courseController.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid course data'
            });
        });

        it('should handle database errors during creation', async () => {
            validateCourse.mockReturnValue({ error: null });
            const mockCourseInstance = {
                save: jest.fn().mockRejectedValue(new Error('Database error'))
            };
            Course.mockImplementation(() => mockCourseInstance);

            const req = mockRequest({}, { name: 'New Course' }, {}, { _id: 'testUserId' });
            const res = mockResponse();

            await courseController.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('updateCourse', () => {
        it('should update course successfully', async () => {
            validateCourse.mockReturnValue({ error: null });
            const updatedCourse = { _id: '1', courseCode: 'CS101', name: 'Updated Course' };
            Course.findOneAndUpdate.mockResolvedValue(updatedCourse);

            const req = mockRequest(
                { courseCode: 'CS101' },
                { name: 'Updated Course' }
            );
            const res = mockResponse();

            await courseController.updateCourse(req, res);

            expect(res.json).toHaveBeenCalledWith(updatedCourse);
        });

        it('should handle validation errors', async () => {
            validateCourse.mockReturnValue({
                error: { details: [{ message: 'Invalid data' }] }
            });

            const req = mockRequest(
                { courseCode: 'CS101' },
                { name: 'Updated Course' }
            );
            const res = mockResponse();

            await courseController.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid data'
            });
        });

        it('should handle course not found', async () => {
            validateCourse.mockReturnValue({ error: null });
            Course.findOneAndUpdate.mockResolvedValue(null);

            const req = mockRequest(
                { courseCode: 'NOTFOUND101' },
                { name: 'Updated Course' }
            );
            const res = mockResponse();

            await courseController.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course not found'
            });
        });

        it('should handle database errors during update', async () => {
            validateCourse.mockReturnValue({ error: null });
            Course.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

            const req = mockRequest(
                { courseCode: 'CS101' },
                { name: 'Updated Course' }
            );
            const res = mockResponse();

            await courseController.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('deleteCourse', () => {
        it('should delete a course successfully', async () => {
            const mockCourse = { _id: '1', courseCode: 'CS101' };
            Course.findOneAndDelete.mockResolvedValue(mockCourse);

            const req = mockRequest({ courseCode: 'CS101' });
            const res = mockResponse();

            await courseController.deleteCourse(req, res);

            expect(Course.findOneAndDelete).toHaveBeenCalledWith({ courseCode: 'CS101' });
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course deleted successfully'
            });
        });

        it('should handle course not found during deletion', async () => {
            Course.findOneAndDelete.mockResolvedValue(null);

            const req = mockRequest({ courseCode: 'NOTFOUND101' });
            const res = mockResponse();

            await courseController.deleteCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course not found'
            });
        });

        it('should handle database errors during deletion', async () => {
            Course.findOneAndDelete.mockRejectedValue(new Error('Database error'));

            const req = mockRequest({ courseCode: 'CS101' });
            const res = mockResponse();

            await courseController.deleteCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });


    
    describe('sortCourses', () => {
        it('should sort courses using quickSort by default', async () => {
            const mockCourses = [{ name: 'Course A' }, { name: 'Course B' }];
            Course.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockCourses)
                })
            });
            quickSort.mockReturnValue(mockCourses);

            const req = mockRequest({}, {}, { field: 'name' });
            const res = mockResponse();

            await courseController.sortCourses(req, res);

            expect(quickSort).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                field: 'name',
                algorithm: 'quick',
                data: mockCourses
            });
        });

        it('should use mergeSort when specified', async () => {
            const mockCourses = [{ name: 'Course A' }, { name: 'Course B' }];
            Course.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockCourses)
                })
            });
            mergeSort.mockReturnValue(mockCourses);

            const req = mockRequest({}, {}, {
                field: 'name',
                algorithm: 'merge'
            });
            const res = mockResponse();

            await courseController.sortCourses(req, res);

            expect(mergeSort).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                field: 'name',
                algorithm: 'merge',
                data: mockCourses
            });
        });

        it('should return 400 if sorting field is missing', async () => {
            const req = mockRequest({}, {}, { algorithm: 'quick' });
            const res = mockResponse();

            await courseController.sortCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Sorting field is required'
            });
        });

        it('should handle database errors during sorting', async () => {
            Course.find.mockImplementation(() => {
                throw new Error('Database error');
            });

            const req = mockRequest({}, {}, { field: 'name' });
            const res = mockResponse();

            await courseController.sortCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(logger.error).toHaveBeenCalled();
        });
    });
});



// const Course = require('../../models/Course');
// const courseController = require('../../controllers/courseController');
// const { validateCourse } = require('../../validators/courseValidator');
// const { mergeSort, quickSort } = require('../../utils/sortingAlgorithms');
// const logger = require('../../config/logger');

// jest.mock('../../models/Course');
// jest.mock('../../validators/courseValidator');
// jest.mock('../../utils/sortingAlgorithms');
// jest.mock('../../config/logger');

// const mockResponse = () => {
//     const res = {};
//     res.status = jest.fn().mockReturnValue(res);
//     res.json = jest.fn().mockReturnValue(res);
//     return res;
// };

// const mockRequest = (params = {}, body = {}, query = {}, user = {}) => ({
//     params,
//     body,
//     query,
//     user,
// });

// describe('Course Controller', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('getAllCourses', () => {
//         it('should get all courses with pagination', async () => {
//             const mockCourses = [
//                 { _id: '1', name: 'Course 1' },
//                 { _id: '2', name: 'Course 2' }
//             ];

//             Course.find.mockReturnValue({
//                 populate: jest.fn().mockReturnValue({
//                     skip: jest.fn().mockReturnValue({
//                         limit: jest.fn().mockResolvedValue(mockCourses)
//                     })
//                 })
//             });
//             Course.countDocuments.mockResolvedValue(2);

//             const req = mockRequest({}, {}, { page: 1, limit: 10 });
//             const res = mockResponse();

//             await courseController.getAllCourses(req, res);

//             expect(res.json).toHaveBeenCalledWith({
//                 courses: mockCourses,
//                 totalPages: 1,
//                 currentPage: 1
//             });
//         });

//         it('should return 400 for invalid pagination parameters', async () => {
//             const req = mockRequest({}, {}, { page: -1, limit: 0 });
//             const res = mockResponse();

//             await courseController.getAllCourses(req, res);

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith({
//                 message: "Invalid pagination parameters"
//             });
//         });

//         it('should filter courses by department and semester', async () => {
//             const mockCourses = [{ department: 'CS', semester: 'Fall 2024' }];
//             Course.find.mockReturnValue({
//                 populate: jest.fn().mockReturnValue({
//                     skip: jest.fn().mockReturnValue({
//                         limit: jest.fn().mockResolvedValue(mockCourses)
//                     })
//                 })
//             });

//             const req = mockRequest({}, {}, {
//                 department: 'CS',
//                 semester: 'Fall 2024'
//             });
//             const res = mockResponse();

//             await courseController.getAllCourses(req, res);

//             expect(Course.find).toHaveBeenCalledWith({
//                 department: 'CS',
//                 semester: 'Fall 2024'
//             });
//         });

//         it('should handle database errors', async () => {
//             Course.find.mockImplementation(() => {
//                 throw new Error('Database error');
//             });

//             const req = mockRequest();
//             const res = mockResponse();

//             await courseController.getAllCourses(req, res);

//             expect(res.status).toHaveBeenCalledWith(500);
//         });
//     });

//     describe('getCourse', () => {
//         it('should get course by courseCode', async () => {
//             const mockCourse = { _id: '1', name: 'Course 1' };
//             Course.findOne.mockReturnValue({
//                 populate: jest.fn().mockResolvedValue(mockCourse)
//             });

//             const req = mockRequest({ courseCode: 'CS101' });
//             const res = mockResponse();

//             await courseController.getCourse(req, res);

//             expect(res.json).toHaveBeenCalledWith(mockCourse);
//         });
//     });

//     describe('createCourse', () => {
//         it('should create a new course', async () => {
//             const courseData = {
//                 name: 'New Course',
//                 courseCode: 'CS101'
//             };

//             validateCourse.mockReturnValue({ error: null });

//             const savedCourse = {
//                 _id: 'testId',
//                 ...courseData,
//                 instructor: 'testUserId'
//             };

//             const mockCourseInstance = {
//                 ...courseData,
//                 instructor: 'testUserId',
//                 save: jest.fn().mockResolvedValue(savedCourse)
//             };

//             Course.mockImplementation(() => mockCourseInstance);

//             const req = mockRequest({}, courseData, {}, { _id: 'testUserId' });
//             const res = mockResponse();

//             await courseController.createCourse(req, res);

//             expect(res.status).toHaveBeenCalledWith(201);
//             expect(res.json).toHaveBeenCalledWith({
//                 course: mockCourseInstance,
//                 message: 'Course created succesfully'
//             });
//         });
//     });

//     describe('updateCourse', () => {
//         it('should handle validation errors', async () => {
//             validateCourse.mockReturnValue({
//                 error: { details: [{ message: 'Invalid data' }] }
//             });

//             const req = mockRequest(
//                 { courseCode: 'CS101' },
//                 { name: 'Updated Course' }
//             );
//             const res = mockResponse();

//             await courseController.updateCourse(req, res);

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith({
//                 message: 'Invalid data'
//             });
//         });

//         it('should handle course not found', async () => {
//             validateCourse.mockReturnValue({ error: null });
//             Course.findOneAndUpdate.mockResolvedValue(null);

//             const req = mockRequest(
//                 { courseCode: 'NOTFOUND101' },
//                 { name: 'Updated Course' }
//             );
//             const res = mockResponse();

//             await courseController.updateCourse(req, res);

//             expect(res.status).toHaveBeenCalledWith(404);
//             expect(res.json).toHaveBeenCalledWith({
//                 message: 'Course not found'
//             });
//         });
//     });

//     describe('sortCourses', () => {
//         it('should sort courses', async () => {
//             const mockCourses = [{ name: 'Course A' }, { name: 'Course B' }];
//             Course.find.mockReturnValue({
//                 populate: jest.fn().mockReturnValue({
//                     lean: jest.fn().mockResolvedValue(mockCourses)
//                 })
//             });
//             quickSort.mockReturnValue(mockCourses);

//             const req = mockRequest({}, {}, { field: 'name', algorithm: 'quick' });
//             const res = mockResponse();

//             await courseController.sortCourses(req, res);

//             expect(res.json).toHaveBeenCalledWith({
//                 field: 'name',
//                 algorithm: 'quick',
//                 data: mockCourses
//             });
//         });

//         it('should return 400 if sorting field is missing', async () => {
//             const req = mockRequest({}, {}, { algorithm: 'quick' });
//             const res = mockResponse();

//             await courseController.sortCourses(req, res);

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith({
//                 message: 'Sorting field is required'
//             });
//         });

//         it('should use mergeSort when specified', async () => {
//             const mockCourses = [{ name: 'Course A' }, { name: 'Course B' }];
//             Course.find.mockReturnValue({
//                 populate: jest.fn().mockReturnValue({
//                     lean: jest.fn().mockResolvedValue(mockCourses)
//                 })
//             });
//             mergeSort.mockReturnValue(mockCourses);

//             const req = mockRequest({}, {}, {
//                 field: 'name',
//                 algorithm: 'merge'
//             });
//             const res = mockResponse();

//             await courseController.sortCourses(req, res);

//             expect(mergeSort).toHaveBeenCalled();
//             expect(res.json).toHaveBeenCalledWith({
//                 field: 'name',
//                 algorithm: 'merge',
//                 data: mockCourses
//             });
//         });
//     });
// });