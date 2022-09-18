DO
$$
DECLARE migration_name VARCHAR(500) = '202204181532_create_prices_table';
BEGIN
IF NOT EXISTS(SELECT * FROM migrations WHERE name = migration_name) THEN

    INSERT INTO migrations(name) VALUES (migration_name);

    CREATE TABLE IF NOT EXISTS "prices"
    (
        "productId"         VARCHAR(20) NOT NULL,
        "requiredProductId" VARCHAR(20) NOT NULL,
        "platform"          VARCHAR(20) NOT NULL,
        "price"             jsonb       NOT NULL,
        "recommendedPrice"  jsonb       NOT NULL,
        "fetchedAt"         DATE        NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("productId", "fetchedAt", "requiredProductId", "platform"),
        CONSTRAINT "fk_productId" FOREIGN KEY("productId") REFERENCES products("id")
    );

end if;
end;
$$
