const { redisClient } = require("../config/redis");
const logger = require("../config/logger");

const cache = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      res.originalJson = res.json;
      res.json = async (data) => {
        await redisClient.setEx(key, duration, JSON.stringify(data));
        res.originalJson(data);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error:", error);
      next();
    }
  };
};

module.exports = cache;
