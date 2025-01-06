const Redis = require("redis");
const logger = require("./logger");

const createRedisClient = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      connect: async () => { },
      on: () => { },
      get: async () => null,
      setEx: async () => { },
      quit: async () => { }
    };
  }

  return Redis.createClient({
    url: process.env.REDIS_URL,
  });
};

const redisClient = createRedisClient();

redisClient.on("error", (error) => {
  logger.error("Redis Client Error:", error);
});

redisClient.on("connect", () => {
  logger.info("Redis Client Connected");
});

const connectRedis = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await redisClient.connect();
    } catch (error) {
      logger.error("Redis connection error:", error);
      process.exit(1);
    }
  }
};

module.exports = { redisClient, connectRedis };