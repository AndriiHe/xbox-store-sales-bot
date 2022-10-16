const { map } = require('rxjs/operators');

const updateSubscription = ({ db, subscription }) => db.query(
  `
    INSERT INTO "subscriptions"("id", "details", "createdAt", "updatedAt", "isActive", "isDeleted")
    VALUES (COALESCE($1, uuid_generate_v4()), COALESCE($2, '{}'::json), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, COALESCE($3, false), COALESCE($4, false))
    ON CONFLICT("id")
    DO UPDATE SET
    "details" = (SELECT "details" FROM subscriptions WHERE "id" = excluded."id")::jsonb || excluded.details::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP,
    "isActive" = excluded."isActive",
    "isDeleted" = excluded."isDeleted"
    RETURNING *;
  `,
  [
    subscription.id,
    subscription.details,
    subscription.isActive,
    subscription.isDeleted,
  ]
).pipe(
  map(({ rows }) => rows[0] || undefined),
);

const getSubscriptions = ({ db }) => db.query(`SELECT * FROM subscriptions WHERE "isActive" = true AND "isDeleted" != true;`).pipe(
  map(({ rows }) => rows)
);

module.exports = {
  updateSubscription,
  getSubscriptions,
};
