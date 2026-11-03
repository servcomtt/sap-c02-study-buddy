"use strict";

// Checks every foreground/background token pair the stylesheet relies on, in
// both themes, against WCAG 2.2 AA: 4.5:1 for text, 3:1 for UI boundaries and
// focus indicators (1.4.3, 1.4.11). Dark colours are checked, not assumed.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "lms", "tokens.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function block(selector) {
  const start = css.indexOf(selector + " {");
  assert.notEqual(start, -1, `missing ${selector} block in tokens.css`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

// The second ":root {" block holds the light alias tokens.
const lightStart = css.indexOf(":root {", css.indexOf(":root {") + 1);
const light = (() => {
  const body = css.slice(lightStart, css.indexOf("}", lightStart));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
})();
const dark = { ...light, ...block(':root[data-theme="dark"]') };

function hex(value) {
  const m = /^#([0-9a-f]{6})$/i.exec(value);
  assert.ok(m, `expected a 6-digit hex colour, got ${value}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
}

function resolve(tokens, name) {
  let value = tokens[name];
  assert.ok(value, `token ${name} is not defined`);
  while (value.startsWith("var(")) value = tokens[value.slice(4, -1)];
  return hex(value);
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5;
const UI = 3;

// [foreground, background, minimum]
const PAIRS = [
  ["--color-text", "--color-canvas", TEXT],
  ["--color-text", "--color-surface", TEXT],
  ["--color-text", "--color-surface-alt", TEXT],
  ["--color-text", "--color-surface-subtle", TEXT],
  ["--color-text", "--color-action-subtle", TEXT],
  ["--color-text-muted", "--color-canvas", TEXT],
  ["--color-text-muted", "--color-surface", TEXT],
  ["--color-text-muted", "--color-surface-alt", TEXT],
  ["--color-text-muted", "--color-surface-subtle", TEXT],
  ["--color-action", "--color-surface", TEXT],
  ["--color-action", "--color-canvas", TEXT],
  ["--color-action", "--color-action-subtle", TEXT],
  ["--color-action-strong", "--color-action-subtle", TEXT],
  ["--color-on-fill", "--color-action-fill", TEXT],
  ["--color-on-fill", "--color-action-fill-hover", TEXT],
  ["--color-on-fill", "--color-success-fill", TEXT],
  ["--color-on-fill", "--color-danger-fill", TEXT],
  ["--color-on-fill", "--color-hero-start", TEXT],
  ["--color-on-fill", "--color-hero-end", TEXT],
  ["--color-success", "--color-surface", TEXT],
  ["--color-success", "--color-success-subtle", TEXT],
  ["--color-danger", "--color-surface", TEXT],
  ["--color-danger", "--color-danger-subtle", TEXT],
  ["--color-warning", "--color-surface", TEXT],
  ["--color-warning", "--color-warning-subtle", TEXT],
  ["--color-purple", "--color-surface", TEXT],
  ["--color-tip-text", "--color-action-subtle", TEXT],
  ["--color-tip-strong", "--color-action-subtle", TEXT],
  ["--color-tip-text", "--color-warning-subtle", TEXT],
  ["--color-code-text", "--color-code-bg", TEXT],
  ["--color-code-button-text", "--color-code-button", TEXT],
  ["--sidebar-text", "--sidebar-bg", TEXT],
  ["--sidebar-muted", "--sidebar-bg", TEXT],
  ["--sidebar-link", "--sidebar-panel", TEXT],
  ["--sidebar-strong", "--sidebar-panel", TEXT],
  ["--color-border-strong", "--color-surface", UI],
  ["--color-border-strong", "--color-canvas", UI],
  ["--color-focus", "--color-surface", UI],
  ["--color-focus", "--color-canvas", UI],
  ["--color-focus-on-dark", "--sidebar-bg", UI],
  ["--color-focus-on-dark", "--color-code-bg", UI],
  ["--color-action-fill", "--color-surface", UI],
  ["--color-success", "--color-success-subtle", UI],
  ["--color-danger", "--color-danger-subtle", UI],
];

for (const [themeName, tokens] of [["light", light], ["dark", dark]]) {
  test(`${themeName} theme: every token pair meets WCAG 2.2 AA`, () => {
    const failures = PAIRS.map(([fg, bg, min]) => [fg, bg, min, ratio(resolve(tokens, fg), resolve(tokens, bg))])
      .filter(([, , min, r]) => r < min)
      .map(([fg, bg, min, r]) => `${fg} on ${bg}: ${r.toFixed(2)}:1 (needs ${min}:1)`);
    assert.deepEqual(failures, []);
  });
}

test("dark theme redefines every colour token the light theme defines", () => {
  const darkOwn = block(':root[data-theme="dark"]');
  const missing = Object.keys(light).filter((name) => /^--(color|sidebar|rgb|shadow)-/.test(name) && !(name in darkOwn));
  assert.deepEqual(missing, []);
});
