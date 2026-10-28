CREATE TABLE "auth_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"window_ends_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "updated_by" uuid;