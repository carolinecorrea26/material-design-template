import { readFileSync } from 'node:fs';
const report = JSON.parse(readFileSync('migration-artifacts/mcr-coverage.json', 'utf8'));
console.log(JSON.stringify({ phase5Ready: report.phase5Ready, phase6Ready: report.phase6Ready, phase5Blockers: report.phase5Blockers, promotionCounts: report.promotionCounts, blockers: report.blockers, integrityErrors: report.integrityErrors }, null, 2));
if (!report.phase5Ready || report.phase5BlockingCount || report.integrityErrors.length) process.exitCode = 1;
