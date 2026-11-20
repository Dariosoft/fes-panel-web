import { readFileSync } from "node:fs";

const minimum = Number(process.env.COVERAGE_MIN ?? 80);
const summaryPath = process.env.COVERAGE_SUMMARY ?? "coverage/panel-web/coverage-summary.json";

const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
const lines = summary.total.lines.pct;

console.log(`Line coverage: ${lines}% (minimum ${minimum}%)`);

if (lines < minimum) {
  console.error(`Coverage gate failed: ${lines}% is below ${minimum}%`);
  process.exit(1);
}
