/*
 * Learner-state storage adapter.
 *
 * Wraps browser storage with a versioned envelope, migration from the
 * unversioned keys used by earlier releases, quarantine of corrupted values,
 * and validated export/import. Works in the browser (window.SAPC02Storage)
 * and under Node for unit tests (module.exports).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SAPC02Storage = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const SCHEMA_VERSION = 2;
  const EXPORT_FORMAT = "sapc02-study-progress";
  const ENVELOPE_FORMAT = "sapc02-storage";
  const MAX_IMPORT_CHARS = 5 * 1024 * 1024;
  const MAX_DEPTH = 12;
  const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  class StorageError extends Error {
    constructor(code, message) {
      super(message);
      this.name = "StorageError";
      this.code = code;
    }
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  // Deep-copies JSON-compatible data. Prototype-polluting keys are dropped,
  // so untrusted input can never reach Object.prototype through a merge.
  function cleanJson(value, depth = 0) {
    if (depth > MAX_DEPTH) {
      throw new StorageError("too-deep", "Data is nested too deeply.");
    }
    if (value === null || typeof value === "string" || typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new StorageError("invalid-number", "Numbers must be finite.");
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => cleanJson(item, depth + 1));
    }
    if (isPlainObject(value)) {
      const out = {};
      for (const key of Object.keys(value)) {
        if (UNSAFE_KEYS.has(key) || value[key] === undefined) continue;
        out[key] = cleanJson(value[key], depth + 1);
      }
      return out;
    }
    throw new StorageError("unsupported-type", "Unsupported value type in stored data.");
  }

  function wrap(state) {
    return {
      format: ENVELOPE_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      state: cleanJson(state),
    };
  }

  // Returns the cleaned state payload, or throws a StorageError describing why
  // the stored value cannot be used.
  function unwrap(value) {
    if (!isPlainObject(value)) {
      throw new StorageError("invalid-envelope", "Stored value is not an object.");
    }
    if (typeof value.schemaVersion === "number" && value.schemaVersion > SCHEMA_VERSION) {
      throw new StorageError("newer-schema", `Stored schema ${value.schemaVersion} is newer than ${SCHEMA_VERSION}.`);
    }
    if (value.schemaVersion !== SCHEMA_VERSION || !isPlainObject(value.state)) {
      throw new StorageError("invalid-envelope", "Stored value has an unsupported envelope.");
    }
    return cleanJson(value.state);
  }

  // Creates a store for one learner-state key.
  //   storage:   a Storage-like object (getItem/setItem/removeItem)
  //   key:       the current versioned key
  //   legacyKey: the unversioned key from earlier releases (read, never deleted here)
  //   normalize: (rawState) => fully populated state object
  function createStore({ storage, key, legacyKey = null, normalize }) {
    let readOnly = false;

    function readRaw(storageKey) {
      const raw = storage.getItem(storageKey);
      if (raw === null) return { status: "missing" };
      try {
        return { status: "ok", value: JSON.parse(raw), raw };
      } catch (error) {
        return { status: "corrupt", raw };
      }
    }

    // Keep corrupted bytes for manual recovery. Never delete them.
    function quarantine(raw) {
      storage.setItem(`${key}.corrupt-backup`, raw);
    }

    function load() {
      const current = readRaw(key);
      if (current.status === "ok") {
        try {
          return { state: normalize(unwrap(current.value)), source: "current" };
        } catch (error) {
          if (error.code === "newer-schema") {
            // Refuse to overwrite data written by a newer release.
            readOnly = true;
            return { state: normalize({}), source: "default", error: error.code };
          }
          quarantine(current.raw);
          return { state: normalize({}), source: "default", error: error.code };
        }
      }
      if (current.status === "corrupt") {
        quarantine(current.raw);
        return { state: normalize({}), source: "default", error: "corrupt-json" };
      }

      // No current value: migrate from the legacy key if one exists. The legacy
      // key is left in place so a failed migration never loses progress.
      if (legacyKey) {
        const legacy = readRaw(legacyKey);
        if (legacy.status === "ok" && isPlainObject(legacy.value)) {
          const state = normalize(cleanJson(legacy.value));
          save(state);
          return { state, source: "legacy" };
        }
      }
      return { state: normalize({}), source: "default" };
    }

    function save(state) {
      if (readOnly) {
        return { ok: false, reason: "newer-schema" };
      }
      try {
        storage.setItem(key, JSON.stringify(wrap(state)));
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: "write-failed", message: String(error && error.message) };
      }
    }

    return { load, save, normalize, key, legacyKey };
  }

  // Builds a backup document from one or more named state sections.
  function buildExport(sections, now = new Date()) {
    return {
      format: EXPORT_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      sections: cleanJson(sections),
    };
  }

  // Validates backup text. Returns cleaned sections; throws StorageError otherwise.
  function parseImport(text) {
    if (typeof text !== "string" || text.length === 0) {
      throw new StorageError("empty", "The file is empty.");
    }
    if (text.length > MAX_IMPORT_CHARS) {
      throw new StorageError("too-large", "The file is too large to be a progress backup.");
    }
    let doc;
    try {
      doc = JSON.parse(text);
    } catch (error) {
      throw new StorageError("invalid-json", "The file is not valid JSON.");
    }
    if (isPlainObject(doc) && typeof doc.format === "string" && doc.format !== EXPORT_FORMAT && /^az-?\d+-study-progress$/i.test(doc.format)) {
      throw new StorageError("wrong-course", "This backup belongs to a different course and can't be imported into SAP-C02 Study Buddy. Nothing was changed.");
    }
    if (!isPlainObject(doc) || doc.format !== EXPORT_FORMAT) {
      throw new StorageError("wrong-format", "This file is not an SAP-C02 progress backup.");
    }
    if (doc.schemaVersion !== SCHEMA_VERSION) {
      throw new StorageError("unsupported-version", `Backup schema ${doc.schemaVersion} is not supported.`);
    }
    if (!isPlainObject(doc.sections)) {
      throw new StorageError("invalid-sections", "The backup has no progress sections.");
    }
    const sections = cleanJson(doc.sections);
    for (const name of ["lms", "quiz"]) {
      if (sections[name] !== undefined && !isPlainObject(sections[name])) {
        throw new StorageError("invalid-sections", `The "${name}" section is malformed.`);
      }
    }
    const shape = {
      lms: ["completed", "bookmarks", "labProgress", "labChecks"],
      quiz: ["record"],
    };
    for (const [name, fields] of Object.entries(shape)) {
      const section = sections[name] || {};
      for (const field of fields) {
        if (section[field] !== undefined && !isPlainObject(section[field])) {
          throw new StorageError("invalid-sections", `"${name}.${field}" must be an object.`);
        }
      }
    }
    return sections;
  }

  // Short human-readable counts for the review step before an import.
  function summarizeSections(sections) {
    const count = (value) => (isPlainObject(value) ? Object.keys(value).length : 0);
    const lms = sections.lms || {};
    const quiz = sections.quiz || {};
    return {
      completedLessons: Object.values(lms.completed || {}).filter(Boolean).length,
      bookmarks: count(lms.bookmarks),
      labsStarted: count(lms.labProgress),
      quizRecords: count(quiz.record),
    };
  }

  // Learner-state keys. Reset deletes only these; corrupt-data copies and the
  // pre-import recovery copy are kept on purpose.
  const LEARNER_KEYS = {
    lms: { current: "sapc02-lms-state-v2", legacy: "sapc02-lms-state-v1" },
    quiz: { current: "sapc02-quiz-state-v2", legacy: "sapc02-quiz-state-v1" },
  };
  const PRE_IMPORT_KEY = "sapc02-progress-before-import";

  // Returns localStorage when it is usable. Otherwise returns an in-memory
  // stand-in so the app still runs for this visit, and isPersistent() is false.
  function browserStorage(root = typeof window !== "undefined" ? window : globalThis) {
    try {
      const storage = root.localStorage;
      storage.setItem("__sapc02_probe__", "1");
      storage.removeItem("__sapc02_probe__");
      return storage;
    } catch (error) {
      const memory = new Map();
      return {
        getItem: (k) => (memory.has(k) ? memory.get(k) : null),
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k),
      };
    }
  }

  function isPersistent(root = typeof window !== "undefined" ? window : globalThis) {
    try {
      root.localStorage.setItem("__sapc02_probe__", "1");
      root.localStorage.removeItem("__sapc02_probe__");
      return true;
    } catch (error) {
      return false;
    }
  }

  // Removes learner-state keys only. Returns the keys that were removed.
  function clearLearnerData(storage) {
    const removed = [];
    for (const section of Object.values(LEARNER_KEYS)) {
      for (const key of [section.current, section.legacy]) {
        if (storage.getItem(key) !== null) {
          storage.removeItem(key);
          removed.push(key);
        }
      }
    }
    return removed;
  }

  function savePreImportCopy(storage, doc) {
    storage.setItem(PRE_IMPORT_KEY, JSON.stringify(doc));
  }

  return {
    SCHEMA_VERSION,
    EXPORT_FORMAT,
    LEARNER_KEYS,
    PRE_IMPORT_KEY,
    StorageError,
    cleanJson,
    createStore,
    buildExport,
    parseImport,
    summarizeSections,
    browserStorage,
    isPersistent,
    clearLearnerData,
    savePreImportCopy,
  };
});
