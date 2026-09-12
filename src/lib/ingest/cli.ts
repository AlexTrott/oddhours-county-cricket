import { runIngest, watchIngest } from './run.js';
import { ingestionEnabled } from '../config/index.js';

const args = new Set(process.argv.slice(2));
const full = args.has('--full');
const watch = args.has('--watch');

if (watch) {
	if (!ingestionEnabled()) {
		console.log('County Cricket Live ingest');
		console.log('Live ingest is off. Set INGESTION_ENABLED=true to fetch ESPN JSON.');
		process.exit(0);
	}
	console.log('County Cricket Live ingest --watch');
	await watchIngest({ full });
} else {
	const report = await runIngest({ full });
	console.log('County Cricket Live ingest');
	console.log(`Primary: ${report.primary}`);
	for (const blocked of report.blocked) {
		console.log(`Blocked ${blocked.id}: ${blocked.reason}`);
	}
	console.log(report.message);
	process.exit(report.result === 'error' ? 1 : 0);
}
