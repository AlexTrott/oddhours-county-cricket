import { existsSync, unlinkSync } from 'node:fs';
import { closeDb, databasePath, ensureDatabase } from './db.js';

const path = databasePath();
closeDb();
if (existsSync(path)) {
	unlinkSync(path);
	for (const suffix of ['-wal', '-shm']) {
		if (existsSync(path + suffix)) unlinkSync(path + suffix);
	}
}
ensureDatabase();
console.log(`Reset and seeded ${path}`);
