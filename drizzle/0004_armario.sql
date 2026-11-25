CREATE TABLE "friendships" (
	"user_a" text NOT NULL,
	"user_b" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "friendships_user_a_user_b_pk" PRIMARY KEY("user_a","user_b")
);
--> statement-breakpoint
CREATE TABLE "gifts" (
	"id" text PRIMARY KEY NOT NULL,
	"from_user" text NOT NULL,
	"to_user" text NOT NULL,
	"kind" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"client_key" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	"thanks" text,
	"thanked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_events" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"currency" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_events_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "coins" integer DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "lives" smallint DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "lives_day" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "shield" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "boosts" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "boost_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "friend_code" text;--> statement-breakpoint
CREATE INDEX "friendships_b_idx" ON "friendships" USING btree ("user_b");--> statement-breakpoint
CREATE UNIQUE INDEX "gifts_client_idx" ON "gifts" USING btree ("from_user","client_key");--> statement-breakpoint
CREATE INDEX "gifts_to_idx" ON "gifts" USING btree ("to_user","sent_at");--> statement-breakpoint
CREATE INDEX "gifts_from_idx" ON "gifts" USING btree ("from_user","sent_at");--> statement-breakpoint
CREATE INDEX "wallet_user_time_idx" ON "wallet_events" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_friend_code_unique" UNIQUE("friend_code");--> statement-breakpoint
-- Cuentas existentes: conservan los accesorios que antes eran gratuitos (gorro, audífonos, bufanda) y lo comprado con gemas sigue valiendo.
INSERT INTO "inventory" ("user_id", "item_id") SELECT p."user_id", 'pz-' || x.id FROM "profiles" p CROSS JOIN (VALUES ('toque'), ('headphones'), ('scarf')) AS x(id) ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "wallet_events" ("user_id", "key", "currency", "amount", "reason") SELECT "user_id", 'welcome', 'coins', 120, 'Saldo inicial del armario' FROM "profiles" ON CONFLICT DO NOTHING;
