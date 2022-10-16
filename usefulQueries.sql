WITH targetCurrency AS (
  VALUES('UAH')
), exchangeRates AS (
  SELECT jsonb_object_agg(r.name, c."exchangeRates")
  FROM currencies c LEFT JOIN regions r on c.code = r.currency
  WHERE r.name IS NOT NULL
), plainPrices AS (
  select DISTINCT
    cp."productId",
    row_number() over (partition by cp."productId" order by ROUND((cp.price -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> (table targetCurrency))::numeric, 2)) AS rank,
    region,
    cp."endDate",
    cp."requiredProductId",
    ROUND((cp.price -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> (table targetCurrency))::numeric, 2) AS "price",
    ROUND((cp."recommendedPrice" -> "region")::numeric * ((SELECT * FROM exchangeRates) -> "region" -> (table targetCurrency))::numeric, 2) AS "recommendedPrice"
  FROM prices cp
         CROSS JOIN jsonb_object_keys(price) AS region
--   LEFT JOIN prices pp on cp."productId" = pp."productId" AND pp."fetchedAt" = CURRENT_DATE - interval '1 day' AND pp.platform = 'Windows.Xbox' AND pp."requiredProductId" = cp."requiredProductId"
  WHERE cp."fetchedAt"=CURRENT_DATE
--     AND "productId" ILIKE 'CF%'
    AND region = 'TR'
    AND cp.platform = 'Windows.Xbox'
--     AND (cp.price->>region)::numeric < (pp.price->>region)::numeric
), topPrices AS (
  SELECT
    p."productId",
    pr.name,
    rp.name AS "requiredProduct",
    p.region,
    p.price,
    p."endDate",
    p."recommendedPrice",
    ROUND(CASE WHEN "recommendedPrice" = 0 THEN 0 ELSE ("recommendedPrice" - "price")/"recommendedPrice" END, 2) AS discount,
    'https://www.xbox.com/'|| r.locale || '/games/store/_/' || "productId" AS link
  FROM plainPrices p
         LEFT JOIN regions r ON r.name = p.region
         LEFT JOIN products pr ON pr.id = p."productId"
         LEFT JOIN products rp ON rp.id = p."requiredProductId"
  WHERE rank = 1
) SELECT * FROM topPrices ORDER BY discount DESC, "recommendedPrice" DESC;
