const errorHandler = require('../../../src/middleware/errorHandler');
const logger = require('../../../src/config/logger');

// Mock logger
jest.mock('../../../src/config/logger', () => ({
    error: jest.fn()
}));

describe('Error Handler Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
        mockReq = {
            path: '/test',
            method: 'GET'
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();

        // Clear mocks before each test
        jest.clearAllMocks();
    });

    it('should handle validation errors', () => {
        const validationError = {
            name: 'ValidationError',
            errors: {
                field1: { message: 'Field1 is required' },
                field2: { message: 'Field2 is invalid' }
            }
        };

        errorHandler(validationError, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Validation Error',
            errors: ['Field1 is required', 'Field2 is invalid']
        });
        expect(logger.error).toHaveBeenCalledWith({
            message: undefined,
            stack: undefined,
            path: '/test',
            method: 'GET'
        });
    });

    it('should handle duplicate key errors', () => {
        const duplicateError = {
            code: 11000,
            keyPattern: { email: 1 }
        };

        errorHandler(duplicateError, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Duplicate key error',
            field: 'email'
        });
    });

    it('should handle errors with custom status', () => {
        const customError = {
            status: 403,
            message: 'Forbidden access'
        };

        errorHandler(customError, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Forbidden access'
        });
    });

    it('should handle generic errors', () => {
        const genericError = new Error('Something went wrong');

        errorHandler(genericError, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Something went wrong'
        });
    });

    it('should use default message for errors without message', () => {
        const errorWithoutMessage = {};

        errorHandler(errorWithoutMessage, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Internal server error'
        });
    });
});