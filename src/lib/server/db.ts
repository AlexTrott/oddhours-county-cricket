import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SCHEMA_SQL } from './schema.js';
import { seedDatabase } from './seed.js';

const DEFAULT_PATH = 'data/county-cricket.sqlite';

let db: Database.Database | null = null;

export function databasePath(): string {
	return resolve(process.env.DATABASE_PATH ?? DEFAULT_PATH);
}

export function closeDb(): void {
	db?.close();
	db = null;
}

export function getDb(): Database.Database {
	if (db) return db;
	const path = databasePath();
	mkdirSync(dirname(path), { recursive: true });
	db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	migrate(db);
	return db;
}

export function ensureDatabase(): Database.Database {
	const database = getDb();
	const matchCount = database.prepare(`SELECT COUNT(*) AS n FROM matches`).get() as { n: number };
	if (matchCount.n === 0) {
		seedDatabase(database);
	}
	return database;
}

function migrate(database: Database.Database): void {
	database.exec(SCHEMA_SQL);
	const applied = database
		.prepare(`SELECT name FROM schema_migrations WHERE name = ?`)
		.get('001_init');
	if (!applied) {
		database
			.prepare(`INSERT INTO schema_migrations (id, name, applied_at) VALUES (1, '001_init', ?)`)
			.run(new Date().toISOString());
	}
}
