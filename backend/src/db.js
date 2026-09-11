import "dotenv/config";
import { Temporal } from "@js-temporal/polyfill";
import postgres from "@prisma/orm-postgres/runtime";
import contractJson from "./prisma/contract.json" with { type: "json" };

globalThis.Temporal = Temporal;

export const db = postgres({
  contractJson,
  url: process.env.DATABASE_URL,
});