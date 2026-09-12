import { runIngest } from './run.js';
import { watchIngest } from './watch.js';

const args = new Set(process.argv.slice(2));
const watch = args.has('--watch');
const full = args.has('--full');

function printReport(report: Awaited<ReturnType<typeof runIngest>>): void {
	console.log('County Cricket Live ingest');
	console.log(`Primary: ${report.primary}`);
	for (const blocked of report.blocked) {
		console.log(`Blocked ${blocked.id}: ${blocked.reason}`);
	}
	console.log(report.message);
	if (report.skippedSeries.length) {
		for (const skipped of report.skippedSeries) {
			console.log(`Skipped league ${skipped.leagueId}: ${skipped.reason}`);
		}
	}
	console.log(
		`matches=${report.matches} standings=${report.standings} scorecards=${report.scorecards} seedRemoved=${report.seedRemoved} network=${report.network}`
	);
}

if (watch) {
	const controller = new AbortController();
	process.on('SIGINT', () => controller.abort());
	process.on('SIGTERM', () => controller.abort());
	await watchIngest({ signal: controller.signal });
	process.exit(0);
}

const report = await runIngest({ full });
printReport(report);
process.exit(report.result === 'error' ? 1 : 0);
