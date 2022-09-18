WITH targetCurrency AS (
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
) SELECT * from topPrices ORDER BY discount DESC, "recommendedPrice" DESC;
