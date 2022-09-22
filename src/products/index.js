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

const getChipestProduct = ({ db, name }) => db.query(`WITH targetCurrency AS (
  VALUES('UAH')
), exchangeRates AS (
  SELECT jsonb_object_agg(r.name, c."exchangeRates")
  FROM currencies c
         LEFT JOIN regions r on c.code = r.currency
  WHERE r.name IS NOT NULL
), plainPrices AS (
  select DISTINCT
    "productId",
    row_number() over (partition by "productId" order by ROUND((price -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> (table targetCurrency))::numeric, 2)) AS rank,
    region,
    "requiredProductId",
    ROUND((price -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> (table targetCurrency))::numeric, 2) AS "price",
    ROUND(("recommendedPrice" -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> (table targetCurrency))::numeric, 2) AS "recommendedPrice"
  FROM prices CROSS JOIN jsonb_object_keys(price) AS region
  WHERE "fetchedAt"=DATE(NOW()) AND platform = 'Windows.Xbox'
), topPrices AS (
  SELECT
    p."productId",
    pr.name,
    rp.name AS "requiredProduct",
    p.region,
    p.price,
    p."recommendedPrice",
    ROUND(CASE WHEN "recommendedPrice" = 0 THEN 0 ELSE ("recommendedPrice" - "price")/"recommendedPrice" END, 2) AS discount,
    'https://www.xbox.com/'|| r.locale || '/games/store/_/' || "productId" AS link
  FROM plainPrices p
         LEFT JOIN regions r ON r.name = p.region
         LEFT JOIN products pr ON pr.id = p."productId"
         LEFT JOIN products rp ON rp.id = p."requiredProductId"
  WHERE rank = 1
) SELECT * from topPrices WHERE name like '%${name}%' ORDER BY discount DESC, "recommendedPrice" DESC;
`).pipe(map(({ rows }) => rows))

module.exports = { getProducts, createProducts, createProductPrices, getChipestProduct };
