import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof make> | undefined;

function make() {
  // Vercel's Neon integration here injects variables with an "earthship_" prefix.
  const url = process.env.DATABASE_URL ?? process.env.earthship_DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

export function db() {
  return (_db ??= make());
}
