DO
$$
DECLARE migration_name VARCHAR(500) = '202204181429_create_products_table';
BEGIN
IF NOT EXISTS(SELECT * FROM migrations WHERE name = migration_name) THEN

    INSERT INTO migrations(name) VALUES (migration_name);

    CREATE TABLE IF NOT EXISTS "products"
    (
        "id"          VARCHAR(20)   NOT NULL,
        "name"        VARCHAR(500)  NOT NULL,
        "description" TEXT          NULL,
        "image"       VARCHAR(500)  NULL,
        "categories"  jsonb         NULL,
        "createdAt"   TIMESTAMP     NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMP     NOT NULL DEFAULT NOW(),
        "isDeleted"   BOOLEAN       NOT NULL DEFAULT FALSE,
        PRIMARY KEY ("id")
    );

end if;
end;
$$
