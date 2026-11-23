CREATE TABLE "cards" (
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"mode" text NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"state" smallint DEFAULT 0 NOT NULL,
	"stability" real DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"fsrs" jsonb NOT NULL,
	"suspended" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_review" timestamp with time zone,
	CONSTRAINT "cards_user_id_item_id_mode_pk" PRIMARY KEY("user_id","item_id","mode")
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"reviews" integer DEFAULT 0 NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"new_items" integer DEFAULT 0 NOT NULL,
	"speaking" integer DEFAULT 0 NOT NULL,
	"seconds" integer DEFAULT 0 NOT NULL,
	"missions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "daily_stats_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"level" text DEFAULT 'A2' NOT NULL,
	"goal_minutes" smallint DEFAULT 10 NOT NULL,
	"daily_new" smallint DEFAULT 8 NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tz" text DEFAULT 'America/Mexico_City' NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_goal_day" date,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"mode" text NOT NULL,
	"rating" smallint NOT NULL,
	"state_before" smallint NOT NULL,
	"stability_after" real NOT NULL,
	"scheduled_days" real NOT NULL,
	"duration_ms" integer,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sound_progress" (
	"user_id" text NOT NULL,
	"sound_id" text NOT NULL,
	"perception_total" integer DEFAULT 0 NOT NULL,
	"perception_correct" integer DEFAULT 0 NOT NULL,
	"recordings" integer DEFAULT 0 NOT NULL,
	"self_score_sum" integer DEFAULT 0 NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sound_progress_user_id_sound_id_pk" PRIMARY KEY("user_id","sound_id")
);
--> statement-breakpoint
CREATE INDEX "cards_due_idx" ON "cards" USING btree ("user_id","due");--> statement-breakpoint
CREATE INDEX "logs_user_time_idx" ON "review_logs" USING btree ("user_id","reviewed_at");