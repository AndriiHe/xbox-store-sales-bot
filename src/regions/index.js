const { map } = require('rxjs/operators');

const getRegions = ({ db }) => db.query(`SELECT "name" FROM "regions" WHERE "isDeleted" = FALSE`).pipe(map(({ rows }) => rows.map(({name}) => name)));

module.exports = { getRegions };
