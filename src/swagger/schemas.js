const schemas = {
    // User Schema
    User: {
        type: "object",
        properties: {
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            password: { type: "string", format: "password", example: "securePass123" },
            role: { type: "string", enum: ["student", "instructor"], example: "student" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" }
        }
    },

    // Student Schema
    Student: {
        type: "object",
        properties: {
            user: { $ref: "#/components/schemas/User" },
            studentId: { type: "string", example: "STU2023001" },
            grade: { type: "number", minimum: 1, maximum: 12, example: 10 },
            gpa: { type: "number", minimum: 0, maximum: 4, example: 3.8 },
            department: { type: "string", example: "Computer Science" }
        }
    },

    // Instructor Schema
    Instructor: {
        type: "object",
        properties: {
            user: { $ref: "#/components/schemas/User" },
            department: { type: "string", example: "Computer Science" },
            title: {
                type: "string",
                enum: ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"],
                example: "Associate Professor"
            },
            specialization: { type: "string", example: "Artificial Intelligence" },
            officeHours: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        day: {
                            type: "string",
                            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                            example: "Monday"
                        },
                        startTime: { type: "string", example: "09:00" },
                        endTime: { type: "string", example: "11:00" }
                    }
                }
            },
            publications: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "Advanced AI Applications" },
                        year: { type: "integer", example: 2023 },
                        journal: { type: "string", example: "Journal of AI Research" }
                    }
                }
            }
        }
    },

    // Course Schema
    Course: {
        type: "object",
        properties: {
            courseCode: { type: "string", example: "CS101" },
            title: { type: "string", example: "Introduction to Programming" },
            department: { type: "string", example: "Computer Science" },
            instructor: { $ref: "#/components/schemas/User" },
            credits: { type: "integer", minimum: 1, maximum: 6, example: 3 },
            semester: { type: "string", example: "Fall 2023" },
            capacity: { type: "integer", minimum: 1, example: 30 }
        }
    },

    // Enrollment Schema
    Enrollment: {
        type: "object",
        properties: {
            student: { $ref: "#/components/schemas/Student" },
            course: { $ref: "#/components/schemas/Course" },
            enrollmentDate: { type: "string", format: "date-time" },
            grade: {
                type: "string",
                enum: ["A", "B", "C", "D", "F", "IP"],
                example: "IP"
            }
        }
    },

    // Auth Responses
    LoginResponse: {
        type: "object",
        properties: {
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            role: { type: "string", enum: ["student", "instructor"], example: "student" },
            message: { type: "string", example: "Login Successful" }
        }
    },

    // Error Response
    ErrorResponse: {
        type: "object",
        properties: {
            message: { type: "string", example: "Error message description" }
        }
    }
};

module.exports = schemas;