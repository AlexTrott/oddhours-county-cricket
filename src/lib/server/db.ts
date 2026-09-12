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
	ensureColumn(database, 'matches', 'round', 'TEXT');
	ensureColumn(database, 'matches', 'stale', 'INTEGER NOT NULL DEFAULT 0');
	ensureColumn(database, 'matches', 'source', "TEXT NOT NULL DEFAULT 'seed'");
	ensureColumn(database, 'matches', 'source_key', 'TEXT');
	ensureColumn(database, 'matches', 'last_good_at', 'TEXT');
	const ingest = database
		.prepare(`SELECT name FROM schema_migrations WHERE name = ?`)
		.get('002_ingest');
	if (!ingest) {
		database
			.prepare(`INSERT INTO schema_migrations (id, name, applied_at) VALUES (2, '002_ingest', ?)`)
			.run(new Date().toISOString());
	}
}

function ensureColumn(
	database: Database.Database,
	table: string,
	column: string,
	definition: string
): void {
	const cols = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
	if (cols.some((col) => col.name === column)) return;
	database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
