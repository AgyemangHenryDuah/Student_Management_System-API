const { validateCourse } = require('../../../validators/courseValidator');

describe('Course Validator', () => {
  const validCourse = {
    courseCode: 'CS101',
    credits: 3,
    semester: 'Fall 2023',
    capacity: 30,
    title: 'Introduction to Programming',
    description: 'Basic programming concepts',
    duration: 16,
    department: 'Computer Science'
  };

  describe('POST validation', () => {
    it('should validate a valid course', () => {
      const { error } = validateCourse(validCourse, 'POST');
      expect(error).toBeUndefined();
    });

    it('should require courseCode', () => {
      const { error } = validateCourse({ ...validCourse, courseCode: undefined }, 'POST');
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('courseCode');
    });

    it('should validate credits range', () => {
      const { error } = validateCourse({ ...validCourse, credits: 7 }, 'POST');
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('credits');
    });
  });

  describe('PUT validation', () => {
    it('should allow partial updates', () => {
      const { error } = validateCourse({ title: 'New Title' }, 'PUT');
      expect(error).toBeUndefined();
    });
  });
});