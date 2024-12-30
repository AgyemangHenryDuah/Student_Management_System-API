const cache = require('../../../src/middleware/cache');
const { redisClient } = require('../../../src/config/redis');
const logger = require('../../../src/config/logger');

// Mock dependencies
jest.mock('../../../src/config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        setEx: jest.fn()
    }
}));

jest.mock('../../../src/config/logger', () => ({
    error: jest.fn()
}));

describe('Cache Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;
    const CACHE_DURATION = 3600;

    beforeEach(() => {
        mockReq = {
            originalUrl: '/api/test'
        };
        mockRes = {
            json: jest.fn(),
            originalJson: undefined
        };
        nextFunction = jest.fn();

        // Clear all mocks
        jest.clearAllMocks();
    });

    it('should return cached data if available', async () => {
        const cachedData = { id: 1, name: 'Test' };
        redisClient.get.mockResolvedValue(JSON.stringify(cachedData));

        const middleware = cache(CACHE_DURATION);
        await middleware(mockReq, mockRes, nextFunction);

        expect(redisClient.get).toHaveBeenCalledWith('cache:/api/test');
        expect(mockRes.json).toHaveBeenCalledWith(cachedData);
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next and set up caching if no cached data', async () => {
        redisClient.get.mockResolvedValue(null);
        const responseData = { id: 2, name: 'New Data' };

        const middleware = cache(CACHE_DURATION);
        await middleware(mockReq, mockRes, nextFunction);

        // Simulate response
        await mockRes.json(responseData);

        expect(redisClient.get).toHaveBeenCalledWith('cache:/api/test');
        expect(redisClient.setEx).toHaveBeenCalledWith(
            'cache:/api/test',
            CACHE_DURATION,
            JSON.stringify(responseData)
        );
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle redis errors gracefully', async () => {
        const error = new Error('Redis connection failed');
        redisClient.get.mockRejectedValue(error);

        const middleware = cache(CACHE_DURATION);
        await middleware(mockReq, mockRes, nextFunction);

        expect(logger.error).toHaveBeenCalledWith('Cache middleware error:', error);
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should preserve original json method after caching', async () => {
        redisClient.get.mockResolvedValue(null);
        const responseData = { id: 3, name: 'Test Data' };
        mockRes.originalJson = jest.fn();

        const middleware = cache(CACHE_DURATION);
        await middleware(mockReq, mockRes, nextFunction);

        // Simulate response
        await mockRes.json(responseData);

        expect(mockRes.originalJson).toHaveBeenCalledWith(responseData);
        expect(redisClient.setEx).toHaveBeenCalledWith(
            'cache:/api/test',
            CACHE_DURATION,
            JSON.stringify(responseData)
        );
    });
});