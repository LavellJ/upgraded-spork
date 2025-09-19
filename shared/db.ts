// shared/db.ts
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const DATA_DIR = path.resolve(process.cwd(), '.data');
fs.mkdirSync(DATA_DIR, { recursive: true }); // ensure directory exists

const DB_FILE = path.join(DATA_DIR, 'qi.db');
export const db = new Database(DB_FILE);