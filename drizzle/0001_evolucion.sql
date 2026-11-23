CREATE TABLE "active_time" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"client_id" text NOT NULL,
	"seconds" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "active_time_user_id_day_client_id_pk" PRIMARY KEY("user_id","day","client_id")
);
--> statement-breakpoint
CREATE TABLE "error_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"item_id" text,
	"mode" text,
	"category" text NOT NULL,
	"expected" text,
	"given" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gem_ledger" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gem_ledger_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"email" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"invitation_id" text,
	"sends" smallint DEFAULT 0 NOT NULL,
	"last_sent_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"kind" text DEFAULT 'daily' NOT NULL,
	"mission_id" text,
	"minutes" smallint DEFAULT 10 NOT NULL,
	"steps" smallint DEFAULT 0 NOT NULL,
	"done" smallint DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "study_sessions_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "frozen" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "gems" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "freezes" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "review_logs" ADD COLUMN "attempt_id" text;--> statement-breakpoint
ALTER TABLE "review_logs" ADD COLUMN "first_try" boolean;--> statement-breakpoint
ALTER TABLE "review_logs" ADD COLUMN "hints" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "review_logs" ADD COLUMN "revealed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "review_logs" ADD COLUMN "kind" text DEFAULT 'graded' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "errors_attempt_idx" ON "error_events" USING btree ("user_id","attempt_id","category");--> statement-breakpoint
CREATE INDEX "errors_user_time_idx" ON "error_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_time_idx" ON "study_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "logs_attempt_idx" ON "review_logs" USING btree ("user_id","attempt_id");