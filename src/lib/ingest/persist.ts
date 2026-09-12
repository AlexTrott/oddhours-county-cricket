import type Database from 'better-sqlite3';
import { getDb } from '../server/db.js';

export function recordRawPayload(opts: {
	source: string;
	dataType: string;
	url: string;
	statusCode: number;
	payload: string;
	parseOk: boolean;
	error: string | null;
}): void {
	const db = getDb();
	const payload = opts.payload.length > 750_000 ? opts.payload.slice(0, 750_000) : opts.payload;
	db.prepare(
		`INSERT INTO ingest_raw (source, data_type, url, fetched_at, status_code, payload, parse_ok, error)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		opts.source,
		opts.dataType,
		opts.url,
		new Date().toISOString(),
		opts.statusCode,
		payload,
		opts.parseOk ? 1 : 0,
		opts.error
	);
	if (!opts.parseOk) {
		db.prepare(
			`INSERT INTO ingest_failures (source, data_type, url, failed_at, error, payload)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(opts.source, opts.dataType, opts.url, new Date().toISOString(), opts.error, payload);
	}
}

export function setMeta(key: string, value: string, db: Database.Database = getDb()): void {
	db.prepare(
		`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
	).run(key, value);
}

export function markMatchStale(matchId: string, error: string): void {
	const db = getDb();
	const key = matchId.replace(/^espn-/, '');
	const espnId = matchId.startsWith('espn-') ? matchId : `espn-${matchId}`;
	db.prepare(`UPDATE matches SET stale = 1 WHERE id = ? OR id = ? OR source_key = ?`).run(
		matchId,
		espnId,
		key
	);
	setMeta('last_parse_failure_at', new Date().toISOString());
	setMeta('last_parse_failure', `${matchId}: ${error}`);
}
