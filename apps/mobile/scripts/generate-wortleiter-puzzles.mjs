import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = ""] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));

const allowedPath = path.resolve(appDir, args.get("allowed") ?? "src/games/wortleiter/generated/allowedGuesses.ts");
const outputPath = path.resolve(appDir, args.get("output") ?? "src/games/wortleiter/generated/puzzles.ts");
const contentVersion = Number(args.get("version") ?? 1);
const maxPuzzles = Number(args.get("limit") ?? 180);
const COMMON_ENDPOINTS = new Set([
  "acht", "ader", "affe", "auge", "auto", "bach", "bahn", "ball", "bank", "bart", "baum", "bein", "berg", "bier", "bild", "blut", "boot", "brot", "buch", "bund", "dach", "dame", "dorf", "duft", "ecke", "ente", "erde", "fach", "fall", "feld", "fell", "fest", "film", "fisch", "foto", "frau", "geld", "glas", "gras", "hand", "haus", "haut", "hemd", "herz", "holz", "hund", "jahr", "kind", "kino", "kopf", "korn", "kuss", "land", "laut", "lied", "luft", "mahl", "mais", "maus", "meer", "mehl", "mond", "mund", "name", "nase", "nest", "obst", "ofen", "ohr", "park", "pass", "pilz", "plan", "rand", "ring", "rose", "saat", "saft", "sand", "satz", "seen", "sohn", "star", "teil", "tier", "tisch", "ton", "wald", "wand", "welt", "wind", "wolf", "wort", "zahl", "zahn", "zeit", "zelt", "ziel", "zoll", "zorn"
]);

function normalizeWord(value) {
  return String(value ?? "").normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

function getChars(word) {
  return Array.from(normalizeWord(word));
}

function isValidTransition(from, to) {
  const fromChars = getChars(from);
  const toChars = getChars(to);
  if (fromChars.length !== toChars.length) return false;

  let differences = 0;
  for (let index = 0; index < fromChars.length; index += 1) {
    if (fromChars[index] !== toChars[index]) differences += 1;
    if (differences > 1) return false;
  }

  return differences === 1;
}

function parseGeneratedWords(source) {
  const match = source.match(/export const generatedAllowedGuesses = (\[[\s\S]*?\]) as const;/);
  if (!match) throw new Error(`Could not parse generated words from ${allowedPath}`);

  return JSON.parse(match[1]);
}

function buildPatternBuckets(words) {
  const buckets = new Map();

  for (const word of words) {
    const chars = getChars(word);
    for (let index = 0; index < chars.length; index += 1) {
      const pattern = `${chars.slice(0, index).join("")}_${chars.slice(index + 1).join("")}`;
      buckets.set(pattern, [...buckets.get(pattern) ?? [], word]);
    }
  }

  return buckets;
}

function getNeighbors(word, buckets) {
  const chars = getChars(word);
  const neighbors = new Set();

  for (let index = 0; index < chars.length; index += 1) {
    const pattern = `${chars.slice(0, index).join("")}_${chars.slice(index + 1).join("")}`;
    for (const neighbor of buckets.get(pattern) ?? []) {
      if (neighbor !== word && isValidTransition(word, neighbor)) neighbors.add(neighbor);
    }
  }

  return [...neighbors];
}

function difficulty(steps) {
  if (steps <= 3) return "easy";
  if (steps <= 5) return "medium";
  return "hard";
}

function isReadableWord(word) {
  return /^[a-zäöüß]{4}$/u.test(word) && !/[qxvy]/u.test(word) && !/^(aa|abä|aar|aas)/u.test(word) && !/(.)\1\1/u.test(word);
}

function pathScore(path) {
  const rareLetters = path.join("").match(/[jqxvy]/gu)?.length ?? 0;
  const umlauts = path.join("").match(/[äöüß]/gu)?.length ?? 0;

  return rareLetters * 8 + umlauts + Math.abs(4 - (path.length - 1));
}

const words = parseGeneratedWords(await readFile(allowedPath, "utf8")).map(normalizeWord);
const buckets = buildPatternBuckets(words);
const endpointOptions = words.filter((word) => COMMON_ENDPOINTS.has(word) && isReadableWord(word) && getNeighbors(word, buckets).length >= 3);
const endpoints = endpointOptions.length >= 20 ? endpointOptions : words.filter((word) => isReadableWord(word) && getNeighbors(word, buckets).length >= 3);
const endpointSet = new Set(endpoints);
const puzzles = [];
const seenPairs = new Set();

for (const start of endpoints) {
  const queue = [[start]];
  const bestDepth = new Map([[start, 0]]);

  while (queue.length > 0) {
    const path = queue.shift();
    const word = path[path.length - 1];
    const steps = path.length - 1;

    if (steps >= 3 && endpointSet.has(word)) {
      const pairKey = start < word ? `${start}:${word}` : `${word}:${start}`;
      if (!seenPairs.has(pairKey) && path.every((item) => isReadableWord(item))) {
        seenPairs.add(pairKey);
        puzzles.push({ path, score: pathScore(path) });
      }
    }

    if (steps >= 6) continue;

    for (const neighbor of getNeighbors(word, buckets).filter(isReadableWord)) {
      const nextDepth = steps + 1;
      if ((bestDepth.get(neighbor) ?? Infinity) <= nextDepth) continue;
      bestDepth.set(neighbor, nextDepth);
      queue.push([...path, neighbor]);
    }
  }
}

puzzles.sort((left, right) => left.score - right.score || left.path.join("").localeCompare(right.path.join(""), "de-DE"));

const selected = puzzles.slice(0, maxPuzzles).map(({ path }, index) => {
  const steps = path.length - 1;
  return {
    id: `wortleiter-${String(index + 1).padStart(3, "0")}`,
    version: contentVersion,
    startWord: path[0],
    targetWord: path[path.length - 1],
    wordLength: 4,
    optimalSteps: steps,
    difficulty: difficulty(steps),
    solution: path
  };
});

if (selected.length < 20) {
  throw new Error(`Only generated ${selected.length} Wortleiter puzzles.`);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated by scripts/generate-wortleiter-puzzles.mjs. Do not edit by hand.\n` +
    `import type { WortleiterPuzzle } from "../types";\n\n` +
    `export const generatedWortleiterPuzzles = ${JSON.stringify(selected, null, 2)} as const satisfies readonly WortleiterPuzzle[];\n`,
  "utf8"
);

console.log(`Generated ${selected.length} Wortleiter puzzles at ${path.relative(process.cwd(), outputPath)}.`);
