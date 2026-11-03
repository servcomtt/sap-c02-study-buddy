/* SAP-C02 Study Buddy — practice quiz engine.
 * Data: window.SAPC02_QUIZ (generated from Quiz/sapc02_quiz.db by tools/export_quiz_data.py).
 */
(function () {
  "use strict";

  const storageKey = window.SAPC02Storage.LEARNER_KEYS.quiz.current;
  const learnerStore = window.SAPC02Storage.createStore({
    storage: window.SAPC02Storage.browserStorage(),
    key: storageKey,
    legacyKey: window.SAPC02Storage.LEARNER_KEYS.quiz.legacy,
    normalize: normalizeQuizState,
  });
  // Decorative interface icons from icons.js (bundled Lucide subset).
  const icon = (name, className) => (window.SAPC02Icons ? window.SAPC02Icons.icon(name, className) : "");
  const EXAM_SIZE = 50;
  const EXAM_MINUTES = 90;
  // The committed bank plus the optional local-only imported bank (see bank-loader.js).
  const bank = () => ((window.SAPC02_QUIZ && window.SAPC02_QUIZ.questions) || []).concat((window.SAPC02_QUIZ_PRIVATE && window.SAPC02_QUIZ_PRIVATE.questions) || []);

  // Quiz topics follow the five skills-measured domains in data.js.
  const DOMAINS = ((window.SAPC02_LMS_DATA && window.SAPC02_LMS_DATA.examDomains) || []).map((d) => ({ id: d.id, title: d.title }));

  const MODULE_NAMES = Object.fromEntries(DOMAINS.map((d) => [d.id, d.title]));

  const TYPE_LABELS = {
    mcq: "Multiple choice",
    multi: "Multi-select",
    yesno: "Yes / No",
    hotspot: "Table / matching",
    dragdrop: "Ordering / selection",
  };

  let state = loadState();
  let timerHandle = null;

  // Fills every field with a safe default. Shared by loads, migration,
  // backup imports and empty state.
  function normalizeQuizState(saved) {
    return {
      screen: saved.screen || "setup",
      mode: saved.mode || "training",
      topics: Array.isArray(saved.topics) ? saved.topics : [],
      order: saved.order || "random",
      size: Number.isFinite(saved.size) ? saved.size : 25,
      types: saved.types || "all",
      session: pruneSession(saved.session || null),
      record: saved.record || {},
    };
  }

  // Drops question IDs that are no longer in the bank (retired questions) from a
  // saved session so resuming it doesn't land on a missing question.
  function pruneSession(session) {
    if (!session || !Array.isArray(session.ids)) return session;
    const known = new Set(bank().map((q) => q.id));
    if (!known.size) return session;
    const ids = session.ids.filter((id) => known.has(id));
    if (ids.length === session.ids.length) return session;
    if (!ids.length) return null;
    const kept = ids.indexOf(session.ids[session.index]);
    return { ...session, ids, index: kept >= 0 ? kept : Math.min(session.index || 0, ids.length - 1) };
  }

  function loadState() {
    return learnerStore.load().state;
  }

  function persist() {
    learnerStore.save(state);
  }

  function domainCounts() {
    const counts = Object.fromEntries(DOMAINS.map((d) => [d.id, 0]));
    bank().forEach((q) => {
      if (counts[q.moduleId] !== undefined) counts[q.moduleId] += 1;
    });
    return counts;
  }

  function pool(topics, types) {
    const activeTopics = topics && topics.length ? topics : null;
    return bank().filter((q) => {
      if (activeTopics && !activeTopics.includes(q.moduleId)) return false;
      if (types === "choice" && !["mcq", "multi", "yesno"].includes(q.qtype)) return false;
      if (types === "visual" && !["hotspot", "dragdrop"].includes(q.qtype)) return false;
      return true;
    });
  }

  function poolSize() {
    return pool(state.topics, state.types).length;
  }

  function effectiveSize() {
    if (state.mode === "exam") return Math.min(EXAM_SIZE, poolSize());
    const max = poolSize();
    if (!max) return 0;
    if (!state.size || state.size <= 0) return max;
    return Math.min(state.size, max);
  }

  function shuffle(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function byId(id) {
    return bank().find((q) => q.id === id);
  }

  function lifetime() {
    const entries = Object.values(state.record);
    const attempted = entries.length;
    const correct = entries.filter((e) => e.correct).length;
    return { attempted, correct, pct: attempted ? Math.round((correct / attempted) * 100) : 0 };
  }

  function startSession(ids) {
    const mode = state.mode;
    state.session = {
      ids,
      index: 0,
      answers: {},
      mode,
      deadline: mode === "exam" ? Date.now() + EXAM_MINUTES * 60 * 1000 : null,
    };
    state.screen = "session";
    persist();
  }

  function buildSessionIds() {
    let items = pool(state.topics, state.types);
    if (state.order === "random") items = shuffle(items);
    const size = effectiveSize();
    return items.slice(0, size).map((q) => q.id);
  }

  function currentQuestion() {
    const s = state.session;
    return s && byId(s.ids[s.index]);
  }

  function answerState(qid) {
    return state.session.answers[qid] || (state.session.answers[qid] = { selected: [], checked: false, correct: null, revealed: false });
  }

  function hasInteractive(q) {
    return !!(q && q.interactive && q.interactive.kind);
  }

  function interactiveSlots(q) {
    const iv = q.interactive;
    // yes/no tables and match questions both have one slot per target row.
    if (iv.kind === "match" || iv.kind === "yesno") return iv.targets.length;
    if (iv.kind === "select") return iv.pick;
    return iv.slots;
  }

  function ensureInteractiveSelection(q, a) {
    if (!hasInteractive(q)) return;
    const n = interactiveSlots(q);
    if (!Array.isArray(a.selected) || a.selected.length !== n) {
      a.selected = Array(n).fill("");
    }
  }

  function interactiveComplete(q, selected) {
    if (!hasInteractive(q)) return selected.length > 0;
    return selected.length === interactiveSlots(q) && selected.every(Boolean);
  }

  function answerLabel(q) {
    const ans = q.answer || "";
    if (!ans) return "see answer sheet";

    if (!hasInteractive(q)) {
      const opts = Object.fromEntries((q.options || []).map((o) => [o.key, o.text]));
      if (Object.keys(opts).length) {
        return ans
          .split("")
          .map((k) => opts[k] || k)
          .join(" | ");
      }
      return ans;
    }

    const iv = q.interactive;
    const opts = Object.fromEntries(iv.options.map((o) => [o.key, o.text]));
    if (iv.kind === "match" || iv.kind === "yesno") {
      return iv.targets
        .map((t, i) => {
          const own = t.options ? Object.fromEntries(t.options.map((o) => [o.key, o.text])) : opts;
          return `${t.label}: ${own[ans[i]] || ans[i]}`;
        })
        .join("; ");
    }
    if (iv.kind === "order") {
      return ans
        .split("")
        .map((k) => opts[k] || k)
        .join(" → ");
    }
    if (iv.kind === "select") {
      return ans
        .split("")
        .sort()
        .map((k) => opts[k] || k)
        .join("; ");
    }
    return ans;
  }

  function grade(question, selected) {
    const iv = question.interactive;
    if (iv) {
      const filled = selected.filter(Boolean);
      if (iv.kind === "select") {
        const want = (question.answer || "").split("").sort().join("");
        const got = filled.slice().sort().join("");
        return want.length > 0 && want === got;
      }
      const got = filled.join("");
      return (question.answer || "").length > 0 && got === question.answer;
    }
    const want = (question.answer || "").split("").sort().join("");
    const got = (selected || []).filter(Boolean).slice().sort().join("");
    return want.length > 0 && want === got;
  }

  function isSelfGradedVisual(q) {
    return !hasInteractive(q) && (q.qtype === "hotspot" || q.qtype === "dragdrop");
  }

  function canCheckAnswer(q, a) {
    if (hasInteractive(q)) return interactiveComplete(q, a.selected);
    const selected = (a.selected || []).filter(Boolean);
    if (!selected.length) return false;
    if (q.qtype === "multi") {
      const need = (q.answer || "").length;
      return need > 0 ? selected.length === need : selected.length > 0;
    }
    return true;
  }

  /** Re-grade checked auto-graded answers against the current bank (answer keys can change). */
  function syncSessionGrades() {
    const s = state.session;
    if (!s) return;
    let changed = false;
    s.ids.forEach((id) => {
      const q = byId(id);
      const a = s.answers[id];
      if (!q || !a || !a.checked || isSelfGradedVisual(q)) return;
      const next = grade(q, a.selected);
      if (a.correct !== next) {
        a.correct = next;
        recordResult(id, next);
        changed = true;
      }
    });
    if (changed) persist();
  }

  function recordResult(qid, correct) {
    state.record[qid] = { correct, at: Date.now() };
  }

  function sessionScore() {
    const s = state.session;
    let checked = 0;
    let correct = 0;
    s.ids.forEach((id) => {
      const a = s.answers[id];
      if (a && a.checked) {
        checked += 1;
        if (a.correct) correct += 1;
      }
    });
    return { checked, correct, total: s.ids.length };
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function clearTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function bindExamTimer(container) {
    clearTimer();
    if (!state.session || state.session.mode !== "exam" || !state.session.deadline) return;
    const el = container.querySelector("#pqTimer");
    if (!el) return;
    const tick = () => {
      const remaining = state.session.deadline - Date.now();
      if (remaining <= 0) {
        clearTimer();
        state.screen = "results";
        persist();
        render(container);
        return;
      }
      el.textContent = formatTime(remaining);
    };
    tick();
    timerHandle = setInterval(tick, 1000);
  }

  function render(container) {
    clearTimer();
    if (!bank().length) {
      container.innerHTML = '<div class="empty-state">The practice questions didn\'t load. Reload the page to try again.</div>';
      return;
    }
    // quiz-data.js loads after this script, so drop retired question IDs here, once the bank exists.
    if (state.session) {
      state.session = pruneSession(state.session);
      if (!state.session) state.screen = "setup";
    }
    if (state.session) syncSessionGrades();
    if (state.screen === "session" && state.session) renderSession(container);
    else if (state.screen === "results" && state.session) renderResults(container);
    else renderSetup(container);
  }

  function renderSetup(container) {
    const total = bank().length;
    const counts = domainCounts();
    const matching = poolSize();
    const maxSize = matching || total;
    // "Full" is the size-0 sentinel meaning "every question in the current
    // pool". Treat 0 (or a value at/above the pool) as full so the button
    // highlights and the custom box never shows a bare 0.
    const isFull = state.mode !== "exam" && (!state.size || state.size >= maxSize);
    const resumable = state.session && sessionScore().checked < state.session.ids.length;
    const sizePresets = [10, 25, 50];
    const selectedTopics = new Set(state.topics);

    container.innerHTML = `
      <div class="pq-setup">
        <div class="pq-setup-toolbar">
          <div class="pq-setup-toolbar-copy">
            <span class="pq-setup-eyebrow">practiceQuiz</span>
            <p>Original SAP-C02 practice questions with explanations and AWS documentation references.</p>
          </div>
          <div class="pq-setup-toolbar-actions">
            <button class="button pq-btn-ghost" data-action="quiz-reset-stats" type="button">Reset Progress</button>
            ${resumable ? `<button class="button primary" data-action="quiz-resume" type="button">${icon("play")} Start Studying</button>` : ""}
          </div>
        </div>

        <section class="dashboard-hero pq-hero">
          <h2>Practice Quiz</h2>
          <p>SAP-C02 practice questions from the local exam bank. Use training mode for instant feedback or exam mode for a timed mixed set like the real assessment.</p>
          <div class="exam-meta">
            <div><div class="label">Questions</div><div class="value">${total}</div></div>
            <div><div class="label">Domains</div><div class="value">${DOMAINS.length}</div></div>
            <div><div class="label">Format</div><div class="value">Browser</div></div>
          </div>
        </section>

        ${resumable ? `
          <div class="dashboard-resume-card pq-resume" data-action="quiz-resume" role="button" tabindex="0">
            <div class="resume-card-icon">${icon("notebook-pen")}</div>
            <div class="resume-card-body">
              <div class="resume-card-greeting">Session in progress</div>
              <div class="resume-card-title">Question ${sessionScore().checked + 1} of ${state.session.ids.length}</div>
              <div class="resume-card-sub">Pick up where you left off</div>
            </div>
            <button class="resume-card-btn" data-action="quiz-resume" type="button">Resume quiz ${icon("arrow-right")}</button>
          </div>` : ""}

        <section class="pq-panel">
          <h3 class="pq-panel-title"><span class="pq-panel-icon">${icon("target")}</span> Choose Mode</h3>
          <div class="pq-mode-grid">
            <button class="pq-mode-card${state.mode === "training" ? " selected" : ""}" data-action="quiz-set-mode" data-mode="training" type="button">
              <span class="pq-mode-icon">${icon("book-open")}</span>
              <span class="pq-mode-name">Training Mode</span>
              <span class="pq-mode-desc">Instant feedback. Full explanation after each answer. Learn as you go.</span>
            </button>
            <button class="pq-mode-card${state.mode === "exam" ? " selected" : ""}" data-action="quiz-set-mode" data-mode="exam" type="button">
              <span class="pq-mode-icon">${icon("timer")}</span>
              <span class="pq-mode-name">Exam Mode</span>
              <span class="pq-mode-desc">${EXAM_SIZE} questions. ${EXAM_MINUTES} minutes. No feedback until the end. Practice setting, not the official exam format.</span>
            </button>
          </div>
        </section>

        <section class="pq-panel">
          <h3 class="pq-panel-title"><span class="pq-panel-icon">${icon("list-checks")}</span> Select Topics</h3>
          <p class="pq-panel-hint">Choose one or more domains or leave all unselected to include every domain.</p>
          <div class="pq-topic-grid">
            ${DOMAINS.map((domain) => {
              const count = counts[domain.id] || 0;
              const active = selectedTopics.has(domain.id);
              return `
                <button class="pq-topic-card${active ? " selected" : ""}" data-action="quiz-toggle-topic" data-topic="${escapeAttr(domain.id)}" type="button">
                  <span class="pq-topic-name">${escapeHtml(domain.title)}</span>
                  <span class="pq-topic-count">${count} questions</span>
                </button>
              `;
            }).join("")}
          </div>
          <div class="pq-topic-actions">
            <button class="button pq-btn-muted" data-action="quiz-topics-all" type="button">Select All</button>
            <button class="button pq-btn-muted" data-action="quiz-topics-clear" type="button">Clear All</button>
          </div>
        </section>

        <section class="pq-panel">
          <h3 class="pq-panel-title"><span class="pq-panel-icon">${icon("settings")}</span> Quiz Options</h3>
          <div class="pq-option-block">
            <div class="pq-option-label">Order</div>
            <div class="pq-toggle-row">
              <button class="pq-toggle${state.order === "random" ? " active" : ""}" data-action="quiz-set-order" data-order="random" type="button"${state.mode === "exam" ? " disabled" : ""}>Randomize Questions</button>
              <button class="pq-toggle${state.order === "ordered" ? " active" : ""}" data-action="quiz-set-order" data-order="ordered" type="button"${state.mode === "exam" ? " disabled" : ""}>In Order</button>
            </div>
          </div>
          <div class="pq-option-block">
            <div class="pq-option-label">Number of Questions</div>
            <div class="pq-size-row">
              ${sizePresets.map((n) => `
                <button class="pq-size-btn${state.mode !== "exam" && state.size === n ? " active" : ""}" data-action="quiz-set-size" data-size="${n}" type="button"${state.mode === "exam" ? " disabled" : ""}>${n}</button>
              `).join("")}
              <button class="pq-size-btn${isFull ? " active" : ""}" data-action="quiz-set-size" data-size="0" type="button"${state.mode === "exam" ? " disabled" : ""}>${maxSize} (Full)</button>
              <label class="pq-size-input-wrap">
                <input id="pqSizeCustom" type="number" min="1" max="${maxSize}" value="${state.mode === "exam" ? EXAM_SIZE : state.size > 0 ? state.size : maxSize}"${state.mode === "exam" ? " disabled" : ""} />
                <span>max: <strong id="pqPool">${maxSize}</strong></span>
              </label>
            </div>
          </div>
        </section>

        <button class="button primary pq-start-btn" data-action="quiz-start" type="button">
          ${icon("play")} ${state.mode === "exam" ? "Start Exam" : "Start Training"}
        </button>
      </div>
    `;
  }

  function renderSession(container) {
    const q = currentQuestion();
    if (!q) {
      state.screen = "setup";
      persist();
      renderSetup(container);
      return;
    }
    const s = state.session;
    const isExam = s.mode === "exam";
    const a = answerState(q.id);
    const score = sessionScore();
    // Keep PDF exhibits visible even when an interactive answer UI is present;
    // only suppress answer-sheet images (those are replaced by the interactive grader).
    const exhibits = (q.images || []).filter((im) => im.role === "exhibit");
    const answersImgs = hasInteractive(q) ? [] : (q.images || []).filter((im) => im.role === "answer");
    const isVisual = !hasInteractive(q) && (q.qtype === "hotspot" || q.qtype === "dragdrop");
    const multi = q.qtype === "multi" && !hasInteractive(q);
    ensureInteractiveSelection(q, a);
    const remaining = s.deadline ? s.deadline - Date.now() : 0;

    if (isExam && remaining <= 0) {
      state.screen = "results";
      persist();
      renderResults(container);
      return;
    }

    container.innerHTML = `
      <div class="pq-topbar">
        <span class="topic-counter">${isExam ? "Exam" : "Training"} · Question ${s.index + 1} / ${s.ids.length}</span>
        <div class="pq-progressbar"><div style="width:${Math.round(((s.index + 1) / s.ids.length) * 100)}%"></div></div>
        ${isExam ? `<span class="pq-timer" id="pqTimer">${formatTime(remaining)}</span>` : `<span class="pq-score"><span class="pq-score-correct">${score.correct}</span>/${score.checked} correct</span>`}
        <button class="button" data-action="quiz-quit" type="button">End</button>
      </div>

      <section class="quiz-card">
        <div class="pq-meta">
          <span class="tag primary">${TYPE_LABELS[q.qtype] || q.qtype}</span>
          <span class="tag">${MODULE_NAMES[q.moduleId] || q.moduleId}</span>
          ${hasInteractive(q) ? `<span class="tag accent">${interactiveKindLabel(q.interactive.kind)}</span>` : ""}
          ${multi ? `<span class="tag accent">Select ${q.answer.length}</span>` : ""}
          ${q.verified === 2 ? '<span class="tag accent">AWS documentation</span>' : ""}
          ${q.imported ? `<span class="tag">Verified bank · ${escapeHtml(q.auditLabel || "unverified")}</span>` : ""}
        </div>
        ${contextMarkup(q)}
        <div class="pq-question">${escapeHtml(q.question)}</div>
        ${exhibits.map((im) => `<img class="pq-img" src="${im.src ? escapeAttr(im.src) : `quiz_images/${escapeAttr(im.file)}`}" alt="Question exhibit" loading="lazy" />`).join("")}

        ${hasInteractive(q) ? interactiveMarkup(q, a) : isVisual ? visualMarkup(q, a, answersImgs, isExam) : choiceMarkup(q, a, multi)}

        ${!isExam && a.checked ? feedbackMarkup(q, a) : ""}

        <div class="quiz-nav">
          <button class="button" data-action="quiz-prev" type="button"${s.index === 0 ? " disabled" : ""}>${icon("arrow-left")} Previous</button>
          ${!isExam && !a.checked && !isVisual ? `<button class="button primary" data-action="quiz-check" type="button"${canCheckAnswer(q, a) ? "" : " disabled"}>Check answer</button>` : ""}
          ${isExam || a.checked || isVisual ? `<button class="button primary" data-action="quiz-next" type="button">${s.index === s.ids.length - 1 ? "Finish" : `Next ${icon("arrow-right")}`}</button>` : `<button class="button" data-action="quiz-next" type="button">Skip</button>`}
        </div>
      </section>
    `;
    container.scrollTop = 0;
    window.scrollTo(0, 0);
    bindExamTimer(container);
  }

  function interactiveKindLabel(kind) {
    if (kind === "order") return "Put in order";
    if (kind === "select") return "Select items";
    if (kind === "yesno") return "Yes / No table";
    if (kind === "match") return "Match each row";
    return "Interactive";
  }

  function interactiveMarkup(q, a) {
    const iv = q.interactive;
    ensureInteractiveSelection(q, a);
    if (iv.kind === "yesno") return yesNoMarkup(q, a, iv);
    if (iv.kind === "match") return matchMarkup(q, a, iv);
    return orderMarkup(q, a, iv);
  }

  function yesNoMarkup(q, a, iv) {
    return `
      <div class="pq-interactive pq-yesno-table">
        <p class="pq-order-hint">${escapeHtml(iv.poolLabel || "For each statement, select Yes if the statement is true. Otherwise, select No.")}</p>
        ${iv.targets
          .map((t, i) => {
            const val = a.selected[i] || "";
            const expected = q.answer[i] || "";
            const cls = a.checked && val ? (val === expected ? " correct" : " wrong") : "";
            return `
              <div class="pq-match-row${cls}">
                <span class="pq-match-label">${escapeHtml(t.label)}</span>
                <div class="pq-yesno-choices" role="group" aria-label="${escapeAttr(t.label)}">
                  ${iv.options
                    .map((o) => {
                      const selected = val === o.key;
                      return `<button type="button" class="pq-yesno-choice${selected ? " selected" : ""}" data-quiz-yn-slot="${i}" data-quiz-yn-value="${escapeAttr(o.key)}"${a.checked ? " disabled" : ""}>${escapeHtml(o.text)}</button>`;
                    })
                    .join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function matchMarkup(q, a, iv) {
    return `
      <div class="pq-interactive">
        <p class="pq-order-hint">${escapeHtml(iv.poolLabel || "Select the best option for each row.")}</p>
        ${iv.targets
          .map((t, i) => {
            const val = a.selected[i] || "";
            const expected = q.answer[i] || "";
            const cls = a.checked && val ? (val === expected ? " correct" : " wrong") : "";
            return `
              <label class="pq-match-row${cls}">
                <span class="pq-match-label">${escapeHtml(t.label)}</span>
                <select class="pq-order-select" data-quiz-slot="${i}"${a.checked ? " disabled" : ""}>
                  <option value="">— Select —</option>
                  ${(t.options || iv.options)
                    .map(
                      (o) =>
                        `<option value="${escapeAttr(o.key)}"${val === o.key ? " selected" : ""}>${escapeHtml(o.text)}</option>`
                    )
                    .join("")}
                </select>
              </label>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function orderMarkup(q, a, iv) {
    const slots = iv.kind === "select" ? iv.pick : iv.slots;
    const labels =
      iv.slotLabels ||
      (iv.kind === "select"
        ? Array.from({ length: slots }, (_, i) => `Selection ${i + 1}`)
        : Array.from({ length: slots }, (_, i) => `Step ${i + 1}`));
    return `
      <div class="pq-interactive">
        <p class="pq-order-hint">${escapeHtml(iv.poolLabel || "Choose from the list for each step.")}</p>
        ${labels
          .map((label, i) => {
            const val = a.selected[i] || "";
            const cls =
              a.checked && val
                ? iv.kind === "order"
                  ? q.answer[i] === val
                    ? " correct"
                    : " wrong"
                  : (q.answer || "").includes(val)
                    ? " correct"
                    : " wrong"
                : "";
            return `
              <label class="pq-order-row${cls}">
                <span class="pq-order-label">${escapeHtml(label)}</span>
                <select class="pq-order-select" data-quiz-slot="${i}"${a.checked ? " disabled" : ""}>
                  <option value="">— Select —</option>
                  ${iv.options
                    .map(
                      (o) =>
                        `<option value="${escapeAttr(o.key)}"${val === o.key ? " selected" : ""}>${escapeHtml(o.text)}</option>`
                    )
                    .join("")}
                </select>
              </label>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function choiceMarkup(q, a, multi) {
    return `
      <div class="quiz-options">
        ${q.options
          .map((opt) => {
            const sel = a.selected.includes(opt.key);
            const isAns = q.answer.includes(opt.key);
            const cls = a.checked ? (isAns ? " correct" : sel ? " wrong" : "") : sel ? " selected" : "";
            return `
              <button class="quiz-option${cls}" data-quiz-choice="${escapeAttr(opt.key)}" type="button"${a.checked ? " disabled" : ` aria-pressed="${sel}"`}>
                <span class="choice-key">${escapeHtml(opt.key)}</span>
                <span class="choice-text">${escapeHtml(opt.text)}</span>
                ${a.checked && (isAns || sel) ? `<span class="sr-only">${isAns ? " (correct answer)" : " (your answer, incorrect)"}</span>` : ""}
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function visualMarkup(q, a, answerImgs, isExam) {
    if (!a.revealed && !isExam) {
      return `
        <div class="pq-visual-prompt">
          <p>Work out your answer from the exhibit${q.qtype === "dragdrop" ? " (arrange the items mentally or on paper)" : ""}, then reveal the answer sheet and grade yourself.</p>
          <button class="button primary" data-action="quiz-reveal" type="button">Reveal answer</button>
        </div>
      `;
    }
    if (!a.revealed && isExam) {
      return `<div class="pq-visual-prompt"><p>Review the exhibit, note your answer, then continue. The answer sheet unlocks at the end of the exam.</p></div>`;
    }
    return `
      <div class="pq-answer-sheet">
        <div class="pq-answer-label">Answer sheet</div>
        ${answerImgs.length
          ? answerImgs.map((im) => `<img class="pq-img answer" src="quiz_images/${escapeAttr(im.file)}" alt="Answer" loading="lazy" />`).join("")
          : `<p><strong>Answer:</strong> ${escapeHtml(q.answer || "see explanation")}</p>`}
        ${a.checked || isExam
          ? ""
          : `
          <div class="pq-selfgrade">
            <span>Did you get it right?</span>
            <button class="button" data-action="quiz-selfgrade" data-grade="1" type="button">${icon("check")} I was right</button>
            <button class="button" data-action="quiz-selfgrade" data-grade="0" type="button">${icon("x")} I was wrong</button>
          </div>`}
      </div>
    `;
  }

  /** Case-study background (private verified bank only): text plus exhibits, collapsed after the first read. */
  function contextMarkup(q) {
    const c = q.context;
    if (!c || !c.text) return "";
    const paras = String(c.text).split(/\n+/).filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const imgs = (c.images || []).map((src) => `<img class="pq-img" src="${escapeAttr(src)}" alt="Case study exhibit" loading="lazy" />`).join("");
    return `<details class="pq-context" open><summary>Case study: ${escapeHtml(c.title || "background")}</summary>${paras}${imgs}</details>`;
  }

  /** Learn-backed proof for each claim: documented FACT vs REASONING vs LIMITATION, with page, section, quote, URL and access date. */
  function proofMarkup(q) {
    const pr = q.proof;
    if (!pr || !pr.claims || !pr.claims.length) return "";
    const KIND = { fact: "Documented fact", reasoning: "Reasoning", limitation: "Limitation" };
    const SCOPE = (sc) => (sc === "summary" ? "Overall" : sc.startsWith("opt:") ? `Option ${sc.slice(4)}` : sc.startsWith("field:") ? `Item ${Number(sc.slice(6)) + 1}` : sc.startsWith("item:") ? `Step ${sc.slice(5)}` : sc);
    let last = "";
    const rows = pr.claims
      .map((c) => {
        const head = c.scope !== last ? `<h4 class="pq-proof-scope">${escapeHtml(SCOPE(c.scope))}</h4>` : "";
        last = c.scope;
        const ev = (c.evidence || [])
          .map(
            (e) => `<li><a href="${escapeUrl(e.url)}" target="_blank" rel="noreferrer">${escapeHtml(e.title || shortUrl(e.url))}</a>${e.heading ? ` › ${escapeHtml(e.heading)}` : ""}<blockquote>${escapeHtml(e.quote || "")}</blockquote><span class="pq-proof-applies">${escapeHtml(e.applies || "")}</span> <span class="pq-proof-date">Accessed ${escapeHtml(String(e.accessed || pr.accessed || "").slice(0, 10))}</span></li>`
          )
          .join("");
        return `${head}<div class="pq-claim ${escapeAttr(c.kind)}"><span class="tag">${escapeHtml(KIND[c.kind] || c.kind)}</span> ${escapeHtml(c.text)}${ev ? `<ul class="pq-proof-ev">${ev}</ul>` : ""}</div>`;
      })
      .join("");
    return `<details class="pq-proof"><summary>Proof from AWS documentation</summary>${rows}</details>`;
  }

  function feedbackMarkup(q, a) {
    const ok = !!a.correct;
    return `
      <div class="quiz-feedback ${ok ? "correct" : "wrong"}">
        <strong>
          <span class="quiz-feedback-status">${ok ? "Correct" : "Not quite"}</span>
          <span class="quiz-feedback-answer"> — answer: ${escapeHtml(answerLabel(q))}</span>
        </strong>
        ${q.explanation ? `<p>${escapeHtml(q.explanation)}</p>` : `<p>This question doesn't have a written explanation yet.${q.reference ? " See the AWS documentation reference below." : ""}</p>`}
        ${q.imported && q.auditNote ? `<p class="pq-audit-note"><strong>Audit note:</strong> ${escapeHtml(q.auditNote)}</p>` : ""}
        ${proofMarkup(q)}
        ${q.reference ? `<p class="pq-ref"><a href="${escapeUrl(q.reference)}" target="_blank" rel="noreferrer">Reference: ${escapeHtml(shortUrl(q.reference))}${icon("external-link", "icon-inline")}<span class="sr-only"> (opens in a new tab)</span></a></p>` : ""}
      </div>
    `;
  }

  function renderResults(container) {
    clearTimer();
    const s = state.session;
    const isExam = s.mode === "exam";

    if (isExam) {
      s.ids.forEach((id) => {
        const q = byId(id);
        const a = answerState(id);
        if (!q || a.checked) return;
        if (a.selected.length) {
          a.checked = true;
          a.correct = grade(q, a.selected);
          recordResult(id, a.correct);
        }
      });
    }

    const score = sessionScore();
    const pct = score.checked ? Math.round((score.correct / score.checked) * 100) : 0;
    const missed = s.ids.filter((id) => s.answers[id] && s.answers[id].checked && !s.answers[id].correct);

    container.innerHTML = `
      <section class="dashboard-hero pq-hero">
        <h2>${pct >= 70 ? "Nice work!" : "Keep drilling"}</h2>
        <p>${isExam ? "Exam session complete." : "Training session complete."} You answered ${score.checked} of ${s.ids.length} questions.</p>
        <div class="exam-meta">
          <div><div class="label">Score</div><div class="value">${pct}%</div></div>
          <div><div class="label">Correct</div><div class="value">${score.correct}</div></div>
          <div><div class="label">Missed</div><div class="value">${score.checked - score.correct}</div></div>
        </div>
      </section>
      ${isExam ? renderExamReview(s) : ""}
      ${missed.length
        ? `
        <section class="card">
          <h3>Review missed questions</h3>
          <div class="pq-missed">
            ${missed
              .map((id) => {
                const q = byId(id);
                return `<button class="pq-missed-item" data-action="quiz-review" data-qid="${escapeAttr(id)}" type="button">
                  <span class="tag">${TYPE_LABELS[q.qtype]}</span>
                  <span>${escapeHtml(q.question.slice(0, 140))}…</span>
                </button>`;
              })
              .join("")}
          </div>
          <div class="inline-actions" style="margin-top:14px">
            <button class="button primary" data-action="quiz-retry-missed" type="button">Retry missed (${missed.length})</button>
            <button class="button" data-action="quiz-new" type="button">New quiz</button>
          </div>
        </section>`
        : `
        <section class="card">
          <h3>Flawless run</h3>
          <p>No missed questions in this session.</p>
          <div class="inline-actions" style="margin-top:14px">
            <button class="button primary" data-action="quiz-new" type="button">New quiz</button>
          </div>
        </section>`}
    `;
  }

  function renderExamReview(session) {
    const items = session.ids
      .map((id) => {
        const q = byId(id);
        const a = session.answers[id];
        if (!q || !a || !a.checked) return "";
        return `
          <article class="pq-review-item">
            <div class="pq-meta">
              <span class="tag">${TYPE_LABELS[q.qtype]}</span>
              <span class="tag ${a.correct ? "accent" : ""}">${a.correct ? "Correct" : "Incorrect"}</span>
            </div>
            <p class="pq-question">${escapeHtml(q.question.slice(0, 220))}${q.question.length > 220 ? "…" : ""}</p>
            ${feedbackMarkup(q, a)}
          </article>
        `;
      })
      .filter(Boolean)
      .join("");
    if (!items) return "";
    return `
      <section class="card pq-exam-review">
        <h3>Exam review</h3>
        <p>Full feedback for every answered question.</p>
        <div class="pq-review-list">${items}</div>
      </section>
    `;
  }

  function saveAnswerSilently(q) {
    const a = answerState(q.id);
    if (a.checked) return;
    if (!interactiveComplete(q, a.selected) && !a.selected.length) return;
    a.checked = true;
    a.correct = grade(q, a.selected);
    recordResult(q.id, a.correct);
  }

  function onClick(target) {
    const actionEl = target.matches("[data-action]") ? target : target.closest("[data-action]");
    const action = actionEl?.getAttribute("data-action") || target.getAttribute("data-action") || "";

    if (target.matches("[data-quiz-choice]")) {
      const q = currentQuestion();
      const a = answerState(q.id);
      if (a.checked) return true;
      const key = target.getAttribute("data-quiz-choice");
      const multi = q.qtype === "multi";
      if (!multi) a.selected = [key];
      else if (a.selected.includes(key)) a.selected = a.selected.filter((k) => k !== key);
      else a.selected.push(key);
      persist();
      return "rerender";
    }

    if (target.matches("[data-quiz-yn-slot]") || target.closest("[data-quiz-yn-slot]")) {
      const btn = target.matches("[data-quiz-yn-slot]") ? target : target.closest("[data-quiz-yn-slot]");
      const q = currentQuestion();
      const a = answerState(q.id);
      if (!q || !a || a.checked) return true;
      ensureInteractiveSelection(q, a);
      const idx = Number(btn.getAttribute("data-quiz-yn-slot"));
      const key = btn.getAttribute("data-quiz-yn-value");
      if (!Number.isFinite(idx) || !key) return true;
      a.selected[idx] = key;
      persist();
      return "rerender";
    }

    switch (action) {
      case "quiz-set-mode": {
        state.mode = actionEl.getAttribute("data-mode") || "training";
        if (state.mode === "exam") {
          state.size = EXAM_SIZE;
          state.order = "random";
        }
        persist();
        return "rerender";
      }
      case "quiz-toggle-topic": {
        const topic = actionEl.getAttribute("data-topic");
        if (!topic) return true;
        if (state.topics.includes(topic)) state.topics = state.topics.filter((id) => id !== topic);
        else state.topics = [...state.topics, topic];
        persist();
        return "rerender";
      }
      case "quiz-topics-all":
        state.topics = DOMAINS.map((d) => d.id);
        persist();
        return "rerender";
      case "quiz-topics-clear":
        state.topics = [];
        persist();
        return "rerender";
      case "quiz-set-order":
        if (state.mode === "exam") return true;
        state.order = actionEl.getAttribute("data-order") || "random";
        persist();
        return "rerender";
      case "quiz-set-size": {
        if (state.mode === "exam") return true;
        state.size = Number(actionEl.getAttribute("data-size"));
        persist();
        return "rerender";
      }
      case "quiz-start": {
        readCustomSize();
        const ids = buildSessionIds();
        if (!ids.length) return true;
        startSession(ids);
        return "rerender";
      }
      case "quiz-reset-stats":
        if (confirm("Reset all practice quiz progress and lifetime stats?")) {
          state.record = {};
          state.session = null;
          state.screen = "setup";
          persist();
          return "rerender";
        }
        return true;
      case "quiz-resume":
        state.screen = "session";
        persist();
        return "rerender";
      case "quiz-check": {
        const q = currentQuestion();
        const a = answerState(q.id);
        if (a.checked) return true;
        if (!canCheckAnswer(q, a)) return true;
        a.checked = true;
        a.correct = grade(q, a.selected);
        recordResult(q.id, a.correct);
        persist();
        return "rerender";
      }
      case "quiz-reveal": {
        answerState(currentQuestion().id).revealed = true;
        persist();
        return "rerender";
      }
      case "quiz-selfgrade": {
        const q = currentQuestion();
        const a = answerState(q.id);
        a.checked = true;
        a.correct = actionEl.getAttribute("data-grade") === "1";
        recordResult(q.id, a.correct);
        persist();
        return "rerender";
      }
      case "quiz-prev":
        state.session.index = Math.max(0, state.session.index - 1);
        persist();
        return "rerender";
      case "quiz-next": {
        const q = currentQuestion();
        if (state.session.mode === "exam" && q && !answerState(q.id).checked) {
          saveAnswerSilently(q);
        }
        if (state.session.index >= state.session.ids.length - 1) state.screen = "results";
        else state.session.index += 1;
        persist();
        return "rerender";
      }
      case "quiz-quit":
        state.screen = "results";
        persist();
        return "rerender";
      case "quiz-new":
        state.session = null;
        state.screen = "setup";
        persist();
        return "rerender";
      case "quiz-retry-missed": {
        const missed = state.session.ids.filter((id) => state.session.answers[id] && !state.session.answers[id].correct);
        state.mode = "training";
        startSession(shuffle(missed));
        return "rerender";
      }
      case "quiz-review": {
        const qid = actionEl.getAttribute("data-qid");
        const idx = state.session.ids.indexOf(qid);
        if (idx >= 0) {
          state.session.index = idx;
          state.screen = "session";
          state.session.mode = "training";
          persist();
          return "rerender";
        }
        return true;
      }
    }
    return false;
  }

  function readCustomSize() {
    if (state.mode === "exam") {
      state.size = EXAM_SIZE;
      return;
    }
    const el = document.getElementById("pqSizeCustom");
    if (!el) return;
    const max = poolSize();
    const value = Number(el.value);
    if (Number.isFinite(value) && value > 0) state.size = Math.min(value, max);
  }

  function onChange(event) {
    const q = currentQuestion();
    if (q && hasInteractive(q) && event.target.matches("select[data-quiz-slot]")) {
      const a = answerState(q.id);
      if (a.checked) return true;
      ensureInteractiveSelection(q, a);
      const idx = Number(event.target.getAttribute("data-quiz-slot"));
      if (!Number.isFinite(idx) || idx < 0 || idx >= a.selected.length) return true;
      a.selected[idx] = event.target.value || "";
      persist();
      // Avoid full re-render (it fights native <select> UX). Just toggle Check.
      const btn = document.querySelector('[data-action="quiz-check"]');
      if (btn) btn.disabled = !canCheckAnswer(q, a);
      return true;
    }
    if (event.target.id === "pqSizeCustom") {
      readCustomSize();
      persist();
      return true;
    }
    return false;
  }

  function valueOf(id, fallback) {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
  }

  function shortUrl(url) {
    return url.replace(/^https?:\/\//, "").slice(0, 70);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  // Only http(s) and relative URLs may reach href or src (see app.js).
  function safeUrl(value) {
    const url = String(value ?? "").trim();
    if (/^https?:\/\//i.test(url) || !/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
    return "#";
  }

  function escapeUrl(value) {
    return escapeAttr(safeUrl(value));
  }

  window.SAPC02QuizUI = {
    render,
    onClick,
    onChange,
    lifetime,
    setDomainFilter(filter) {
      state.topics = filter && filter !== "all" ? [filter] : [];
      state.screen = "setup";
      persist();
    },
    openQuestion(qid) {
      const q = byId(qid);
      if (!q) return false;
      state.mode = "training";
      startSession([qid]);
      return true;
    },
    resetProgress() {
      state.record = {};
      state.session = null;
      state.screen = "setup";
      persist();
    },
    questionCount: () => bank().length,
    // Backup support: a copy of the quiz state, and a validated replacement.
    getSnapshot: () => JSON.parse(JSON.stringify(state)),
    applySnapshot(raw) {
      state = learnerStore.normalize(window.SAPC02Storage.cleanJson(raw));
      persist();
    },
  };
})();
