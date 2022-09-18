const { jobTypes } = require('../jobs');

module.exports = ({ queue, logger }) => () => {
  queue.add({ type: jobTypes.SYNC_EXCHANGE_RATES });
  logger.info(`${ jobTypes.SYNC_EXCHANGE_RATES } job successfully scheduled`);
}
