import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../../dev.sqlite3');
console.log('Using SQLite file:', dbPath);
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
