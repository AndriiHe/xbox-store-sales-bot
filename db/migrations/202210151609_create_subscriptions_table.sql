DO
$$
  DECLARE migration_name VARCHAR(500) = '202210151609_create_subscriptions_table';
  BEGIN
    IF NOT EXISTS(SELECT * FROM migrations WHERE name = migration_name) THEN

      INSERT INTO migrations(name) VALUES (migration_name);

      CREATE TABLE IF NOT EXISTS "subscriptions"
      (
        "id"        UUID NOT NULL PRIMARY KEY,
        "details"   JSONB NOT NULL DEFAULT '{}'::JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "isActive"  BOOLEAN NOT NULL DEFAULT FALSE,
        "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE
      );

    end if;
  end;
$$
