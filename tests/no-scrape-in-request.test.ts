import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}

describe('request path stays offline', () => {
	it('does not import providers or fetch score hosts from routes or hooks', () => {
		const roots = [
			new URL('../src/routes', import.meta.url).pathname,
			new URL('../src/hooks.server.ts', import.meta.url).pathname
		];
		const files = roots.flatMap((root) => {
			try {
				return walk(root);
			} catch {
				return [root];
			}
		});
		for (const file of files.filter((file) => /\.(ts|svelte)$/.test(file))) {
			const source = readFileSync(file, 'utf8');
			expect(source, file).not.toMatch(/\$lib\/providers/);
			expect(source, file).not.toMatch(/\$lib\/ingest/);
			expect(source, file).not.toMatch(/espncricinfo\.com/);
			expect(source, file).not.toMatch(/cricbuzz\.com/);
			expect(source, file).not.toMatch(/bbc\.co\.uk\/sport/);
		}
	});
});
