const { map } = require('rxjs/operators');

const upsertUser = ({ db, user }) => db.query(
  `
    INSERT INTO users(id, name, currency, "updatedAt") VALUES ($1, $2, $3, $4)
    ON CONFLICT(id) DO UPDATE SET ${Object.keys(user).map(field => `${field}=excluded.${field}`).join(',')}
    RETURNING *;
  `, [
    user.id,
    user.name,
    user.currency,
    new Date().toISOString(),
  ]).pipe(map(({ rows }) => rows[0] || undefined));

const getUser = ({ db, id }) => db.query(`SELECT * FROM users where id = $1`, [id]).pipe(
  map(({ rows }) => rows[0] || undefined),
);

module.exports = { upsertUser, getUser };
