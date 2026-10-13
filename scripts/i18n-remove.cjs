/**
 * Removes dictionary keys from both locales at once.
 *
 *   node scripts/i18n-remove.cjs <file.json>
 *
 * The JSON file is an array of keys: `["tpl.hero.body", "home.heroTitle"]`.
 * Each key's entry (including a value wrapped onto the next line) is deleted
 * from `src/i18n/dictionaries/{en,ar}.ts`. A key missing from a file is
 * reported, not an error. Takes the same lock as `i18n-add.cjs`.
 */
const fs = require("fs");
const path = require("path");

const [file] = process.argv.slice(2);
if (!file) {
  console.error("usage: node scripts/i18n-remove.cjs <file.json>");
  process.exit(1);
}
const keys = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(keys)) throw new Error("expected a JSON array of keys");

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
    if (Date.now() > deadline) throw new Error("i18n-remove: could not take the lock");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
  }
}
process.on("exit", () => fs.rmSync(lock, { recursive: true, force: true }));

for (const locale of ["en", "ar"]) {
  const target = path.join(__dirname, "..", "src", "i18n", "dictionaries", `${locale}.ts`);
  let source = fs.readFileSync(target, "utf8");
  let removed = 0;
  const missing = [];
  for (const key of keys) {
    const pattern = new RegExp(
      `^[ \\t]*"${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*(?:\\r?\\n\\s*)?"(?:[^"\\\\]|\\\\.)*",[ \\t]*\\r?\\n`,
      "m",
    );
    if (pattern.test(source)) {
      source = source.replace(pattern, "");
      removed += 1;
    } else {
      missing.push(key);
    }
  }
  fs.writeFileSync(target, source);
  console.log(`${locale}: ${removed} removed${missing.length ? `, not found: ${missing.join(", ")}` : ""}`);
}
