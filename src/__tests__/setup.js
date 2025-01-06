const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { redisClient } = require('../src/config/redis');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);


  await redisClient.flushAll();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }

  await redisClient.flushAll();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  await redisClient.quit();
});