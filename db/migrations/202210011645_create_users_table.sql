DO
$$
  DECLARE migration_name VARCHAR(500) = '202210011645_create_users_table';
  BEGIN
    IF NOT EXISTS(SELECT * FROM migrations WHERE name = migration_name) THEN

      INSERT INTO migrations(name) VALUES (migration_name);

      CREATE TABLE IF NOT EXISTS "users"
      (
        "id"        NUMERIC      NOT NULL PRIMARY KEY,
        "name"      VARCHAR(500) NULL,
        "currency"  VARCHAR(3)   NULL,
        "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
        "isDeleted" BOOLEAN      NOT NULL DEFAULT FALSE
      );

    end if;
  end;
$$
