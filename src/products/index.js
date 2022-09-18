const { map } = require('rxjs/operators');

const getProducts = ({ db }) => db.query(`SELECT "id", "name" FROM "products" WHERE "isDeleted" = FALSE`).pipe(map(({ rows }) => rows));

const createProducts = ({ db, products }) => db.query(
  `
    INSERT INTO "products"("id", "name", "description", "image", "categories")
    SELECT * FROM UNNEST ($1::text[], $2::text[], $3::text[], $4::text[], $5::jsonb[])
    ON CONFLICT("id")
    DO UPDATE SET name = excluded.name, description = excluded.description, image = excluded.image, categories = excluded.categories;
  `,
  [
    products.map(({ id }) => id),
    products.map(({ name }) => name),
    products.map(({ description }) => description),
    products.map(({ image }) => image),
    products.map(({ categories }) => JSON.stringify(categories)),
  ]
);

const createProductPrices = ({ db, products }) => {
  const items = products.reduce((items, product) => [
    ...items,
    ...product.prices.map(price => ({ id: product.id, ...price }))
  ], []);
  return db.query(
    `
        INSERT INTO prices("productId", "price", "recommendedPrice", "requiredProductId", "platform")
        SELECT * FROM UNNEST ($1::text[], $2::jsonb[], $3::jsonb[], $4::text[], $5::text[])
        ON CONFLICT("productId", "fetchedAt", "requiredProductId", "platform")
        DO UPDATE SET
            "price" = (SELECT "price" FROM prices WHERE "productId" = excluded."productId" AND "fetchedAt" = excluded."fetchedAt" AND "requiredProductId" = excluded."requiredProductId" AND "platform" = excluded."platform")::jsonb || excluded.price::jsonb,
            "recommendedPrice" = (SELECT "recommendedPrice" FROM prices WHERE "productId" = excluded."productId" AND "fetchedAt" = excluded."fetchedAt" AND "requiredProductId" = excluded."requiredProductId" AND "platform" = excluded."platform")::jsonb || excluded."recommendedPrice"::jsonb;
    `,
    [
      items.map(({ id }) => id),
      items.map(({ price }) => JSON.stringify(price)),
      items.map(({ recommendedPrice }) => JSON.stringify(recommendedPrice)),
      items.map(({ requiredProductId }) => requiredProductId),
      items.map(({ platform }) => platform),
    ]
  );
};

module.exports = { getProducts, createProducts, createProductPrices };
