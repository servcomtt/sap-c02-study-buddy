#!/usr/bin/env node
// Maintainer tool: renders the course map and one mind map per chapter as SVG
// files in lms/assets/ from source/course.cjs. Run: node tools/build-maps.js
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const course = require(path.join(__dirname, "..", "source", "course.cjs"));
const OUT = path.join(__dirname, "..", "lms", "assets");
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((w) => {
    if ((line + " " + w).trim().length > max) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  });
  if (line) lines.push(line);
  return lines;
}

function render({ title, subtitle, branches, accent, desc }) {
  const W = 1280;
  const boxX = 520;
  const boxW = 700;
  const lineH = 21;
  const items = branches.map((b) => {
    const i = b.indexOf(":");
    const head = i > 0 ? b.slice(0, i) : b;
    const rest = i > 0 ? b.slice(i + 1).trim() : "";
    const lines = rest ? wrap(rest, 78) : [];
    return { head, lines, h: 22 + 26 + lines.length * lineH + 12 };
  });
  const gap = 18;
  const total = items.reduce((n, it) => n + it.h, 0) + gap * (items.length - 1);
  const H = Math.max(total + 120, 420);
  let y = (H - total) / 2;
  const cy = H / 2;
  let body = "";
  items.forEach((it, idx) => {
    const mid = y + it.h / 2;
    body += `<path d="M 330 ${cy} C 430 ${cy}, 430 ${mid}, ${boxX} ${mid}" fill="none" stroke="${accent}" stroke-width="3"/>`;
    body += `<rect x="${boxX}" y="${y}" width="${boxW}" height="${it.h}" rx="12" fill="#f6f8fa" stroke="${accent}" stroke-width="2"/>`;
    body += `<text x="${boxX + 18}" y="${y + 32}" font-size="18" font-weight="700" fill="#1b1f23">${idx + 1}. ${esc(it.head)}</text>`;
    it.lines.forEach((l, k) => {
      body += `<text x="${boxX + 18}" y="${y + 32 + 24 + k * lineH - 4}" font-size="15" fill="#3b434b">${esc(l)}</text>`;
    });
    y += it.h + gap;
  });
  const tl = wrap(title, 20);
  const centre = tl
    .map((l, k) => `<text x="190" y="${cy - ((tl.length - 1) * 13) + k * 26 + 6}" text-anchor="middle" font-size="22" font-weight="700" fill="#ffffff">${esc(l)}</text>`)
    .join("");
  const sub = subtitle ? `<text x="190" y="${cy + tl.length * 14 + 24}" text-anchor="middle" font-size="14" fill="#ffffff">${esc(subtitle)}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">
<title id="t">${esc(title)} mind map</title><desc id="d">${esc(desc)}</desc>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<rect x="40" y="${cy - 90}" width="300" height="180" rx="24" fill="${accent}"/>
${centre}${sub}
${body}
</svg>
`;
}

course.modules.forEach((m) => {
  const mm = course.mindMaps[m.id];
  if (!mm) return;
  const svg = render({ title: mm.title, subtitle: `${m.weight} of the exam`, branches: mm.branches, accent: m.accent, desc: `${mm.title}: ${mm.branches.join("; ")}` });
  fs.writeFileSync(path.join(OUT, `sapc02-${m.id}-map.svg`), svg);
});
const branches = course.domains.map((d, i) => `${d.title} (${d.weight}): Chapter ${i + 1} in this app, with topics, scenarios, labs, flashcards, practice and a summary.`);
fs.writeFileSync(
  path.join(OUT, "sapc02-course-map.svg"),
  render({ title: "SAP-C02 course map", subtitle: `Four content domains`, branches, accent: "#b45309", desc: `Four content domains: ${course.domains.map((d) => `${d.title} ${d.weight}`).join("; ")}` })
);
console.log("maps written");
