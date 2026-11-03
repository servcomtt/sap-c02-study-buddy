"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const storage = require(path.join(__dirname, "..", "lms", "storage.js"));

// In-memory stand-in for window.localStorage.
class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

// Storage that refuses every write, like a full or blocked quota.
class FullStorage extends MemoryStorage {
  setItem() {
    throw new Error("QuotaExceededError");
  }
}

const KEY = "sapc02-test-state-v2";
const LEGACY = "sapc02-test-state-v1";

function normalize(saved) {
  return {
    view: saved.view || "dashboard",
    completed: saved.completed || {},
    bookmarks: saved.bookmarks || {},
  };
}

function makeStore(backend, withLegacy = true) {
  return storage.createStore({
    storage: backend,
    key: KEY,
    legacyKey: withLegacy ? LEGACY : null,
    normalize,
  });
}

test("cleanJson drops prototype-polluting keys and never reaches Object.prototype", () => {
  const hostile = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"x":1}},"ok":1}');
  const cleaned = storage.cleanJson(hostile);

  assert.deepEqual(cleaned, { ok: 1 });
  assert.equal({}.polluted, undefined);
  assert.equal({}.x, undefined);
});

test("cleanJson rejects non-finite numbers and excessive depth", () => {
  assert.throws(() => storage.cleanJson({ n: Infinity }), { code: "invalid-number" });

  let deep = {};
  let cursor = deep;
  for (let i = 0; i < 20; i++) {
    cursor.next = {};
    cursor = cursor.next;
  }
  assert.throws(() => storage.cleanJson(deep), { code: "too-deep" });
});

test("fresh storage yields defaults and saves a versioned envelope", () => {
  const backend = new MemoryStorage();
  const store = makeStore(backend);

  const loaded = store.load();
  assert.equal(loaded.source, "default");
  assert.deepEqual(loaded.state, normalize({}));

  assert.deepEqual(store.save({ view: "module", completed: { "a:b": true }, bookmarks: {} }), { ok: true });
  const envelope = JSON.parse(backend.getItem(KEY));
  assert.equal(envelope.schemaVersion, storage.SCHEMA_VERSION);
  assert.equal(envelope.format, "sapc02-storage");
  assert.equal(envelope.state.view, "module");
});

test("save then load round-trips state", () => {
  const backend = new MemoryStorage();
  const store = makeStore(backend);
  store.save({ view: "practice", completed: { "x:y": true }, bookmarks: { "x:y": 1 } });

  const loaded = makeStore(backend).load();
  assert.equal(loaded.source, "current");
  assert.equal(loaded.state.view, "practice");
  assert.deepEqual(loaded.state.completed, { "x:y": true });
});

test("legacy unversioned state migrates and the legacy key is kept", () => {
  const backend = new MemoryStorage();
  const legacy = { view: "module", completed: { "orientation:intro": true }, bookmarks: {} };
  backend.setItem(LEGACY, JSON.stringify(legacy));

  const loaded = makeStore(backend).load();
  assert.equal(loaded.source, "legacy");
  assert.deepEqual(loaded.state.completed, { "orientation:intro": true });

  // Migration writes the new key but must not delete the old one.
  assert.notEqual(backend.getItem(KEY), null);
  assert.equal(backend.getItem(LEGACY), JSON.stringify(legacy));
});

test("corrupted JSON is quarantined, not deleted, and defaults are returned", () => {
  const backend = new MemoryStorage();
  backend.setItem(KEY, "{not json");

  const loaded = makeStore(backend).load();
  assert.equal(loaded.error, "corrupt-json");
  assert.deepEqual(loaded.state, normalize({}));
  assert.equal(backend.getItem(`${KEY}.corrupt-backup`), "{not json");
});

test("a newer schema version is never overwritten", () => {
  const backend = new MemoryStorage();
  const future = JSON.stringify({ schemaVersion: 99, state: { view: "future" } });
  backend.setItem(KEY, future);

  const store = makeStore(backend);
  const loaded = store.load();
  assert.equal(loaded.error, "newer-schema");
  assert.deepEqual(store.save({ view: "overwrite" }), { ok: false, reason: "newer-schema" });
  assert.equal(backend.getItem(KEY), future);
});

test("write failures are reported instead of thrown", () => {
  const store = makeStore(new FullStorage());
  const result = store.save({ view: "x" });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "write-failed");
});

test("buildExport and parseImport round-trip with a schema version and timestamp", () => {
  const doc = storage.buildExport({ lms: { completed: { "a:b": true } }, quiz: { record: {} } }, new Date("2026-10-19T00:00:00Z"));
  assert.equal(doc.format, storage.EXPORT_FORMAT);
  assert.equal(doc.schemaVersion, storage.SCHEMA_VERSION);
  assert.equal(doc.exportedAt, "2026-10-19T00:00:00.000Z");

  const sections = storage.parseImport(JSON.stringify(doc));
  assert.deepEqual(sections.lms.completed, { "a:b": true });
});

test("parseImport rejects bad input with specific codes", () => {
  const good = storage.buildExport({ lms: {}, quiz: {} });
  const cases = [
    ["", "empty"],
    ["x".repeat(5 * 1024 * 1024 + 1), "too-large"],
    ["{broken", "invalid-json"],
    [JSON.stringify({ ...good, format: "other" }), "wrong-format"],
    [JSON.stringify({ ...good, schemaVersion: 1 }), "unsupported-version"],
    [JSON.stringify({ ...good, sections: null }), "invalid-sections"],
    [JSON.stringify({ ...good, sections: { lms: [] } }), "invalid-sections"],
    [JSON.stringify({ ...good, sections: { lms: { completed: [] } } }), "invalid-sections"],
    [JSON.stringify({ ...good, sections: { quiz: { record: "nope" } } }), "invalid-sections"],
  ];
  for (const [text, code] of cases) {
    assert.throws(() => storage.parseImport(text), { code }, `expected ${code}`);
  }
});

test("parseImport drops prototype-polluting keys inside a backup", () => {
  const text =
    '{"format":"sapc02-study-progress","schemaVersion":2,"exportedAt":"x","sections":{"lms":{"__proto__":{"polluted":true},"completed":{}}}}';
  const sections = storage.parseImport(text);
  assert.equal(sections.lms.__proto__.polluted, undefined);
  assert.equal({}.polluted, undefined);
});

test("clearLearnerData removes only learner keys and keeps recovery copies", () => {
  const backend = new MemoryStorage();
  const keys = {
    lms: storage.LEARNER_KEYS.lms,
    quiz: storage.LEARNER_KEYS.quiz,
  };
  backend.setItem(keys.lms.current, "{}");
  backend.setItem(keys.lms.legacy, "{}");
  backend.setItem(keys.quiz.current, "{}");
  backend.setItem(keys.quiz.legacy, "{}");
  backend.setItem("sapc02-labs-freshness", "{}");
  backend.setItem(storage.PRE_IMPORT_KEY, "{}");
  backend.setItem(`${keys.lms.current}.corrupt-backup`, "bad");
  backend.setItem("unrelated-site-key", "keep");

  const removed = storage.clearLearnerData(backend);

  assert.equal(removed.length, 4);
  assert.equal(backend.getItem(keys.lms.current), null);
  assert.equal(backend.getItem(keys.lms.legacy), null);
  assert.equal(backend.getItem(keys.quiz.current), null);
  assert.equal(backend.getItem(keys.quiz.legacy), null);
  assert.equal(backend.getItem("sapc02-labs-freshness"), "{}");
  assert.equal(backend.getItem(storage.PRE_IMPORT_KEY), "{}");
  assert.equal(backend.getItem("unrelated-site-key"), "keep");
});

test("summarizeSections counts completed lessons, bookmarks and quiz records", () => {
  const summary = storage.summarizeSections({
    lms: { completed: { a: true, b: false, c: true }, bookmarks: { x: 1 }, labProgress: {} },
    quiz: { record: { q1: {}, q2: {} } },
  });
  assert.deepEqual(summary, { completedLessons: 2, bookmarks: 1, labsStarted: 0, quizRecords: 2 });
});

test("a backup from another course is rejected with a clear message and nothing is parsed", () => {
  const other = JSON.stringify({ format: "az104-study-progress", schemaVersion: 2, exportedAt: "2026-01-01T00:00:00Z", sections: { lms: { completed: { "storage:intro": true } } } });
  assert.throws(
    () => storage.parseImport(other),
    (error) => error.code === "wrong-course" && /different course/.test(error.message)
  );
});
