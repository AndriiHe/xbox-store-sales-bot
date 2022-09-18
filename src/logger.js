const { createLogger, format: { printf}, transports } = require('winston');

module.exports = createLogger({
  format: printf(({ level, message }) => `${new Date().toISOString()} [${level}]: ${message}`),
  transports: [new transports.Console()],
});
