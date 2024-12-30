const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { redisClient } = require('../src/config/redis');

let mongod;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Clear Redis cache
  await redisClient.flushAll();
});

afterEach(async () => {
  // Clear collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }

  // Clear Redis cache
  await redisClient.flushAll();
});

afterAll(async () => {
  // Cleanup after all tests
  await mongoose.disconnect();
  await mongod.stop();
  await redisClient.quit();
});