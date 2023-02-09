import { join } from "path";
import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf } = format;

const LOG_DIR = "logs";

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}] ${message}`;
});

export const logger = createLogger({
  level: "debug",
  format: combine(timestamp(), logFormat),
  transports: [
    new transports.File({
      filename: join(LOG_DIR, "error.log"),
      level: "error",
    }),
    new transports.File({ filename: join(LOG_DIR, "combined.log") }),
  ],
});
