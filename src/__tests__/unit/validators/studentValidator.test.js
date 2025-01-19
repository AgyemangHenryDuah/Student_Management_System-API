const { validateStudent } = require('../../../validators/studentValidator');

describe('Student Validator', () => {
    const validStudent = {
        studentId: 'STU123',
        grade: 10,
        gpa: 3.5,
        department: 'Computer Science',
        email: 'student@university.edu',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
    };

    describe('POST validation', () => {
        it('should validate a valid student', () => {
            const { error } = validateStudent(validStudent, 'POST');
            expect(error).toBeUndefined();
        });

        describe('Required fields', () => {
            it('should require studentId', () => {
                const testStudent = { ...validStudent };
                delete testStudent.studentId;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('studentId');
            });

            it('should require grade', () => {
                const testStudent = { ...validStudent };
                delete testStudent.grade;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('grade');
            });

            it('should require gpa', () => {
                const testStudent = { ...validStudent };
                delete testStudent.gpa;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('gpa');
            });

            it('should require department', () => {
                const testStudent = { ...validStudent };
                delete testStudent.department;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('department');
            });

            it('should require email', () => {
                const testStudent = { ...validStudent };
                delete testStudent.email;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('email');
            });

            it('should require firstName', () => {
                const testStudent = { ...validStudent };
                delete testStudent.firstName;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('firstName');
            });

            it('should require lastName', () => {
                const testStudent = { ...validStudent };
                delete testStudent.lastName;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('lastName');
            });

            it('should require password', () => {
                const testStudent = { ...validStudent };
                delete testStudent.password;
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('password');
            });
        });

        describe('Field validations', () => {
            it('should validate grade minimum value', () => {
                const testStudent = { ...validStudent, grade: 0 };
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('grade');
            });

            it('should validate grade maximum value', () => {
                const testStudent = { ...validStudent, grade: 13 };
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('grade');
            });

            it('should validate gpa minimum value', () => {
                const testStudent = { ...validStudent, gpa: -0.1 };
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('gpa');
            });

            it('should validate gpa maximum value', () => {
                const testStudent = { ...validStudent, gpa: 4.1 };
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('gpa');
            });

            it('should validate email format', () => {
                const testStudent = { ...validStudent, email: 'invalid-email' };
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('email');
            });

            it('should validate password minimum length', () => {
                const testStudent = { ...validStudent, password: '12345' };
                const { error } = validateStudent(testStudent, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('password');
            });
        });
    });

    describe('PUT validation', () => {
        it('should not allow empty update', () => {
            const { error } = validateStudent({}, 'PUT');
            expect(error).toBeDefined(); // min(1) validation
        });

        it('should allow valid partial updates', () => {
            const partialUpdate = {
                firstName: 'Jane',
                email: 'jane.doe@university.edu'
            };
            const { error } = validateStudent(partialUpdate, 'PUT');
            expect(error).toBeUndefined();
        });

        it('should validate grade range on update', () => {
            const partialUpdate = {
                grade: 13
            };
            const { error } = validateStudent(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('grade');
        });

        it('should validate gpa range on update', () => {
            const partialUpdate = {
                gpa: 4.1
            };
            const { error } = validateStudent(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('gpa');
        });

        it('should validate email format on update', () => {
            const partialUpdate = {
                email: 'invalid-email'
            };
            const { error } = validateStudent(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('email');
        });

        it('should validate password length on update', () => {
            const partialUpdate = {
                password: '12345'
            };
            const { error } = validateStudent(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('password');
        });

        it('should allow update of single field', () => {
            const singleFieldUpdate = {
                firstName: 'Jane'
            };
            const { error } = validateStudent(singleFieldUpdate, 'PUT');
            expect(error).toBeUndefined();
        });

        it('should allow update of multiple fields', () => {
            const multiFieldUpdate = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@university.edu'
            };
            const { error } = validateStudent(multiFieldUpdate, 'PUT');
            expect(error).toBeUndefined();
        });
    });
});