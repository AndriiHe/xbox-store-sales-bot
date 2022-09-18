const { map } = require('rxjs/operators');

const getCurrencies = ({ db }) => db.query(`SELECT "code" FROM "currencies" WHERE "isDeleted" = FALSE`).pipe(
  map(({ rows }) => rows.map(({ code }) => code)),
);

const updateExchangeRates = ({ db, currency, exchangeRates }) => db.query(
  `
    UPDATE "currencies"
    SET "exchangeRates" = $2::jsonb, "updatedAt" = NOW()
    WHERE "code" = $1
  `,
  [currency, JSON.stringify(exchangeRates)]
);

module.exports = { getCurrencies, updateExchangeRates };
