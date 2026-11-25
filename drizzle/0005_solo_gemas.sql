ALTER TABLE "profiles" ALTER COLUMN "gems" SET DEFAULT 120;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "coins" SET DEFAULT 0;--> statement-breakpoint
-- Una sola moneda: el saldo de monedas de cada cuenta pasa íntegro a gemas (queda registrado como movimiento).
INSERT INTO "wallet_events" ("user_id", "key", "currency", "amount", "reason") SELECT "user_id", 'coins-to-gems', 'gems', "coins", 'Tus monedas pasaron a gemas' FROM "profiles" WHERE "coins" > 0 ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "profiles" SET "gems" = "gems" + "coins", "coins" = 0 WHERE "coins" > 0;
