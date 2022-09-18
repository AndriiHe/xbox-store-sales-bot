DO
$$
  DECLARE
    migration_name VARCHAR(500) = '202204221428_create_currencies_table';
  BEGIN
    IF NOT EXISTS(SELECT * FROM migrations WHERE name = migration_name) THEN

      INSERT INTO migrations(name) VALUES (migration_name);

      CREATE TABLE IF NOT EXISTS "currencies"
      (
        "code"          VARCHAR(3) NOT NULL,
        "exchangeRates" jsonb      NULL,
        "createdAt"     TIMESTAMP  NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMP  NOT NULL DEFAULT NOW(),
        "isDeleted"     BOOLEAN    NOT NULL DEFAULT FALSE,
        PRIMARY KEY ("code")
      );

      INSERT INTO "currencies"("code")
      VALUES ('ARS'),
             ('AUD'),
             ('BRL'),
             ('CAD'),
             ('CHF'),
             ('CLP'),
             ('COP'),
             ('CZK'),
             ('DKK'),
             ('EUR'),
             ('GBP'),
             ('HKD'),
             ('HUF'),
             ('ILS'),
             ('INR'),
             ('JPY'),
             ('KRW'),
             ('MXN'),
             ('NOK'),
             ('NZD'),
             ('PLN'),
             ('SAR'),
             ('SEK'),
             ('SGD'),
             ('TRY'),
             ('TWD'),
             ('USD'),
             ('ZAR');

    end if;
  end;
$$
