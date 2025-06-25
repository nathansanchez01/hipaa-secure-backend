import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// __dirname is available in CommonJS or transpiled via ts-node
const dbPath = path.resolve(process.cwd(), 'dev.sqlite3');
console.log('Using SQLite file:', dbPath);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });