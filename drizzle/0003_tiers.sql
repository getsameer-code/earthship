CREATE TABLE "tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount_inr" integer NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"custom" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pledges" ADD COLUMN "tier_name" text;--> statement-breakpoint
-- Seed the four existing tiers (same ids, so old pledges keep pointing at them).
INSERT INTO "tiers" ("id","name","amount_inr","blurb","custom","published","sort_order") VALUES
 ('annual','Annual member',5000,'Renews each year. The easiest way to be part of it from day one.',false,true,0),
 ('five_year','5-year member',20000,'A five-year commitment at a lower yearly cost.',false,true,1),
 ('lifetime','Lifetime member',100000,'One contribution, membership for life.',false,true,2),
 ('patron','Patron',500000,'For those who want to seed land acquisition. Amount is yours to name.',true,true,3);
--> statement-breakpoint
-- Give existing pledges a copy of their tier's name.
UPDATE "pledges" p SET "tier_name" = t."name" FROM "tiers" t WHERE p."tier" = t."id" AND p."tier_name" IS NULL;
