import { describe, expect, it } from 'vitest';
import { runIngest } from '../src/lib/ingest/run.js';
import { bbcProvider, cricbuzzProvider, espncricinfoProvider } from '../src/lib/providers/index.js';
import { IngestDisabledError } from '../src/lib/providers/types.js';

describe('providers', () => {
	it('does not enable BBC or Cricbuzz', () => {
		expect(bbcProvider.enabled).toBe(false);
		expect(cricbuzzProvider.enabled).toBe(false);
	});

	it('refuses live ESPN fetches while ingest is gated off', async () => {
		delete process.env.INGESTION_ENABLED;
		await expect(espncricinfoProvider.fetchLiveMatches()).rejects.toBeInstanceOf(
			IngestDisabledError
		);
	});

	it('runs ingest without touching the network when ingest is off', async () => {
		delete process.env.INGESTION_ENABLED;
		const report = await runIngest();
		expect(report.network).toBe(false);
		expect(report.result).toBe('skipped');
		expect(report.primary).toBe('espncricinfo');
	});
});
