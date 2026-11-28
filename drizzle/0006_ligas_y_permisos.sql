CREATE TABLE "league_members" (
	"user_id" text NOT NULL,
	"week" date NOT NULL,
	"tier" smallint DEFAULT 0 NOT NULL,
	"xp" integer,
	"rank" smallint,
	"group_size" smallint,
	"result" text,
	"seen" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_members_user_id_week_pk" PRIMARY KEY("user_id","week")
);
--> statement-breakpoint
CREATE TABLE "league_weeks" (
	"week" date PRIMARY KEY NOT NULL,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_perks" (
	"user_id" text PRIMARY KEY NOT NULL,
	"unlimited_lives" boolean DEFAULT false NOT NULL,
	"all_themes" boolean DEFAULT false NOT NULL,
	"granted_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "league_week_tier_idx" ON "league_members" USING btree ("week","tier");