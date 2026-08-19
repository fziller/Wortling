import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const MOBILE_DIR = new URL("../apps/mobile/", import.meta.url);
const PKG_PATH = new URL("package.json", MOBILE_DIR);
const APP_PATH = new URL("app.json", MOBILE_DIR);

function readJSON(url) {
  return JSON.parse(readFileSync(url, "utf-8"));
}

function writeJSON(url, data) {
  writeFileSync(url, JSON.stringify(data, null, 2) + "\n");
}

function parseVersion(v) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error(`Invalid semver: ${v}`);
  return [+m[1], +m[2], +m[3]];
}

function bump(version, level) {
  const [major, minor, patch] = parseVersion(version);
  switch (level) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
    default: throw new Error(`Unknown bump level: ${level}`);
  }
}

const [, , cmd, arg] = process.argv;

if (!cmd || !["bump", "set"].includes(cmd)) {
  console.error("Usage: node scripts/version.mjs <bump|set> <patch|minor|major|X.Y.Z>");
  process.exit(1);
}

const pkg = readJSON(PKG_PATH);
const app = readJSON(APP_PATH);

let newVersion;

if (cmd === "bump") {
  if (!["major", "minor", "patch"].includes(arg)) {
    console.error("Bump requires: major, minor, or patch");
    process.exit(1);
  }
  newVersion = bump(pkg.version, arg);
} else {
  if (!/^\d+\.\d+\.\d+$/.test(arg)) {
    console.error("Set requires a valid semver string (e.g. 1.2.3)");
    process.exit(1);
  }
  newVersion = arg;
}

console.log(`${pkg.version} → ${newVersion}`);

pkg.version = newVersion;
app.expo.version = newVersion;

writeJSON(PKG_PATH, pkg);
writeJSON(APP_PATH, app);

execSync(`git add package.json app.json`, { cwd: MOBILE_DIR });
execSync(`git commit -m "v${newVersion}"`, { cwd: MOBILE_DIR });
execSync(`git tag v${newVersion}`, { cwd: MOBILE_DIR });

console.log(`Tagged v${newVersion}`);
