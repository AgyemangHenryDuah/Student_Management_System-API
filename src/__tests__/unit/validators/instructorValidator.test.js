const { validateInstructor } = require('../../../validators/instructorValidator');

describe('Instructor Validator', () => {
    const validInstructor = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@university.edu',
        password: 'password123',
        department: 'Computer Science',
        title: 'Professor',
        specialization: 'Machine Learning',
        officeHours: [
            {
                day: 'Monday',
                startTime: '09:00',
                endTime: '12:00'
            }
        ],
        publications: [
            {
                title: 'Introduction to AI',
                year: 2023,
                journal: 'IEEE'
            }
        ]
    };

    describe('POST validation', () => {
        it('should validate a valid instructor', () => {
            const { error } = validateInstructor(validInstructor, 'POST');
            expect(error).toBeUndefined();
        });

        describe('Required fields', () => {
            it('should require firstName', () => {
                const testInstructor = { ...validInstructor };
                delete testInstructor.firstName;
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('firstName');
            });

            it('should require lastName', () => {
                const testInstructor = { ...validInstructor };
                delete testInstructor.lastName;
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('lastName');
            });

            it('should require email', () => {
                const testInstructor = { ...validInstructor };
                delete testInstructor.email;
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('email');
            });

            it('should require department', () => {
                const testInstructor = { ...validInstructor };
                delete testInstructor.department;
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('department');
            });

            it('should require title', () => {
                const testInstructor = { ...validInstructor };
                delete testInstructor.title;
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('title');
            });

            it('should require specialization', () => {
                const testInstructor = { ...validInstructor };
                delete testInstructor.specialization;
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('specialization');
            });

            it('should require password', () => {
                const testInstructor = { ...validInstructor };
                delete testInstructor.password;
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('password');
            });
        });

        describe('Field validations', () => {
            it('should require a valid email format', () => {
                const testInstructor = { ...validInstructor, email: 'invalid-email' };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('email');
            });

            it('should require password with minimum 6 characters', () => {
                const testInstructor = { ...validInstructor, password: '12345' };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('password');
            });

            it('should validate title against allowed values', () => {
                const testInstructor = { ...validInstructor, title: 'Invalid Title' };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('title');
            });
        });

        describe('Office Hours validation', () => {
            it('should validate valid office hours', () => {
                const testInstructor = {
                    ...validInstructor,
                    officeHours: [
                        {
                            day: 'Monday',
                            startTime: '09:00',
                            endTime: '17:00'
                        }
                    ]
                };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeUndefined();
            });

            it('should validate invalid day', () => {
                const testInstructor = {
                    ...validInstructor,
                    officeHours: [
                        {
                            day: 'Sunday',
                            startTime: '09:00',
                            endTime: '17:00'
                        }
                    ]
                };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('officeHours');
            });

            it('should validate time format', () => {
                const testInstructor = {
                    ...validInstructor,
                    officeHours: [
                        {
                            day: 'Monday',
                            startTime: '25:00',
                            endTime: '17:00'
                        }
                    ]
                };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('officeHours');
            });
        });

        describe('Publications validation', () => {
            it('should validate valid publications', () => {
                const testInstructor = {
                    ...validInstructor,
                    publications: [
                        {
                            title: 'Test Publication',
                            year: 2023,
                            journal: 'Test Journal'
                        }
                    ]
                };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeUndefined();
            });

            it('should validate publication year range', () => {
                const testInstructor = {
                    ...validInstructor,
                    publications: [
                        {
                            title: 'Test Publication',
                            year: 1800,
                            journal: 'Test Journal'
                        }
                    ]
                };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeDefined();
                expect(error.details[0].path[0]).toBe('publications');
            });

            it('should allow optional journal', () => {
                const testInstructor = {
                    ...validInstructor,
                    publications: [
                        {
                            title: 'Test Publication',
                            year: 2023
                        }
                    ]
                };
                const { error } = validateInstructor(testInstructor, 'POST');
                expect(error).toBeUndefined();
            });
        });
    });

    describe('PUT validation', () => {
        it('should allow empty update', () => {
            const { error } = validateInstructor({}, 'PUT');
            expect(error).toBeDefined(); // min(1) validation
        });

        it('should allow partial updates', () => {
            const partialUpdate = {
                firstName: 'Jane',
                email: 'jane.doe@university.edu'
            };
            const { error } = validateInstructor(partialUpdate, 'PUT');
            expect(error).toBeUndefined();
        });

        it('should validate email format on update', () => {
            const partialUpdate = {
                email: 'invalid-email'
            };
            const { error } = validateInstructor(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('email');
        });

        it('should validate password length on update', () => {
            const partialUpdate = {
                password: '12345'
            };
            const { error } = validateInstructor(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('password');
        });

        it('should validate title against allowed values on update', () => {
            const partialUpdate = {
                title: 'Invalid Title'
            };
            const { error } = validateInstructor(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('title');
        });

        it('should validate office hours format on update', () => {
            const partialUpdate = {
                officeHours: [
                    {
                        day: 'Sunday',
                        startTime: '09:00',
                        endTime: '17:00'
                    }
                ]
            };
            const { error } = validateInstructor(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('officeHours');
        });

        it('should validate publications on update', () => {
            const partialUpdate = {
                publications: [
                    {
                        title: 'Test Publication',
                        year: 1800
                    }
                ]
            };
            const { error } = validateInstructor(partialUpdate, 'PUT');
            expect(error).toBeDefined();
            expect(error.details[0].path[0]).toBe('publications');
        });
    });
});