const request = require('supertest');
const app = require('../../app');
const Course = require('../../models/Course');
const User = require('../../models/User');
const { connect, closeDatabase, clearDatabase } = require('../utils/testDb');
const { generateToken } = require('../utils/auth');
const { createTestUser } = require('../utils/testData');

describe('Course API', () => {
  // Common test variables
  let instructorToken;
  let studentToken;
  let instructor;

  // Database Setup and Teardown
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test users
    instructor = await createTestUser(User, 'instructor');
    const student = await createTestUser(User, 'student');

    instructorToken = generateToken(instructor._id);
    studentToken = generateToken(student._id);

    // Create test courses
    await Course.create([
      {
        courseCode: 'CS101',
        title: 'Intro to Programming',
        department: 'Computer Science',
        instructor: instructor._id,
        credits: 3,
        semester: 'Fall 2024',
        capacity: 30
      },
      {
        courseCode: 'CS102',
        title: 'Data Structures',
        department: 'Computer Science',
        instructor: instructor._id,
        credits: 3,
        semester: 'Spring 2024',
        capacity: 25
      }
    ]);
  });

  // 1. Course Listing and Filtering Tests
  describe('Course Listing and Filtering', () => {
    describe('GET /api/courses', () => {
      describe('Success cases', () => {
        it('should get all courses with valid token', async () => {
          const res = await request(app)
            .get('/api/courses')
            .set('Authorization', `Bearer ${instructorToken}`);

          expect(res.status).toBe(200);
          expect(res.body.courses).toHaveLength(2);
          expect(res.body).toHaveProperty('totalPages');
          expect(res.body).toHaveProperty('currentPage');
        });

        it('should filter courses by department', async () => {
          const res = await request(app)
            .get('/api/courses?department=Computer Science')
            .set('Authorization', `Bearer ${instructorToken}`);

          expect(res.status).toBe(200);
          expect(res.body.courses).toHaveLength(2);
        });

        it('should filter courses by semester', async () => {
          const res = await request(app)
            .get('/api/courses?semester=Fall 2024')
            .set('Authorization', `Bearer ${instructorToken}`);

          expect(res.status).toBe(200);
          expect(res.body.courses).toHaveLength(1);
          expect(res.body.courses[0].semester).toBe('Fall 2024');
        });
      });

      describe('Pagination validation', () => {
        it('should handle invalid page parameter', async () => {
          const res = await request(app)
            .get('/api/courses?page=invalid')
            .set('Authorization', `Bearer ${instructorToken}`);

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Invalid pagination parameters');
        });

        it('should handle invalid limit parameter', async () => {
          const res = await request(app)
            .get('/api/courses?limit=0')
            .set('Authorization', `Bearer ${instructorToken}`);

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Invalid pagination parameters');
        });
      });

      describe('Authentication', () => {
        it('should return 401 without token', async () => {
          const res = await request(app).get('/api/courses');
          expect(res.status).toBe(401);
        });
      });
    });

    describe('GET /api/courses/:courseCode', () => {
      it('should get course by courseCode', async () => {
        const res = await request(app)
          .get('/api/courses/CS101')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('courseCode', 'CS101');
      });

      it('should return 404 for non-existent course', async () => {
        const res = await request(app)
          .get('/api/courses/NOTFOUND101')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(404);
      });
    });
  });

  // 2. Course Creation and Validation Tests
  describe('Course Creation and Validation', () => {
    describe('POST /api/courses', () => {
      const newCourse = {
        courseCode: 'CS103',
        title: 'Advanced Programming',
        department: 'Computer Science',
        credits: 3,
        semester: 'Fall 2024',
        capacity: 30,
        description: 'Advanced programming concepts',
        duration: 16
      };

      describe('Authorization', () => {
        it('should create course with instructor token', async () => {
          const res = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send(newCourse);

          expect(res.status).toBe(201);
          expect(res.body.course).toHaveProperty('courseCode', newCourse.courseCode);
        });

        it('should not allow students to create courses', async () => {
          const res = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${studentToken}`)
            .send(newCourse);

          expect(res.status).toBe(403);
        });
      });

      describe('Validation', () => {
        it('should validate required fields when creating course', async () => {
          const incompleteCourse = {
            courseCode: 'CS105',
            title: '',
            department: 'Computer Science',
            credits: 3,
            semester: 'Fall 2024',
            capacity: 30
          };

          const res = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send(incompleteCourse);

          expect(res.status).toBe(400);
          expect(res.body).toHaveProperty('message');
        });

        it('should validate credit hours range', async () => {
          const invalidCourse = {
            ...newCourse,
            credits: 0
          };

          const res = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send(invalidCourse);

          expect(res.status).toBe(400);
        });
      });
    });
  });

  // 3. Course Update Tests
  describe('Course Update', () => {
    describe('PUT /api/courses/:courseCode', () => {
      it('should update course with valid data', async () => {
        const updates = {
          title: 'Updated Programming Course',
          credits: 4,
          capacity: 35
        };

        const res = await request(app)
          .put('/api/courses/CS101')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send(updates);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe(updates.title);
        expect(res.body.credits).toBe(updates.credits);
      });

      it('should return 404 for non-existent course update', async () => {
        const res = await request(app)
          .put('/api/courses/FAKE101')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({ title: 'New Title' });

        expect(res.status).toBe(404);
      });

      it('should validate course data on update', async () => {
        const res = await request(app)
          .put('/api/courses/CS101')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({ credits: 'invalid' });

        expect(res.status).toBe(400);
      });
    });
  });

  // 4. Course Deletion Tests
  describe('Course Deletion', () => {
    describe('DELETE /api/courses/:courseCode', () => {
      it('should delete existing course', async () => {
        const res = await request(app)
          .delete('/api/courses/CS101')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Course deleted successfully');

        const checkCourse = await Course.findOne({ courseCode: 'CS101' });
        expect(checkCourse).toBeNull();
      });

      it('should return 404 for non-existent course deletion', async () => {
        const res = await request(app)
          .delete('/api/courses/FAKE101')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(404);
      });
    });
  });

  // 5. Course Sorting Tests
  describe('Course Sorting', () => {
    describe('GET /api/courses/sort', () => {
      it('should sort courses using quicksort', async () => {
        const res = await request(app)
          .get('/api/courses/sort?field=credits&algorithm=quick')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.algorithm).toBe('quick');
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should sort courses using mergesort', async () => {
        const res = await request(app)
          .get('/api/courses/sort?field=credits&algorithm=merge')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.algorithm).toBe('merge');
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should handle invalid sorting algorithm', async () => {
        const res = await request(app)
          .get('/api/courses/sort?field=title&algorithm=invalid')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should return 400 if sorting field is missing', async () => {
        const res = await request(app)
          .get('/api/courses/sort')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(400);
      });
    });
  });

  // 6. Error Handling Tests
  describe('Error Handling', () => {
    describe('Database Errors', () => {
      it('should handle database errors in getAllCourses', async () => {
        jest.spyOn(Course, 'find').mockImplementationOnce(() => {
          throw new Error('Database error');
        });

        const res = await request(app)
          .get('/api/courses')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Database error');
      });

      it('should handle database errors in createCourse', async () => {
        jest.spyOn(Course.prototype, 'save').mockImplementationOnce(() => {
          throw new Error('Save error');
        });

        const res = await request(app)
          .post('/api/courses')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            courseCode: 'CS104',
            title: 'Test Course',
            department: 'Computer Science',
            credits: 3,
            semester: 'Fall 2024',
            capacity: 30
          });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Save error');
      });

      it('should handle errors in getCourse', async () => {
        jest.spyOn(Course, 'findOne').mockImplementationOnce(() => {
          throw new Error('Database error');
        });

        const res = await request(app)
          .get('/api/courses/CS101')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Database error');
      });

      it('should handle errors in updateCourse', async () => {
        jest.spyOn(Course, 'findOneAndUpdate').mockImplementationOnce(() => {
          throw new Error('Update error');
        });

        const res = await request(app)
          .put('/api/courses/CS101')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({ title: 'Updated Course' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Update error');
      });

      it('should handle errors in deleteCourse', async () => {
        jest.spyOn(Course, 'findOneAndDelete').mockImplementationOnce(() => {
          throw new Error('Delete error');
        });

        const res = await request(app)
          .delete('/api/courses/CS101')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Delete error');
      });

      it('should handle errors in sortCourses', async () => {
        jest.spyOn(Course, 'find').mockImplementationOnce(() => {
          throw new Error('Sort error');
        });

        const res = await request(app)
          .get('/api/courses/sort?field=title')
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Sort error');
      });
    });
  });
});