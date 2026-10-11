CREATE TABLE "admins" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text,
	"added_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
