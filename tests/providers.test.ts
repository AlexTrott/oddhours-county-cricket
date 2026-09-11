import { describe, expect, it } from 'vitest';
import { runIngest } from '../src/lib/ingest/run.js';
import { bbcProvider, cricbuzzProvider, espncricinfoProvider } from '../src/lib/providers/index.js';
import { NotCutOverError } from '../src/lib/providers/types.js';

describe('providers', () => {
	it('does not enable BBC or Cricbuzz', () => {
		expect(bbcProvider.enabled).toBe(false);
		expect(cricbuzzProvider.enabled).toBe(false);
	});

	it('keeps ESPNCricinfo as a stub, not a live scrape', async () => {
		await expect(espncricinfoProvider.fetchLiveMatches()).rejects.toBeInstanceOf(NotCutOverError);
	});

	it('runs ingest without touching the network', async () => {
		const report = await runIngest();
		expect(report.network).toBe(false);
		expect(report.result).toBe('skipped');
		expect(report.primary).toBe('espncricinfo');
	});
});
