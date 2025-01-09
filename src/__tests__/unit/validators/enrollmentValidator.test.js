const { validateEnrollment } = require('../../../validators/enrollmentValidator');

describe('Enrollment Validator', () => {
    const validEnrollment = {
        studentId: 'S12345',
        courseCode: 'CS101',
        grade: 'A',
    };

    describe('POST validation', () => {
        it('should validate a valid enrollment', () => {
            const { error } = validateEnrollment(validEnrollment, 'POST');
            expect(error).toBeUndefined();
        });

        it('should require studentId', () => {
            const { error } = validateEnrollment({ ...validEnrollment, studentId: undefined }, 'POST');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('studentId');
        });

        it('should require courseCode', () => {
            const { error } = validateEnrollment({ ...validEnrollment, courseCode: undefined }, 'POST');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('courseCode');
        });

        it('should allow grade to be optional', () => {
            const { error } = validateEnrollment({ ...validEnrollment, grade: undefined }, 'POST');
            expect(error).toBeUndefined();
        });

        it('should only allow valid grade values', () => {
            const { error } = validateEnrollment({ ...validEnrollment, grade: 'Z' }, 'POST');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('grade');
        });
    });

    describe('PUT validation', () => {
        it('should allow partial updates (grade is optional)', () => {
            const { error } = validateEnrollment({ grade: 'B' }, 'PUT');
            expect(error).toBeUndefined();
        });

        it('should allow studentId and courseCode to be omitted in PUT request', () => {
            const { error } = validateEnrollment({ grade: 'C' }, 'PUT');
            expect(error).toBeUndefined();
        });

        it('should fail if studentId is provided but empty', () => {
            const { error } = validateEnrollment({ studentId: '', courseCode: 'CS101', grade: 'B' }, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('studentId');
        });

        it('should fail if courseCode is provided but empty', () => {
            const { error } = validateEnrollment({ studentId: 'S12345', courseCode: '', grade: 'A' }, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('courseCode');
        });
    });
});
