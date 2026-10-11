import { bigint, date, index, integer, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(), // stored lowercase
    phone: text("phone"),
    city: text("city"),
    status: text("status").notNull().default("new"),
    segment: text("segment").notNull().default("friend"),
    source: text("source").notNull().default("website"), // website | manual | referral | ...
    owner: text("owner"), // who on the team is handling them
    tags: text("tags").array().notNull().default([]),
    interests: text("interests").array().notNull().default([]),
    nextFollowUp: date("next_follow_up"),
    okToContact: boolean("ok_to_contact").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contacts_status_idx").on(t.status), index("contacts_follow_up_idx").on(t.nextFollowUp)],
);

// A pledge is a non-binding statement of intent. No money moves.
export const pledges = pgTable(
  "pledges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    tier: text("tier").notNull(), // tiers.id at the time; no FK so tiers can be deleted
    tierName: text("tier_name"), // snapshot of the tier's name, so deleted tiers still read well
    amountInr: integer("amount_inr").notNull(),
    message: text("message"),
    withdrawn: boolean("withdrawn").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pledges_contact_idx").on(t.contactId)],
);

export const interactions = pgTable(
  "interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("note"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("interactions_contact_idx").on(t.contactId)],
);

export type Contact = typeof contacts.$inferSelect;
export type Pledge = typeof pledges.$inferSelect;
export type Interaction = typeof interactions.$inferSelect;

// People allowed into the CRM. Sign-in is Google SSO; membership here is the allowlist.
export const admins = pgTable("admins", {
  email: text("email").primaryKey(), // lowercase
  name: text("name"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});
export type Admin = typeof admins.$inferSelect;

// Candidate reserves shown on the public home page (when published).
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location"),
  size: text("size"), // free text, e.g. "12 acres"
  condition: text("condition"), // current condition / description
  fundsNeededInr: bigint("funds_needed_inr", { mode: "number" }),
  poc: text("poc"), // point of contact (name, phone...)
  showPoc: boolean("show_poc").notNull().default(false),
  published: boolean("published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  hasImage: boolean("has_image").notNull().default(false),
  imageVersion: integer("image_version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Kept apart so list queries never drag image bytes along. Stored as base64 text.
export const projectImages = pgTable("project_images", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  dataBase64: text("data_base64").notNull(),
});

export type Project = typeof projects.$inferSelect;

// Membership options shown on the home page and pledge form. Editable in /admin/tiers.
export const tiers = pgTable("tiers", {
  id: text("id").primaryKey(), // stable slug; pledges refer to it
  name: text("name").notNull(),
  amountInr: integer("amount_inr").notNull(), // for "custom" tiers this is the minimum / "from" amount
  blurb: text("blurb").notNull().default(""),
  custom: boolean("custom").notNull().default(false), // pledger names their own amount
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Tier = typeof tiers.$inferSelect;
