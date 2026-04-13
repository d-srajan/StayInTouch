import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

const expo = openDatabaseSync("stayintouch.db");
expo.execSync("PRAGMA journal_mode = WAL;");

export const db = drizzle(expo, { schema });
