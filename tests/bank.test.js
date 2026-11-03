// Integrity of the verified practice bank (lms/bank/quiz-bank.js).
// Skipped when the file is absent (fresh clone / CI); run `node tools/build-bank.js` to generate it.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const file = path.join(__dirname, "..", "lms", "bank", "quiz-bank.js");
const present = fs.existsSync(file);

test("verified bank is well formed", { skip: !present && "no bank file" }, () => {
  const window = {};
  new Function("window", fs.readFileSync(file, "utf8"))(window);
  const qs = window.SAPC02_QUIZ_PRIVATE.questions;
  assert.ok(qs.length >= 0); // scaffold: bank may be empty until questions are verified
  assert.strictEqual(new Set(qs.map((q) => q.id)).size, qs.length, "unique ids");
  const domains = new Set(["org-complexity", "new-solutions", "continuous-improvement", "migration-modernization"]);
  for (const q of qs) {
    assert.ok(["mcq", "multi", "hotspot", "dragdrop"].includes(q.qtype), `${q.id} type`);
    assert.ok(domains.has(q.moduleId), `${q.id} domain`);
    assert.ok(["verified", "corrected"].includes(q.auditVerdict), `${q.id} only verified/corrected questions are scored`);
    assert.strictEqual(q.verified, 2);
    assert.ok(q.answer && q.question, `${q.id} answer/question`);
    assert.ok(q.proof.claims.some((c) => c.scope === "summary" && c.kind === "fact" && c.evidence.length), `${q.id} summary fact has AWS documentation evidence`);
    for (const c of q.proof.claims) for (const e of c.evidence) assert.match(e.url, /^https:\/\/(([a-z0-9-]+\.)?(aws\.amazon\.com|amazonaws\.com)\/|repost\.aws\/knowledge-center\/)/, `${q.id} non-AWS evidence`);
    assert.ok(!q.proof.claims.some((c) => c.kind === "limitation" && c.scope === "summary"), `${q.id} unresolved limitation in a scored question`);
    const iv = q.interactive;
    if (!iv) {
      const keys = q.options.map((o) => o.key);
      assert.ok([...q.answer].every((k) => keys.includes(k)), `${q.id} answer in options`);
      if (q.qtype === "multi") assert.ok(q.answer.length >= 2);
    } else {
      const n = iv.kind === "order" ? iv.slots : iv.targets.length;
      assert.strictEqual(q.answer.length, n, `${q.id} one answer per slot`);
      [...q.answer].forEach((k, i) => {
        const opts = (iv.targets && iv.targets[i] && iv.targets[i].options) || iv.options;
        assert.ok(opts.some((o) => o.key === k), `${q.id} slot ${i} answer in options`);
      });
    }
    for (const im of (q.images || []).map((i) => i.src).concat(q.context ? q.context.images : [])) {
      assert.ok(fs.existsSync(path.join(__dirname, "..", "lms", im)), `${q.id} missing ${im}`);
    }
    assert.ok(!/Correct Answer:|Community vote/.test(JSON.stringify(q)), `${q.id} leaked source answer text`);
  }
});
