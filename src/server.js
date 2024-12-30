require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/database");
const { connectRedis } = require("./config/redis");

const start = async () => {
  await connectDB();
  await connectRedis();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
};

if (require.main === module) {
  start();
}

module.exports = { start };