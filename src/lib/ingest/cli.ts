import { runIngest } from './run.js';

const report = await runIngest();
console.log('County Cricket Live ingest');
console.log(`Primary: ${report.primary}`);
for (const blocked of report.blocked) {
	console.log(`Blocked ${blocked.id}: ${blocked.reason}`);
}
console.log(report.message);
process.exit(report.result === 'error' ? 1 : 0);
