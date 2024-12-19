const Redis = require("redis");
const logger = require("./logger");

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  logger.error("Redis Client Error:", error);
});

redisClient.on("connect", () => {
  logger.info("Redis Client Connected");
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error("Redis connection error:", error);
    process.exit(1);
  }
};

module.exports = { redisClient, connectRedis };
