#!/usr/bin/env node
// Assembles the static site in _site/ from an allow-list: the root redirect
// page and the runtime files under lms/. Nothing else (source/, tools/, tests/,
// READMEs, notes, node_modules) is copied. Fails if a disallowed file would be
// published. There is no CNAME: no custom hostname is configured.
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "_site");
const ALLOWED_EXT = new Set([".html", ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"]);
const RUNTIME_JS = new Set([
  "theme-init.js", "bank-loader.js", "icons.js", "storage.js", "app.js", "quiz.js", "data.js", "content.js", "quiz-data.js",
  "learn-links.js", "labs.js", "lab-guides.js", "knowledge-checks.js", "knowledge-check.js",
]);
const RUNTIME_OTHER = new Set(["index.html", "tokens.css", "styles.css"]);
const REQUIRED_BANK = "lms/bank/quiz-bank.js";

function walk(dir, base = "") {
  return fs.readdirSync(path.join(dir, base), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(base, entry.name);
    return entry.isDirectory() ? walk(dir, rel) : [rel];
  });
}

const files = ["index.html"];
const rejected = [];
for (const rel of walk(path.join(ROOT, "lms"))) {
  const ext = path.extname(rel).toLowerCase();
  const top = !rel.includes("/");
  if (rel === "README.md") continue;
  if (rel.startsWith("bank/exhibits/")) {
    if (!ALLOWED_EXT.has(ext)) rejected.push(`lms/${rel}`);
    else files.push(`lms/${rel}`);
  } else if (rel === "bank/quiz-bank.js") files.push(`lms/${rel}`);
  else if (rel.startsWith("assets/")) {
    if (!ALLOWED_EXT.has(ext)) rejected.push(`lms/${rel}`);
    else files.push(`lms/${rel}`);
  } else if (top && (RUNTIME_JS.has(rel) || RUNTIME_OTHER.has(rel))) files.push(`lms/${rel}`);
  else rejected.push(`lms/${rel}`);
}
if (rejected.length) {
  console.error(`Refusing to publish non-runtime files:\n  ${rejected.join("\n  ")}`);
  process.exit(1);
}
const missing = [...RUNTIME_JS, ...RUNTIME_OTHER].filter((f) => !files.includes(`lms/${f}`));
if (missing.length) {
  console.error(`Missing runtime files:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

if (!files.includes(REQUIRED_BANK)) {
  console.error("Missing lms/bank/quiz-bank.js: run `npm run build:bank` first.");
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
for (const file of files) {
  const target = path.join(OUT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(ROOT, file), target);
}
console.log(`_site: ${files.length} files`);
