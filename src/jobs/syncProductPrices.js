const { mergeMap, tap } = require('rxjs/operators');
const { count } = require('rxjs');
const store = require('../store');
const { getProducts, createProductPrices } = require('../products');

module.exports = ({ db, logger, region }) => getProducts({ db }).pipe(
  tap(() => logger.info(`Fetching product details for ${region} region...`)),
  mergeMap(products => store.getProductsDetails(products.map(({ id }) => id), region)),
  mergeMap(products => createProductPrices({ db, products })),
  count(),
);
