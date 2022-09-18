const { jobTypes } = require('../jobs');
const { getRegions } = require('../regions');
const { mergeMap, tap } = require('rxjs/operators');
const { from } = require('rxjs');

module.exports = ({ queue, db, logger }) => () => getRegions({ db }).pipe(
  mergeMap(regions => from(regions)),
  tap(region => queue.add({ type: jobTypes.SYNC_PRODUCTS, region })),
).subscribe(
  (region) => logger.info(`${ jobTypes.SYNC_PRODUCTS } job successfully scheduled for ${ region } region`),
  (error) => logger.error(error),
);
