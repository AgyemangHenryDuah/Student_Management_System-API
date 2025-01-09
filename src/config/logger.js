const winston = require("winston");
require("winston-daily-rotate-file");

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, timestamp, message, }) => {
    return `${level}-${timestamp}: ${message}`;
  })
);

const logger = winston.createLogger({
  level: "info",
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: "error.log",
      level: "error"
    }),
    new winston.transports.File({
      filename: "combined.log"
    }),
  ],
});

module.exports = logger;
