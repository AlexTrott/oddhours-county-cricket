import { appConfig } from '../config/index.js';
import { runIngest, type IngestScope } from './run.js';

export async function watchIngest(
	options: {
		signal?: AbortSignal;
		log?: (line: string) => void;
	} = {}
): Promise<void> {
	const log = options.log ?? console.log;
	const liveMs = appConfig.polling.liveSeconds * 1000;
	const standingsEvery = Math.max(
		1,
		Math.round(appConfig.polling.standingsSeconds / appConfig.polling.liveSeconds)
	);
	const fixturesEvery = Math.max(
		1,
		Math.round(appConfig.polling.fixturesSeconds / appConfig.polling.liveSeconds)
	);

	log(
		`Watching ingest every ${appConfig.polling.liveSeconds}s (standings x${standingsEvery}, fixtures x${fixturesEvery}). Ctrl-C to stop.`
	);

	let tick = 0;
	while (!options.signal?.aborted) {
		const scopes: IngestScope[] = ['live'];
		if (tick % standingsEvery === 0) scopes.push('standings');
		if (tick % fixturesEvery === 0) scopes.push('fixtures');
		for (const scope of scopes) {
			if (options.signal?.aborted) break;
			try {
				const report = await runIngest({ scope });
				log(`[${scope}] ${report.result}: ${report.message}`);
			} catch (error) {
				log(`[${scope}] error: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		tick += 1;
		await new Promise<void>((resolve) => {
			const timer = setTimeout(resolve, liveMs);
			options.signal?.addEventListener('abort', () => {
				clearTimeout(timer);
				resolve();
			});
		});
	}
}
