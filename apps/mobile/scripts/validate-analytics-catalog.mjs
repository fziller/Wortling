import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dirname, "..");
const eventsSource = await readFile(resolve(appRoot, "src/analytics/events.ts"), "utf8");
const csv = await readFile(resolve(appRoot, "../../docs/posthog-events.csv"), "utf8");
const typeBlock = eventsSource.match(/export type WortkniffEvents = \{([\s\S]*?)\n\};/);

if (!typeBlock) throw new Error("Could not find WortkniffEvents.");

const eventNames = [...typeBlock[1].matchAll(/^  ([a-z_]+):/gm)].map((match) => match[1]).sort();
const catalogNames = csv
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split(",", 1)[0])
  .filter(Boolean)
  .sort();

const missingFromCatalog = eventNames.filter((event) => !catalogNames.includes(event));
const missingFromTypes = catalogNames.filter((event) => !eventNames.includes(event));

if (missingFromCatalog.length || missingFromTypes.length) {
  throw new Error([
    missingFromCatalog.length ? `Missing from docs/posthog-events.csv: ${missingFromCatalog.join(", ")}` : "",
    missingFromTypes.length ? `Missing from WortkniffEvents: ${missingFromTypes.join(", ")}` : "",
  ].filter(Boolean).join("\n"));
}

console.log(`Analytics catalog valid: ${eventNames.length} events.`);
