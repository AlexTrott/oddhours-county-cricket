import { describe, expect, it } from 'vitest';
import { runIngest } from '../src/lib/ingest/run.js';
import { bbcProvider, cricbuzzProvider, espncricinfoProvider } from '../src/lib/providers/index.js';
import { IngestNetworkGuardError } from '../src/lib/providers/types.js';

describe('providers', () => {
	it('does not enable BBC or Cricbuzz', () => {
		expect(bbcProvider.enabled).toBe(false);
		expect(cricbuzzProvider.enabled).toBe(false);
	});

	it('keeps ESPNCricinfo enabled as the primary ingest path', () => {
		expect(espncricinfoProvider.enabled).toBe(true);
		expect(espncricinfoProvider.id).toBe('espncricinfo');
	});

	it('does not let unit tests hit the live ESPN network', async () => {
		await expect(espncricinfoProvider.fetchLiveMatches()).rejects.toBeInstanceOf(
			IngestNetworkGuardError
		);
		await expect(runIngest()).rejects.toBeInstanceOf(IngestNetworkGuardError);
	});
});
