const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');
const Enrollment = require('../../models/Enrollment');
const Course = require('../../models/Course');
const Student = require('../../models/Student');
const User = require('../../models/User');
const {generateAccessToken, generateRefreshToken} = require('../../utils/token');

describe('Enrollment API', () => {
  let studentToken;
  let instructorToken;
  let student;
  let instructor;
  let course;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test users with unique emails
    const studentUser = await createTestUser(User, 'student');
    const instructorUser = await createTestUser(User, 'instructor');

    student = await Student.create({
      user: studentUser._id,
      studentId: 'STU123',
      grade: 10,
      gpa: 3.5,
      department: 'Computer Science'
    });

    instructor = instructorUser;

    course = await Course.create({
      courseCode: 'CS101',
      title: 'Intro to Programming',
      department: 'Computer Science',
      instructor: instructor._id,
      credits: 3,
      semester: 'Fall 2024',
      capacity: 30
    });

    studentToken = generateToken(studentUser._id);
    instructorToken = generateToken(instructor._id);
  });

  describe('POST /api/enrollments', () => {
    it('should enroll student in course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('student');
      expect(res.body).toHaveProperty('course');
    });

    it('should prevent duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      // Attempt duplicate enrollment
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already enrolled');
    });

    it('should reject enrollment when course is at capacity', async () => {
      // Fill the course to capacity
      const course = await Course.findOneAndUpdate(
        { courseCode: 'CS101' },
        { capacity: 1 }
      );

      // Create and enroll another student
      const anotherStudentUser = await createTestUser(User, 'student');
      const anotherStudent = await Student.create({
        user: anotherStudentUser._id,
        studentId: 'STU456',
        grade: 10,
        gpa: 0,
        department: 'Computer Science'
      });

      // First enrollment should succeed
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      // Second enrollment should fail due to capacity
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${generateToken(anotherStudentUser._id)}`)
        .send({
          studentId: anotherStudent.studentId,
          courseCode: course.courseCode
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('capacity reached');
    });

    it('should return 404 for non-existent course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: 'NOTREAL101'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Course not found');
    });

    it('should return 404 for non-existent student', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: 'NOTREAL123',
          courseCode: course.courseCode
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Student not found');
    });

    it('should return 400 for invalid enrollment data', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: '', // Invalid empty student ID
          courseCode: course.courseCode
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
    it('should handle database error when checking course capacity', async () => {
      // Force a database error by passing invalid ObjectId
      jest.spyOn(Enrollment, 'countDocuments').mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: student.studentId,
          courseCode: course.courseCode
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toBeTruthy();
    });


  });

  describe('GET /api/enrollments/student/:studentId', () => {
    beforeEach(async () => {
      await Enrollment.create({
        student: student._id,
        course: course._id
      });
    });

    it('should get student enrollments', async () => {
      const res = await request(app)
        .get(`/api/enrollments/student/${student.studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('should return 404 for non-existent student enrollments', async () => {
      const res = await request(app)
        .get('/api/enrollments/student/NOTREAL123')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Student not found');
    });


  });

  describe('GET /api/enrollments/course/:courseId', () => {
    beforeEach(async () => {
      await Enrollment.create({
        student: student._id,
        course: course._id
      });
    });

    it('should get course enrollments with instructor token', async () => {
      const res = await request(app)
        .get(`/api/enrollments/course/${course.courseCode}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('should not allow students to view course enrollments', async () => {
      const res = await request(app)
        .get(`/api/enrollments/course/${course.courseCode}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent course enrollments', async () => {
      const res = await request(app)
        .get('/api/enrollments/course/NOTREAL101')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Course not found');
    });
    it('should handle database errors when getting course enrollments', async () => {
      // Force a database error during population
      jest.spyOn(Enrollment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValueOnce(new Error('Database error'))
        })
      });

      const res = await request(app)
        .get(`/api/enrollments/course/${course.courseCode}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBeTruthy();
    });

    it('should handle database errors in getStudentEnrollments when finding student', async () => {
      // Mock Student.findOne to throw an error
      jest.spyOn(Student, 'findOne').mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get(`/api/enrollments/student/${student.studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Database error');
    });

  });

  describe('DELETE /api/enrollments/:id', () => {
    let enrollment;

    beforeEach(async () => {
      enrollment = await Enrollment.create({
        student: student._id,
        course: course._id
      });
    });

    it('should successfully cancel enrollment', async () => {
      const res = await request(app)
        .delete(`/api/enrollments/${enrollment._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('cancelled successfully');

      const deletedEnrollment = await Enrollment.findById(enrollment._id);
      expect(deletedEnrollment).toBeNull();
    });

    it('should return 404 for non-existent enrollment', async () => {
      const fakeId = '507f1f77bcf86cd799439012'; // Valid ObjectId that doesn't exist
      const res = await request(app)
        .delete(`/api/enrollments/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Enrollment not found');
    });

    it('should handle database errors when canceling enrollment', async () => {
      // Create a new student to avoid duplicate enrollment
      const newStudentUser = await createTestUser(User, 'student');
      const newStudent = await Student.create({
        user: newStudentUser._id,
        studentId: 'STU789',
        grade: 10,
        gpa: 0,
        department: 'Computer Science'
      });

      // Create a new course to avoid duplicate enrollment
      const newCourse = await Course.create({
        courseCode: 'CS102',
        title: 'Advanced Programming',
        department: 'Computer Science',
        instructor: instructor._id,
        credits: 3,
        semester: 'Fall 2024',
        capacity: 30
      });

      const enrollment = await Enrollment.create({
        student: newStudent._id,
        course: newCourse._id
      });

      // Force a database error during deletion
      jest.spyOn(Enrollment, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .delete(`/api/enrollments/${enrollment._id}`)
        .set('Authorization', `Bearer ${generateToken(newStudentUser._id)}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBeTruthy();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});



describe('Enrollment API', () => {
  let studentToken;
  let instructorToken;
  let student;
  let instructor;
  let course;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test users with unique emails
    const studentUser = await createTestUser(User, 'student');
    const instructorUser = await createTestUser(User, 'instructor');

    student = await Student.create({
      user: studentUser._id,
      studentId: 'STU123',
      grade: 10,
      gpa: 3.5,
      department: 'Computer Science'
    });

    instructor = instructorUser;

    course = await Course.create({
      courseCode: 'CS101',
      title: 'Intro to Programming',
      department: 'Computer Science',
      instructor: instructor._id,
      credits: 3,
      semester: 'Fall 2024',
      capacity: 30
    });

    studentToken = generateToken(studentUser._id);
    instructorToken = generateToken(instructor._id);
  });


  // ... [previous test setup and test cases remain the same] ...

  describe('Performance Tests', () => {
    const RESPONSE_TIME_THRESHOLD = 500;
    
    jest.setTimeout(30000);


    const createMultipleStudents = async (count) => { 
      const studentData = Array.from({ length: count }, (_, i) => ({
        email: `student${i}@test.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: `Student${i}`,
        role: 'student'
      }));

      const users = await User.insertMany(studentData);

      const studentDocs = users.map((user, i) => ({
        user: user._id,
        studentId: `STU${1000 + i}`,
        grade: 10,
        gpa: 3.5,
        department: 'Computer Science'
      }))

      const students = await Student.insertMany(studentDocs);
      const accessToken = generateAccessToken(users.map(user => user._id));
      const refreshToken = generateRefreshToken(users.map(user => user._id));

      return students.map((student, i) => ({ student, accessToken: accessToken[i], refreshToken: refreshToken[i] }));
    }
    
    // Helper function to measure response time
    const measureResponseTime = async (request) => {
      const start = Date.now();
      await request;
      return Date.now() - start;
    };

    // Helper function to create multiple students
    // const createMultipleStudents = async (count) => {
    //   const students = [];
    //   for (let i = 0; i < count; i++) {
    //     const studentUser = await createTestUser(User, 'student');
    //     const student = await Student.create({
    //       user: studentUser._id,
    //       studentId: `STU${1000 + i}`,
    //       grade: 10,
    //       gpa: 3.5,
    //       department: 'Computer Science'
    //     });
    //     students.push({ student, token: generateToken(studentUser._id) });
    //   }
    //   return students;
    // };

    // Helper function to create multiple courses
    const createMultipleCourses = async (count) => {
      const courses = [];
      for (let i = 0; i < count; i++) {
        const course = await Course.create({
          courseCode: `CS${200 + i}`,
          title: `Test Course ${i}`,
          department: 'Computer Science',
          instructor: instructor._id,
          credits: 3,
          semester: 'Fall 2024',
          capacity: 30
        });
        courses.push(course);
      }
      return courses;
    };

    beforeEach(async () => {
      await clearDatabase();

      // Create base test data
      const studentUser = await createTestUser(User, 'student');
      const instructorUser = await createTestUser(User, 'instructor');

      student = await Student.create({
        user: studentUser._id,
        studentId: 'STU123',
        grade: 10,
        gpa: 3.5,
        department: 'Computer Science'
      });

      instructor = instructorUser;

      course = await Course.create({
        courseCode: 'CS101',
        title: 'Intro to Programming',
        department: 'Computer Science',
        instructor: instructor._id,
        credits: 3,
        semester: 'Fall 2024',
        capacity: 30
      });

      studentToken = generateToken(studentUser._id);
      instructorToken = generateToken(instructor._id);
    });

    it('should handle enrollment creation within acceptable time', async () => {
      const responseTime = await measureResponseTime(
        request(app)
          .post('/api/enrollments')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            studentId: student.studentId,
            courseCode: course.courseCode
          })
      );

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });

    it('should efficiently retrieve student enrollments with populated data', async () => {
      // Create multiple enrollments for the student
      const courses = await createMultipleCourses(5);
      await Promise.all(
        courses.map(course =>
          Enrollment.create({
            student: student._id,
            course: course._id
          })
        )
      );

      const responseTime = await measureResponseTime(
        request(app)
          .get(`/api/enrollments/student/${student.studentId}`)
          .set('Authorization', `Bearer ${studentToken}`)
      );

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });

    it('should handle concurrent enrollment requests efficiently', async () => {
      const students = await createMultipleStudents(10);

      const startTime = Date.now();

      // Make concurrent enrollment requests
      await Promise.all(
        students.map(({ student, token }) =>
          request(app)
            .post('/api/enrollments')
            .set('Authorization', `Bearer ${token}`)
            .send({
              studentId: student.studentId,
              courseCode: course.courseCode
            })
        )
      );

      const totalTime = Date.now() - startTime;
      const averageTimePerRequest = totalTime / students.length;

      expect(averageTimePerRequest).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });

    it('should efficiently handle large course enrollment list retrieval', async () => {
      // Create multiple students and enroll them
      const students = await createMultipleStudents(20);

      await Promise.all(
        students.map(({ student }) =>
          Enrollment.create({
            student: student._id,
            course: course._id
          })
        )
      );

      const responseTime = await measureResponseTime(
        request(app)
          .get(`/api/enrollments/course/${course.courseCode}`)
          .set('Authorization', `Bearer ${instructorToken}`)
      );

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 5);
    });

    it('should maintain performance with repeated enrollment checks', async () => {
      // Create initial enrollment
      await Enrollment.create({
        student: student._id,
        course: course._id
      });

      const times = [];

      // Perform multiple consecutive checks
      for (let i = 0; i < 10; i++) {
        const responseTime = await measureResponseTime(
          request(app)
            .post('/api/enrollments')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
              studentId: student.studentId,
              courseCode: course.courseCode
            })
        );
        times.push(responseTime);
      }

      // Calculate average response time
      const averageTime = times.reduce((a, b) => a + b) / times.length;
      expect(averageTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});