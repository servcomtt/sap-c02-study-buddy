"use strict";

// Integrity of the per-lesson knowledge checks (lms/knowledge-checks.js) and of
// the Learn links in lesson content (lms/content.js). Knowledge checks are a
// separate question namespace from the graded practice bank (quiz-data.js).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const LMS = path.join(__dirname, "..", "lms");

function load(file, globalName) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(LMS, file), "utf8"), sandbox, { filename: file });
  return sandbox.window[globalName];
}

const checks = load("knowledge-checks.js", "SAPC02_KNOWLEDGE_CHECKS");
const lmsData = load("data.js", "SAPC02_LMS_DATA");
const content = load("content.js", "SAPC02_LESSON_CONTENT");
const quiz = load("quiz-data.js", "SAPC02_QUIZ");

const lessonKeys = lmsData.modules.flatMap((m) => m.lessons.map((l) => `${m.id}:${l.id}`));
const SCAFFOLD = Object.keys(checks).length === 0; // authoring not started: skip coverage checks
const allQuestions = Object.entries(checks).flatMap(([key, list]) => list.map((q) => ({ key, q })));

test("every lesson has a knowledge check of 3-5 questions", { skip: SCAFFOLD && "scaffold: no knowledge checks authored yet" }, () => {
  for (const key of lessonKeys) {
    const list = checks[key];
    assert.ok(Array.isArray(list), `${key} has no knowledge check`);
    assert.ok(list.length >= 3 && list.length <= 5, `${key} has ${list.length} questions`);
  }
});

test("knowledge checks map only to real lessons", () => {
  for (const key of Object.keys(checks)) {
    assert.ok(lessonKeys.includes(key), `${key} isn't a lesson in data.js`);
  }
});

test("question IDs are unique and don't collide with the practice bank", () => {
  const ids = allQuestions.map(({ q }) => q.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate knowledge-check IDs");
  const bankIds = new Set(quiz.questions.map((q) => q.id));
  for (const id of ids) {
    assert.match(id, /^kc-/, `${id} must use the kc- namespace`);
    assert.ok(!bankIds.has(id), `${id} collides with a practice question`);
  }
});

test("every question is well formed and its answer refers to its own options", () => {
  for (const { key, q } of allQuestions) {
    const where = `${key} ${q.id}`;
    assert.ok(["single", "multi"].includes(q.type), `${where}: unknown type ${q.type}`);
    assert.ok(q.question && q.question.trim().length > 10, `${where}: missing question text`);
    assert.ok(Array.isArray(q.options) && q.options.length >= 2, `${where}: needs at least two options`);
    const keys = q.options.map((o) => o.key);
    assert.equal(new Set(keys).size, keys.length, `${where}: duplicate option keys`);
    q.options.forEach((o) => assert.ok(o.text && o.text.trim(), `${where}: empty option ${o.key}`));
    const answer = String(q.answer);
    assert.match(answer, /^[A-Z]+$/, `${where}: answer must be option letters`);
    for (const letter of answer) assert.ok(keys.includes(letter), `${where}: answer ${letter} isn't an option`);
    if (q.type === "single") assert.equal(answer.length, 1, `${where}: single-answer question has ${answer.length} answers`);
    else assert.ok(answer.length >= 2, `${where}: multi-answer question needs two or more answers`);
    assert.ok(q.explanation && q.explanation.trim().length > 20, `${where}: missing explanation`);
    assert.ok(q.reference && q.reference.label, `${where}: missing reference label`);
    assert.match(q.reference.url, /^https:\/\/(docs\.aws\.amazon\.com|aws\.amazon\.com|skillbuilder\.aws|repost\.aws\/knowledge-center)\//, `${where}: reference must be a AWS documentation URL`);
  }
});

test("correct answers aren't all in the same option position", { skip: SCAFFOLD && "scaffold" }, () => {
  const firstLetters = new Set(allQuestions.map(({ q }) => String(q.answer)[0]));
  assert.ok(firstLetters.size >= 3, "answer positions are too uniform");
});

test("lesson content Learn links and tables are well formed", () => {
  for (const [key, lesson] of Object.entries(content)) {
    for (const topic of lesson.topics) {
      for (const block of topic.blocks) {
        if (block.type === "learn") {
          for (const link of block.links) {
            assert.ok(link.label && link.label.trim(), `${key} / ${topic.title}: Learn link without a label`);
            assert.match(link.url, /^https:\/\/(docs\.aws\.amazon\.com|aws\.amazon\.com|skillbuilder\.aws|repost\.aws\/knowledge-center)\//, `${key} / ${topic.title}: ${link.url}`);
          }
        }
        if (block.type === "table") {
          for (const row of block.rows) {
            assert.equal(row.length, block.headers.length, `${key} / ${topic.title}: row length doesn't match headers`);
          }
        }
      }
    }
  }
});
