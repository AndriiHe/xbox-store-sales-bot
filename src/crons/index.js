const schedule = require('node-schedule');
const syncExchangeRates = require('./syncExchangeRates');
const syncProducts = require('./syncProducts');
const syncProductPrices = require('./syncProductPrices');

module.exports = {
  setup: ({ db, queue, logger }) => {
    schedule.scheduleJob('Sync exchange rates', { rule: '0 1 * * *' }, syncExchangeRates({ queue, logger }));
    schedule.scheduleJob('Sync products', { rule: '0 */12 * * *' }, syncProducts({ queue, db, logger }));
    schedule.scheduleJob('Sync product prices', { rule: '0 */6 * * *' }, syncProductPrices({ queue, db, logger }));
  },
};
