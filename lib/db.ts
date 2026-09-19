import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { DbShape } from "./types";

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "sattelr-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const emptyDb = (): DbShape => ({
  tokens: [],
  orders: [],
  invoices: [],
  topups: [],
});

async function ensureDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb(), null, 2), "utf8");
  }
}

export async function readDb(): Promise<DbShape> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as DbShape;
}

export async function writeDb(db: DbShape): Promise<void> {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function updateDb(
  mutator: (db: DbShape) => void | Promise<void>
): Promise<DbShape> {
  const db = await readDb();
  await mutator(db);
  await writeDb(db);
  return db;
}
