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
        INSERT INTO prices("productId", "price", "recommendedPrice", "requiredProductId", "platform", "endDate")
        SELECT * FROM UNNEST ($1::text[], $2::jsonb[], $3::jsonb[], $4::text[], $5::text[], $6::timestamp[])
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
      items.map(({ endDate }) => endDate),
    ]
  );
};

const getProductPrices = ({ db, page, perPage, regions, currency, name, platform }) => db.query(
  `
    WITH
    exchangeRates AS (
      SELECT jsonb_object_agg(r.name, c."exchangeRates")
      FROM currencies c LEFT JOIN regions r on c.code = r.currency
      WHERE r.name IS NOT NULL
    ), plainPrices AS (
      select DISTINCT
        cp."productId",
        row_number() over (partition by cp."productId" order by ROUND((cp.price -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> $1)::numeric, 2)) AS rank,
        region,
        cp."endDate",
        cp."requiredProductId",
        ROUND((cp.price -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> $1)::numeric, 2) AS "price",
        ROUND((cp."recommendedPrice" -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> $1)::numeric, 2) AS "recommendedPrice"
      FROM prices cp
      CROSS JOIN jsonb_object_keys(price) AS region
      WHERE cp."fetchedAt"=CURRENT_DATE
        AND cp.platform = $4
        AND region = ANY($2::text[])
    ), topPrices AS (
      SELECT
        p.region,
        p.price,
        p."endDate",
        p."recommendedPrice",
        ROUND(CASE WHEN "recommendedPrice" = 0 THEN 0 ELSE ("recommendedPrice" - "price")/"recommendedPrice" END, 2) * 100 AS discount,
        jsonb_build_object(
          'name', pr.name,
          'id', pr.id,
          'link', 'https://www.xbox.com/'|| r.locale || '/games/store/_/' || pr.id
          ) AS "product",
        jsonb_build_object(
          'name', rp.name,
          'id', rp.id,
          'link', 'https://www.xbox.com/'|| r.locale || '/games/store/_/' || rp.id
          ) AS "requiredProduct"
      FROM plainPrices p
             LEFT JOIN regions r ON r.name = p.region
             LEFT JOIN products pr ON pr.id = p."productId"
             LEFT JOIN products rp ON rp.id = p."requiredProductId"
      WHERE rank = 1
        AND pr.name ILIKE '%' || $3 || '%'
    ) SELECT *, $1 AS currency FROM topPrices ORDER BY discount DESC, "recommendedPrice" DESC LIMIT $5 OFFSET $6;
  `,
  [
    currency,
    regions,
    name,
    platform,
    perPage,
    perPage * (page - 1),
  ]
).pipe(map(({ rows }) => rows.map(p => ({
  ...p,
  price: +p.price,
  recommendedPrice: +p.recommendedPrice,
  discount: +p.discount,
  requiredProduct: p.requiredProduct.id ? p.requiredProduct : undefined,
}))));

module.exports = { getProducts, createProducts, createProductPrices, getProductPrices };
