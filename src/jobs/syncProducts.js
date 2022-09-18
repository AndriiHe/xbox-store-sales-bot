const { map, mergeMap, tap } = require('rxjs/operators');
const store = require('../store');
const { getProducts, createProducts } = require('../products');

module.exports = ({ db, logger, region }) => getProducts({ db }).pipe(
  tap(() => logger.info(`Fetching product list for ${ region } region...`)),
  map(existingProducts => existingProducts.map(({ id }) => id)),
  mergeMap(existingProductIds => store.getProducts(region).pipe(
    map(productIds => productIds.filter(productId => !existingProductIds.includes(productId))),
    mergeMap(productIds => store.getProductsDetails(productIds, region)),
    tap(() => logger.info(`Fetched product list for ${ region } region`)),
    mergeMap(products => createProducts({ db, products })),
    tap(({ rowCount }) => logger.info(`Stored ${ rowCount } new products for ${ region } region`)),
  )),
);
