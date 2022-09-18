DO
$$
DECLARE migration_name VARCHAR(500) = '202204211139_create_regions_table';
BEGIN
IF NOT EXISTS(SELECT * FROM migrations WHERE name = migration_name) THEN

    INSERT INTO migrations(name) VALUES (migration_name);

    CREATE TABLE IF NOT EXISTS "regions"
    (
        "name"      VARCHAR(2) NOT NULL,
        "locale"    VARCHAR(5) NOT NULL,
        "currency"  VARCHAR(3) NOT NULL,
        "isDeleted" BOOLEAN    NOT NULL DEFAULT FALSE,
        PRIMARY KEY ("name")
    );

    INSERT INTO "regions"("name", "locale", "currency")
    VALUES ('AE','ar-AE','USD'),
           ('AR','es-AR','ARS'),
           ('AT','de-AT','EUR'),
           ('AU','en-AU','AUD'),
           ('BE','fr-BE','EUR'),
           ('BR','pt-BR','BRL'),
           ('CA','en-CA','CAD'),
           ('CH','de-CH','CHF'),
           ('CL','es-CL','CLP'),
           ('CO','es-CO','COP'),
           ('CZ','cs-CZ','CZK'),
           ('DE','de-DE','EUR'),
           ('DK','da-DK','DKK'),
           ('ES','es-ES','EUR'),
           ('FI','fi-FI','EUR'),
           ('FR','fr-FR','EUR'),
           ('GB','en-GB','GBP'),
           ('GR','el-GR','EUR'),
           ('HK','en-HK','HKD'),
           ('HU','hu-HU','HUF'),
           ('IE','en-IE','EUR'),
           ('IL','he-IL','ILS'),
           ('IN','en-IN','INR'),
           ('IT','it-IT','EUR'),
           ('JP','ja-JP','JPY'),
           ('KR','ko-KR','KRW'),
           ('MX','es-MX','MXN'),
           ('NL','nl-NL','EUR'),
           ('NO','nb-NO','NOK'),
           ('NZ','en-NZ','NZD'),
           ('PL','pl-PL','PLN'),
           ('PT','pt-PT','EUR'),
           ('RU','ru-RU','USD'),
           ('SA','ar-SA','SAR'),
           ('SE','sv-SE','SEK'),
           ('SG','en-SG','SGD'),
           ('SK','sk-SK','EUR'),
           ('TR','tr-TR','TRY'),
           ('TW','zh-TW','TWD'),
           ('US','en-US','USD'),
           ('ZA','en-ZA','ZAR');

end if;
end;
$$
