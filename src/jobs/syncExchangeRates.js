const { from, count } = require('rxjs');
const { mergeMap, tap } = require('rxjs/operators');
const httpClient = require('../httpClient');
const { getCurrencies, updateExchangeRates } = require('../exchangeRates');

const getUrl = currency => `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${currency}`;

module.exports = ({ db, logger }) => getCurrencies({ db }).pipe(
  mergeMap(currencies => from(currencies)),
  mergeMap(currency => httpClient.get(getUrl(currency)).pipe(
    mergeMap(({ response }) => updateExchangeRates({ db, currency, exchangeRates: response?.body?.conversion_rates })),
    tap(() => logger.info(`Updated exchange rates for ${currency} currency`)),
  )),
  count(),
);
