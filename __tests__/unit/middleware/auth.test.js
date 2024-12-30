const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../../../src/middleware/auth');
const User = require('../../../src/models/User');

// Mock the User model
jest.mock('../../../src/models/User');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;
  const JWT_SECRET = process.env.JWT_SECRET;

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
      user: undefined
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('auth middleware', () => {
    it('should return 401 if no token is provided', async () => {
      mockReq.header.mockReturnValue(undefined);

      await auth(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.header.mockReturnValue('Bearer invalid_token');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token message if user is not found', async () => {
      const userId = 'nonexistent_user_id';
      mockReq.header.mockReturnValue('Bearer valid_token');
      jwt.verify.mockReturnValue({ id: userId });
      User.findById.mockResolvedValue(null);

      await auth(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should set user in request and call next() for valid token', async () => {
      const mockUser = { id: 'user_id', name: 'Test User' };
      mockReq.header.mockReturnValue('Bearer valid_token');
      jwt.verify.mockReturnValue({ id: mockUser.id });
      User.findById.mockResolvedValue(mockUser);

      await auth(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should call next() if user has required role', () => {
      const middleware = authorize('admin');
      mockReq.user = { role: 'admin' };

      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      const middleware = authorize('admin');
      mockReq.user = { role: 'user' };

      middleware(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should work with multiple roles', () => {
      const middleware = authorize('admin', 'student');
      mockReq.user = { role: 'student' };

      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});