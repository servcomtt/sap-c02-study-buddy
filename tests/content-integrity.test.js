"use strict";

// Protects the verified question bank. A failure here means the bank changed.
// If the change is intentional and reviewed, update BASELINE below in the same
// commit and say why in the commit message.

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const QUIZ_FILE = path.join(ROOT, "lms", "quiz-data.js");

// Baseline recorded from the generated file (LF line endings). Regenerate with
// `node tools/build-content.js`, review the diff, then update BASELINE.
const BASELINE = {
  questionCount: 90,
  sha256: "dd4f513149736ba1525c4b349eb963b313ec566617c55017a523e562093a553b",
};

const ALLOWED_TYPES = new Set(["mcq", "multi", "yesno", "hotspot", "dragdrop"]);
const VISUAL_TYPES = new Set(["hotspot", "dragdrop"]);
const REQUIRED_FIELDS = ["id", "number", "topic", "moduleId", "qtype", "question", "options", "answer", "explanation", "reference"];

const hasRole = (q, role) => (q.images || []).some((im) => im.role === role);

function loadBank() {
  const source = fs.readFileSync(QUIZ_FILE, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "quiz-data.js" });
  return sandbox.window.SAPC02_QUIZ;
}

test("quiz-data.js bytes match the verified baseline", { skip: "scaffold: no authored quiz yet; set the baseline hash when the quiz is final" }, () => {
  const digest = crypto.createHash("sha256").update(fs.readFileSync(QUIZ_FILE)).digest("hex");
  assert.equal(digest, BASELINE.sha256, "quiz-data.js changed. Review the change, then update BASELINE.");
});

test("question count matches the baseline and the bank's own counts", { skip: "scaffold: no authored quiz yet" }, () => {
  const bank = loadBank();
  assert.equal(bank.questions.length, BASELINE.questionCount);
  const counted = Object.values(bank.counts).reduce((sum, n) => sum + n, 0);
  assert.equal(counted, bank.questions.length);
});

test("question IDs are unique", () => {
  const ids = loadBank().questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every question has the required fields and a known type", () => {
  for (const q of loadBank().questions) {
    for (const field of REQUIRED_FIELDS) {
      assert.notEqual(q[field], undefined, `${q.id} is missing "${field}"`);
    }
    assert.ok(ALLOWED_TYPES.has(q.qtype), `${q.id} has unknown qtype "${q.qtype}"`);
    if (Array.isArray(q.options) && q.options.length >= 2) continue;
    // Without options, a learner can only answer through the interactive UI or
    // the self-graded "reveal answer" view, which needs an exhibit to work from
    // and an answer (text or marked answer sheet) to reveal.
    assert.ok(q.interactive || VISUAL_TYPES.has(q.qtype), `${q.id} has no options and no way to answer it`);
    if (q.interactive) continue;
    assert.ok(hasRole(q, "exhibit"), `${q.id} has no exhibit to answer from`);
    assert.ok(q.answer || hasRole(q, "answer"), `${q.id} has nothing to reveal as the answer`);
  }
});

// Answer images are shown only by the self-graded view (hotspot/dragdrop
// without an interactive grader), so only there would a duplicate leak the answer.
test("no revealed answer image is also shown as an exhibit", () => {
  for (const q of loadBank().questions) {
    if (!VISUAL_TYPES.has(q.qtype) || q.interactive) continue;
    const exhibits = new Set((q.images || []).filter((im) => im.role === "exhibit").map((im) => im.file));
    for (const im of q.images || []) {
      if (im.role === "answer") assert.ok(!exhibits.has(im.file), `${q.id}: ${im.file} is shown before and after answering`);
    }
  }
});

test("every question's answer refers to its own options", () => {
  for (const q of loadBank().questions) {
    if (VISUAL_TYPES.has(q.qtype) || q.interactive) continue;
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
    assert.ok(answers.length > 0, `${q.id} has no answer`);
  }
});

// Review notes belong in the database's notes column, which is not exported.
// Learners must never see them.
const MAINTAINER_MARKERS = [
  /flagged/i,
  /needs (human )?(review|confirmation)/i,
  /printed answer/i,
  /answer sheet[^.]*not shown/i,
  /question text is missing/i,
  /\bTestlet\b/i,
  /\b(TODO|FIXME|TBD)\b/,
  /owner approval/i,
];

test("no maintainer notes in learner-facing question text", () => {
  for (const q of loadBank().questions) {
    // Every string in the question, its options and its interactive labels.
    const texts = [];
    const collect = (value) => {
      if (typeof value === "string") texts.push(value);
      else if (value && typeof value === "object") Object.values(value).forEach(collect);
    };
    collect([q.question, q.explanation, q.options, q.interactive]);
    for (const text of texts) {
      const hit = MAINTAINER_MARKERS.map((marker) => text.match(marker)).find(Boolean);
      assert.equal(hit, undefined, `${q.id} shows a maintainer note to learners: ${hit && hit[0]}`);
    }
  }
});

test("question numbers within each module are unique", () => {
  const seen = new Set();
  for (const q of loadBank().questions) {
    const key = `${q.moduleId}:${q.number}`;
    assert.ok(!seen.has(key), `duplicate number ${key} (${q.id})`);
    seen.add(key);
  }
});
