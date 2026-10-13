/**
 * Adds (or updates) dictionary keys in both locales at once.
 *
 *   node scripts/i18n-add.cjs <anchor-key> <file.json>
 *
 * The JSON file is `{ "key": { "en": "...", "ar": "..." }, ... }`. New keys are
 * inserted after `<anchor-key>` in `src/i18n/dictionaries/{en,ar}.ts`; a key
 * that already exists has its value replaced in place. Values are written with
 * JSON escaping, so quotes and apostrophes are safe.
 */
const fs = require("fs");
const path = require("path");

const [anchor, file] = process.argv.slice(2);
if (!anchor || !file) {
  console.error("usage: node scripts/i18n-add.cjs <anchor-key> <file.json>");
  process.exit(1);
}
const entries = JSON.parse(fs.readFileSync(file, "utf8"));

/*
 * A LOCK, because several people (or agents) may add keys at once. Each run
 * reads both dictionaries, edits them and writes them back; two runs
 * interleaving would silently drop one set of keys. `mkdir` is atomic, so the
 * directory is the lock; one older than 30s is treated as abandoned.
 */
const lock = path.join(__dirname, "..", ".i18n-add.lock");
const deadline = Date.now() + 60_000;
for (;;) {
  try {
    fs.mkdirSync(lock);
    break;
  } catch {
    try {
      if (Date.now() - fs.statSync(lock).mtimeMs > 30_000) fs.rmSync(lock, { recursive: true, force: true });
    } catch {
      /* Released between the two calls: try again. */
    }
    if (Date.now() > deadline) throw new Error("i18n-add: could not take the lock");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
  }
}
process.on("exit", () => fs.rmSync(lock, { recursive: true, force: true }));

for (const locale of ["en", "ar"]) {
  const target = path.join(__dirname, "..", "src", "i18n", "dictionaries", `${locale}.ts`);
  let source = fs.readFileSync(target, "utf8");
  const fresh = [];
  for (const [key, values] of Object.entries(entries)) {
    const value = values[locale];
    if (typeof value !== "string") throw new Error(`${key}: missing ${locale}`);
    const pattern = new RegExp(`^(\\s*)"${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*(?:\\n\\s*)?"(?:[^"\\\\]|\\\\.)*",`, "m");
    if (pattern.test(source)) {
      source = source.replace(pattern, (_, indent) => `${indent}"${key}": ${JSON.stringify(value)},`);
    } else {
      fresh.push(`  "${key}": ${JSON.stringify(value)},`);
    }
  }
  if (fresh.length) {
    const at = source.indexOf(`"${anchor}"`);
    if (at < 0) throw new Error(`${locale}: anchor ${anchor} not found`);
    let lineEnd = source.indexOf("\n", at);
    /* An anchor whose value wraps onto the next line ends one line later. */
    if (!source.slice(at, lineEnd).trim().endsWith(",")) lineEnd = source.indexOf("\n", lineEnd + 1);
    source = source.slice(0, lineEnd + 1) + fresh.join("\n") + "\n" + source.slice(lineEnd + 1);
  }
  fs.writeFileSync(target, source);
  console.log(`${locale}: ${fresh.length} added, ${Object.keys(entries).length - fresh.length} updated`);
}
