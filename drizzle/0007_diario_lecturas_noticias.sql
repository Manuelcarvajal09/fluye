CREATE TABLE "daily_news" (
	"day" date PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"mood" smallint,
	"activities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"english_line" text DEFAULT '' NOT NULL,
	"learned" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "journal_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"w" smallint NOT NULL,
	"h" smallint NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"user_id" text NOT NULL,
	"reading_id" text NOT NULL,
	"score" smallint NOT NULL,
	"total" smallint NOT NULL,
	"reflection" text DEFAULT '' NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_progress_user_id_reading_id_pk" PRIMARY KEY("user_id","reading_id")
);
--> statement-breakpoint
CREATE TABLE "social_reactions" (
	"from_user" text NOT NULL,
	"to_user" text NOT NULL,
	"target" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_reactions_from_user_to_user_target_pk" PRIMARY KEY("from_user","to_user","target")
);
--> statement-breakpoint
CREATE INDEX "journal_photos_user_day_idx" ON "journal_photos" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "reactions_to_idx" ON "social_reactions" USING btree ("to_user","target");