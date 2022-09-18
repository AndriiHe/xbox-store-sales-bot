const jobTypes = require('./jobTypes');
const syncProducts = require('./syncProducts');
const syncProductPrices = require('./syncProductPrices');
const syncExchangeRates = require('./syncExchangeRates');

const jobHandlers = {
  [jobTypes.SYNC_EXCHANGE_RATES]: syncExchangeRates,
  [jobTypes.SYNC_PRODUCTS]: syncProducts,
  [jobTypes.SYNC_PRODUCT_PRICES]: syncProductPrices,
}

const handleJob = ({ db, logger }) => (job, done) => {
  const type = job.data.type;
  logger.info(`Starting ${type} ${job.id} job...`)
  jobHandlers[type]({ db, logger, ...job.data }).subscribe(
    () => {
      logger.info(`${type} ${job.id} job successfully finished`);
      done();
    },
    (error) => {
      logger.error(`${type} ${job.id} job failed`, error);
      done(error);
    },
  );
}

module.exports = { handleJob, jobTypes };
