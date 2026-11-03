(function () {
  "use strict";

  // The app lives in lms/ but we present a clean URL (drop the "lms/" segment
  // from the address bar). To keep relative assets working after the rewrite —
  // dynamically inserted quiz_images/ and assets/ images resolve against the
  // document base — we first pin a <base> to this file's real directory, then
  // replace the visible URL. Path-relative, so it also works under a GitHub
  // Pages project subpath (…/<repo>/lms/ → …/<repo>/).
  (function prettifyUrl() {
    try {
      const dir = location.pathname.replace(/[^/]*$/, ""); // e.g. "/lms/"
      if (!document.querySelector("base")) {
        const base = document.createElement("base");
        base.href = dir; // absolute path → stays pinned even after the rewrite
        document.head.insertBefore(base, document.head.firstChild);
      }
      const pretty = dir.replace(/lms\/$/, "") || "/"; // "/lms/" → "/"
      if (pretty !== location.pathname) {
        history.replaceState(null, "", pretty + location.search + location.hash);
      }
    } catch (e) {
      /* non-fatal: worst case the URL keeps the lms/ path */
    }
  })();

  const data = window.SAPC02_LMS_DATA;
  const storageKey = window.SAPC02Storage.LEARNER_KEYS.lms.current;
  const learnerStore = window.SAPC02Storage.createStore({
    storage: window.SAPC02Storage.browserStorage(),
    key: storageKey,
    legacyKey: window.SAPC02Storage.LEARNER_KEYS.lms.legacy,
    normalize: normalizeLmsState,
  });
  let saveWarningShown = false;

  if (!data) {
    document.getElementById("app").innerHTML = '<div class="empty-state">The course didn\'t load. Reload the page to try again.</div>';
    return;
  }

  const state = loadState();
  const elements = {
    app: document.getElementById("app"),
    title: document.getElementById("viewTitle"),
    moduleNav: document.getElementById("moduleNav"),
    search: document.getElementById("globalSearch"),
    shell: document.querySelector(".app-shell"),
    navToggle: document.querySelector(".nav-toggle"),
  };

  const modulesById = new Map(data.modules.map((module) => [module.id, module]));

  // Interface icons come from icons.js (bundled Lucide subset); they are decorative.
  const icon = (name, className) => (window.SAPC02Icons ? window.SAPC02Icons.icon(name, className) : "");
  // Appended to links that open a new tab: a visible icon plus the same warning for screen readers.
  const NEW_TAB = `${icon("external-link", "icon-inline")}<span class="sr-only"> (opens in a new tab)</span>`;

  // ── GitHub lab integration data ───────────────────────────
  // labs.js is auto-generated repo metadata (authoritative for lab facts).
  // lab-guides.js is Study-Buddy authored pedagogy (badged in the UI).
  const labsData = window.SAPC02_LABS_DATA || { labs: [], demos: [], sync: {} };
  const labGuides = window.SAPC02_LAB_GUIDES || {};
  const labsById = new Map((labsData.labs || []).map((lab) => [lab.id, lab]));
  const labsByModule = new Map();
  (labsData.labs || []).forEach((lab) => {
    if (!lab.moduleId) return;
    if (!labsByModule.has(lab.moduleId)) labsByModule.set(lab.moduleId, []);
    labsByModule.get(lab.moduleId).push(lab);
  });
  const demosByModule = new Map();
  (labsData.demos || []).forEach((demo) => {
    if (!demo.moduleId) return;
    if (!demosByModule.has(demo.moduleId)) demosByModule.set(demo.moduleId, []);
    demosByModule.get(demo.moduleId).push(demo);
  });

  // The single lab most relevant to a given lesson (drives topic→lab recs).
  function labsForLesson(moduleId, lessonId) {
    return (labsByModule.get(moduleId) || []).filter((lab) => lab.lessonId === lessonId);
  }

  // Human labels for the activity surfaces detected in each lab. Declared here
  // (before the initial render) so it is initialized when the objective-focus
  // view — which renders at startup and reads it — needs it.
  const TOOL_LABELS = {
    portal: "AWS Management Console",
    cli: "AWS CLI",
    powershell: "PowerShell",
    arm: "ARM template",
    bicep: "Bicep",
  };

  const MODULE_SECTIONS = [
    { id: "topics", label: "Topics", icon: "book-open", phase: "learn", hint: "Study the material" },
    { id: "scenarios", label: "Scenarios", icon: "route", phase: "learn", hint: "Apply the objectives" },
    { id: "labs", label: "Labs", icon: "flask-conical", phase: "labs", hint: "Hands-on tasks" },
    { id: "flashcards", label: "Flashcards", icon: "layers", phase: "flashcards", hint: "Key points" },
    { id: "quiz", label: "Practice", icon: "clipboard-check", phase: "practice", hint: "Chapter quiz" },
    { id: "summary", label: "Summary", icon: "file-text", phase: "review", hint: "Review & gaps" },
  ];

  const PHASE_DEFAULT_SECTION = {
    learn: "topics",
    labs: "labs",
    flashcards: "flashcards",
    practice: "quiz",
    review: "summary",
  };

  hydrateIcons(document);
  setupThemeSwitch();
  applySidebarState();
  render();
  enhanceCodeBlocks();

  // ── Mobile navigation drawer ──────────────────────────────
  // Below the drawer breakpoint the sidebar slides in over the content; the
  // .nav-open class on the shell drives both the slide and the scrim. On wider
  // screens the class is inert (the sidebar is a permanent rail), so these
  // helpers are safe to call regardless of viewport.
  function isNavOpen() {
    return !!elements.shell && elements.shell.classList.contains("nav-open");
  }

  function setNav(open) {
    if (!elements.shell) return;
    const wasOpen = isNavOpen();
    elements.shell.classList.toggle("nav-open", open);
    if (open && !wasOpen) {
      // Move focus into the drawer so keyboard and screen-reader users land in it.
      requestAnimationFrame(() => document.querySelector(".sidebar-close")?.focus());
    } else if (!open && wasOpen) {
      elements.navToggle?.focus();
    }
    if (elements.navToggle) {
      elements.navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      elements.navToggle.setAttribute(
        "aria-label",
        open ? "Close navigation menu" : "Open navigation menu"
      );
    }
  }

  // Static markup in index.html marks icon slots with data-icon="name".
  function hydrateIcons(root) {
    root.querySelectorAll("[data-icon]").forEach((slot) => {
      slot.innerHTML = icon(slot.getAttribute("data-icon"));
    });
  }

  // Light / Dark / System radio group. theme-init.js owns the preference.
  function setupThemeSwitch() {
    const theme = window.SAPC02Theme;
    const inputs = document.querySelectorAll('.theme-switch input[name="theme"]');
    if (!theme || !inputs.length) return;
    const sync = () => inputs.forEach((input) => (input.checked = input.value === theme.preference));
    inputs.forEach((input) => input.addEventListener("change", () => input.checked && theme.set(input.value)));
    theme.onChange(sync);
    sync();
  }

  // Desktop only: the collapsed rail. The stylesheet ignores this class below
  // the drawer breakpoint, so it is safe to apply at any width.
  function applySidebarState() {
    if (!elements.shell) return;
    const collapsed = Boolean(state.sidebarCollapsed);
    elements.shell.classList.toggle("sidebar-collapsed", collapsed);
    const toggle = document.querySelector(".sidebar-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      toggle.setAttribute("title", collapsed ? "Expand sidebar" : "Collapse sidebar");
      const glyph = toggle.querySelector("[data-icon]");
      if (glyph) {
        glyph.setAttribute("data-icon", collapsed ? "panel-left-open" : "panel-left-close");
        glyph.innerHTML = icon(glyph.getAttribute("data-icon"));
      }
    }
  }

  document.addEventListener("click", onClick);
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".code-copy");
    if (!button) return;
    const pre = button.parentElement.querySelector("pre");
    const status = document.getElementById("copyStatus");
    copyText(pre.textContent).then(
      () => {
        button.textContent = "Copied";
        if (status) status.textContent = "Code copied to clipboard.";
      },
      () => {
        button.textContent = "Copy failed";
        if (status) status.textContent = "Copy failed. Select the text and copy it manually.";
      }
    );
    setTimeout(() => (button.textContent = "Copy"), 2000);
  });
  // Content is re-rendered often; enhance new code blocks whenever it changes.
  new MutationObserver(enhanceCodeBlocks).observe(elements.app, { childList: true, subtree: true });
  document.addEventListener("input", onInput);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isNavOpen()) setNav(false);
  });
  document.addEventListener("change", onChange);
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[role='button']")) {
      event.preventDefault();
      event.target.click();
    }
    if (event.key === "Escape" && isNavOpen()) {
      setNav(false);
      return;
    }
    if (shouldIgnoreTopicHotkeys(event)) return;
    if (state.view === "module" && state.moduleSection === "topics" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      // Resolve the active lesson (default first lesson when lessonId is null)
      // so arrow keys advance topics even before a lesson is explicitly picked.
      const module = modulesById.get(state.moduleId);
      const lesson = module ? resolveLesson(module) : null;
      const content = lesson ? lessonContent(state.moduleId, lesson.id) : null;
      const maxTopic = Math.max(0, (lesson ? topicStepCount(state.moduleId, lesson.id, content) : 1) - 1);
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = Math.min(maxTopic, Math.max(0, (state.topic || 0) + delta));
      if (next !== state.topic) {
        event.preventDefault();
        state.topic = next;
        persist();
        render();
        revealTopicViewer();
      }
    }
  });

  // Fills every field with a safe default, so the same function serves
  // normal loads, legacy migration, backup imports and empty state.
  function normalizeLmsState(saved) {
    return {
      view: saved.view === "resources" ? "dashboard" : saved.view || "dashboard",
      moduleId: saved.moduleId || "orientation",
      lessonId: saved.lessonId || null,
      objectiveIndex: Number.isInteger(saved.objectiveIndex) ? saved.objectiveIndex : null,
      topic: saved.topic || 0,
      moduleSection: saved.moduleSection || "topics",
      flashcardIndex: Number.isInteger(saved.flashcardIndex) ? saved.flashcardIndex : 0,
      flashcardFlipped: Boolean(saved.flashcardFlipped),
      labIndex: Number.isInteger(saved.labIndex) ? saved.labIndex : 0,
      labId: saved.labId || null,
      labProgress: saved.labProgress || {},
      labChecks: saved.labChecks || {},
      completed: saved.completed || {},
      bookmarks: saved.bookmarks || {},
      sidebarCollapsed: Boolean(saved.sidebarCollapsed),
    };
  }

  function loadState() {
    return learnerStore.load().state;
  }

  function persist() {
    const result = learnerStore.save(state);
    if (!result.ok && !saveWarningShown) {
      saveWarningShown = true;
      alert("Your progress could not be saved in this browser. Export a backup from the sidebar before closing this page.");
    }
  }

  // Re-rendering replaces the flashcard controls, so put focus back on the
  // equivalent control (or the card itself when that control is now disabled).
  function refocusFlashcard(action) {
    const same = action === "flip-flashcard" ? null : elements.app.querySelector(`[data-action="${action}"]:not([disabled])`);
    (same || elements.app.querySelector(".flashcard"))?.focus();
  }

  // Adds a Copy button beside each code block. The block's text is read, never
  // changed, so commands are copied exactly as written.
  function enhanceCodeBlocks() {
    elements.app.querySelectorAll("pre:not([data-copy-ready])").forEach((pre) => {
      pre.setAttribute("data-copy-ready", "");
      // Long lines scroll sideways, so keyboard users must be able to focus the block.
      if (!pre.hasAttribute("tabindex")) pre.setAttribute("tabindex", "0");
      const wrap = document.createElement("div");
      wrap.className = "code-block";
      pre.replaceWith(wrap);
      wrap.append(pre);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");
      wrap.append(button);
    });
    // Lab instructions come from Markdown and can hold wide tables. Give each one
    // its own scroll area so the page never scrolls sideways on narrow screens.
    elements.app.querySelectorAll(".lab-instructions table:not([data-scroll-ready])").forEach((table) => {
      table.setAttribute("data-scroll-ready", "");
      const wrap = document.createElement("div");
      wrap.className = "table-scroll";
      wrap.setAttribute("tabindex", "0");
      wrap.setAttribute("role", "region");
      wrap.setAttribute("aria-label", "Table, scrolls sideways");
      table.replaceWith(wrap);
      wrap.append(table);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function quizSnapshot() {
    return window.SAPC02QuizUI?.getSnapshot ? window.SAPC02QuizUI.getSnapshot() : {};
  }

  function currentProgressDocument() {
    return window.SAPC02Storage.buildExport({ lms: state, quiz: quizSnapshot() });
  }

  function downloadProgressBackup() {
    const doc = currentProgressDocument();
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sapc02-progress-${doc.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function describeProgress(summary) {
    return `${summary.completedLessons} completed lessons, ${summary.bookmarks} bookmarks, ${summary.labsStarted} lab records, ${summary.quizRecords} quiz records`;
  }

  // Deletes learner progress only, after explaining it and offering a backup.
  function resetProgress() {
    const summary = window.SAPC02Storage.summarizeSections({ lms: state, quiz: quizSnapshot() });
    const proceed = confirm(
      "Reset all saved progress in this browser?\n\n" +
        `This deletes: ${describeProgress(summary)}.\n\n` +
        "Questions, lessons and labs are not affected.\n\nPress OK to continue, or Cancel to keep your progress."
    );
    if (!proceed) return;

    const wantsBackup = confirm(
      "Download a backup file before resetting?\n\nOK downloads a backup first. Cancel resets without one."
    );
    if (wantsBackup) downloadProgressBackup();

    window.SAPC02Storage.clearLearnerData(window.SAPC02Storage.browserStorage());
    // Leave time for the backup download to start before the page reloads.
    setTimeout(() => location.reload(), wantsBackup ? 1000 : 0);
  }

  function chooseProgressFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (file) importProgressFile(file);
    });
    input.click();
  }

  // Validates a backup, shows what it will replace, and keeps a recovery copy
  // of current progress before applying it. Current progress is never changed
  // when validation fails.
  function importProgressFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      alert("This file is too large to be a progress backup. Your progress was not changed.");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      let sections;
      try {
        sections = window.SAPC02Storage.parseImport(String(reader.result));
      } catch (error) {
        alert(`Import failed: ${error.message} Your progress was not changed.`);
        return;
      }
      const incoming = window.SAPC02Storage.summarizeSections(sections);
      const current = window.SAPC02Storage.summarizeSections({ lms: state, quiz: quizSnapshot() });
      const proceed = confirm(
        "Replace your current progress with this backup?\n\n" +
          `Backup contains: ${describeProgress(incoming)}.\n` +
          `Current progress: ${describeProgress(current)}.\n\n` +
          "Your current progress will be kept as a recovery copy first."
      );
      if (!proceed) return;

      window.SAPC02Storage.savePreImportCopy(window.SAPC02Storage.browserStorage(), currentProgressDocument());
      learnerStore.save(learnerStore.normalize(sections.lms || {}));
      if (window.SAPC02QuizUI?.applySnapshot) window.SAPC02QuizUI.applySnapshot(sections.quiz || {});
      location.reload();
    });
    reader.readAsText(file);
  }

  function render() {
    renderNav();
    updateTabs();
    const query = elements.search.value.trim();
    if (query) {
      state.view = "search";
      renderSearch(query);
      return;
    }

    if (state.view === "practice") {
      renderPractice();
    } else if (state.view === "module") {
      renderModule(state.moduleId);
    } else {
      renderDashboard();
    }
  }

  function renderNav() {
    const chapters = curriculumModules();
    const activeChapterId = activeChapter(chapters).id;
    elements.moduleNav.innerHTML = `
      <div class="nav-section">Overview</div>
      <button class="overview-link${state.view === "dashboard" ? " active" : ""}" data-view="dashboard" title="Dashboard" type="button"${state.view === "dashboard" ? ' aria-current="page"' : ""}>
        <span class="nav-icon">${icon("layout-dashboard")}</span>
        <span>Dashboard</span>
      </button>
      <button class="overview-link" data-action="show-domains" title="Exam Domains" type="button">
        <span class="nav-icon">${icon("graduation-cap")}</span>
        <span>Exam Domains</span>
      </button>

      <div class="nav-section curriculum-heading">SAP-C02 Skills Measured</div>
      <div class="nav-section">Chapters</div>
      ${chapters.map((module, index) => chapterNav(module, index, module.id === activeChapterId)).join("")}

      <div class="nav-section">Review</div>
      <button class="review-link" data-module="review" title="Final Review" type="button">
        <span class="nav-icon">${icon("list-checks")}</span>
        <span>Final Review</span>
      </button>
      <button class="review-link${state.view === "practice" ? " active" : ""}" data-view="practice" title="Practice Quiz" type="button"${state.view === "practice" ? ' aria-current="page"' : ""}>
        <span class="nav-icon">${icon("clipboard-check")}</span>
        <span>Practice Quiz</span>
      </button>
    `;
  }

  function curriculumModules() {
    return data.modules.filter((module) => !["orientation", "review"].includes(module.id));
  }

  function activeChapter(chapters) {
    if (state.view === "module" && chapters.some((module) => module.id === state.moduleId)) {
      return modulesById.get(state.moduleId);
    }
    return chapters[0];
  }

  function chapterNav(module, index, open) {
    const progress = moduleProgress(module);
    return `
      <div class="nav-ch-group${open ? " open" : ""}">
        <button class="module-button${open ? " active" : ""}" data-module="${escapeAttr(module.id)}" style="--accent:${escapeAttr(module.accent)}" title="${escapeAttr(module.title)}" type="button" aria-expanded="${open ? "true" : "false"}">
          <span class="module-dot" aria-hidden="true">${index + 1}</span>
          <span class="module-label">
            <span class="module-name">${escapeHtml(module.title)}</span>
          </span>
          <span class="module-count">${progress.percent}%</span>
          <span class="nav-ch-arrow">${icon(open ? "chevron-down" : "chevron-right")}</span>
        </button>
        ${open ? chapterSectionNav(module) : ""}
      </div>
    `;
  }

  function chapterSectionNav(module) {
    const isActiveModule = state.view === "module" && state.moduleId === module.id;
    const section = isActiveModule ? state.moduleSection || "topics" : "";
    return `
      <div class="nav-ch-sub">
        ${MODULE_SECTIONS.map(
          (item) => `
            <button class="nav-section-link${section === item.id ? " active" : ""}" data-module="${escapeAttr(module.id)}" data-module-section="${escapeAttr(item.id)}" title="${escapeAttr(item.label)}" type="button"${section === item.id ? ' aria-current="page"' : ""}>
              <span class="nav-section-emoji">${icon(item.icon)}</span>
              <span>${escapeHtml(item.label)}</span>
            </button>
          `
        ).join("")}
      </div>
    `;
  }

  function updateTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      const view = button.getAttribute("data-view");
      const active = state.view === view || (view === "dashboard" && state.view === "search");
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function renderDashboard() {
    elements.title.textContent = "Course Dashboard";
    const totals = courseProgress();
    const next = nextLesson();
    const bookmarked = bookmarkList();
    elements.app.innerHTML = `
      <section class="dashboard-hero">
        <h2>${escapeHtml(data.title)}</h2>
        <p>${escapeHtml(data.summary.executive[0] || "AWS architecture course")}</p>
        <div class="exam-meta">
          <div><div class="label">Complete</div><div class="value">${totals.percent}%</div></div>
          <div><div class="label">Modules</div><div class="value">${data.modules.length}</div></div>
          <div><div class="label">Lessons</div><div class="value">${totals.total}</div></div>
          <div><div class="label">Questions</div><div class="value">${quizQuestionCount()}</div></div>
        </div>
      </section>

      ${
        next
          ? `<div class="dashboard-resume-card" data-open-lesson="${escapeAttr(next.module.id)}:${escapeAttr(next.lesson.id)}">
              <div class="resume-card-icon">${icon("target")}</div>
              <div class="resume-card-body">
                <div class="resume-card-greeting">Pick up where you left off</div>
                <div class="resume-card-title">${escapeHtml(next.lesson.title)}</div>
                <div class="resume-card-sub">${escapeHtml(next.module.title)}</div>
              </div>
              <button class="resume-card-btn" data-open-lesson="${escapeAttr(next.module.id)}:${escapeAttr(next.lesson.id)}" type="button">Continue learning ${icon("arrow-right")}</button>
            </div>`
          : ""
      }

      <div class="dashboard-section-header">Your Progress</div>
      <div class="stats-row">
        ${statTile("chart-no-axes-column", totals.percent + "%", "Course complete")}
        ${statTile("library", String(data.modules.length), "Modules")}
        ${statTile("book-open", totals.done + "/" + totals.total, "Lessons complete")}
        ${statTile("circle-help", String(quizQuestionCount()), "Practice questions")}
      </div>

      <div class="dashboard-section-header">Course Modules</div>
      <div class="chapters-grid">
        ${data.modules.map(moduleCard).join("")}
      </div>

      <div class="two-col" style="margin-top:22px">
        <section class="card">
          <h3>Exam Domains</h3>
          <div class="domain-bars">${data.examDomains.map(domainBar).join("")}</div>
        </section>
        <section class="card">
          <h3>Bookmarks</h3>
          ${bookmarked.length ? `<div class="pill-row">${bookmarked.map(bookmarkPill).join("")}</div>` : `<p>No saved lessons yet.</p>`}
        </section>
      </div>
    `;
  }

  function renderModule(moduleId) {
    const module = modulesById.get(moduleId) || data.modules[0];
    const chapters = curriculumModules();
    const chapterIndex = Math.max(0, chapters.findIndex((item) => item.id === module.id)) + 1;
    const section = state.moduleSection || "topics";
    const phase = MODULE_SECTIONS.find((item) => item.id === section)?.phase || "learn";
    const activeLesson = state.lessonId ? resolveLesson(module) : module.lessons[0] || resolveLesson(module);
    const focusedObjective = objectiveFocus(activeLesson);
    const lessonSelected = Boolean(state.lessonId);
    elements.title.textContent = focusedObjective?.objective || (lessonSelected ? activeLesson.title : module.title);
    const body = `${modulePhaseBar(module, phase, section)}
      ${section === "summary" ? examObjectivesPanel(module) : ""}
      ${renderModuleSection(module, section, activeLesson)}`;
    elements.app.innerHTML = `
      ${moduleChapterHeader(module, chapterIndex)}
      ${body}
    `;
  }

  function moduleChapterHeader(module, chapterIndex) {
    const next = nextLessonInModule(module);
    const progress = moduleProgress(module);
    return `
      <header class="module-chapter-header">
        <div class="module-chapter-header-copy">
          <span class="ch-num-big">Chapter ${String(chapterIndex).padStart(2, "0")} · ${escapeHtml(module.weight)} · ${escapeHtml(module.duration)}</span>
          <h2>Ch ${chapterIndex}: ${escapeHtml(module.title)}</h2>
          <p>${escapeHtml(module.overview)}</p>
          <div class="ch-progress-row">
            <div class="ch-topic-progress-wrap" aria-hidden="true">
              <div class="ch-topic-progress-bar" style="width:${progress.percent}%"></div>
            </div>
            <span class="ch-progress-label">${progress.percent}% complete · ${progress.done}/${progress.total} lessons</span>
          </div>
        </div>
        <div class="module-chapter-header-actions">
          <button class="button ghost" data-action="reset-progress" type="button">Reset Progress</button>
          ${
            next
              ? `<button class="button primary" data-action="start-studying" data-module="${escapeAttr(module.id)}" data-lesson="${escapeAttr(module.id)}:${escapeAttr(next.lesson.id)}" type="button">Start Studying ${icon("play")}</button>`
              : `<button class="button primary" data-action="start-studying" data-module="${escapeAttr(module.id)}" data-lesson="${escapeAttr(module.id)}:${escapeAttr(module.lessons[0]?.id || "")}" type="button">Start Studying ${icon("play")}</button>`
          }
        </div>
      </header>
    `;
  }

  // Chapter activity navigation. These buttons swap the content area rather than
  // show same-page panels, so they are a nav landmark with aria-current, not tabs.
  function modulePhaseBar(module, phase, section) {
    const current = MODULE_SECTIONS.some((item) => item.id === section) ? section : "topics";
    return `
      <nav class="module-phase-bar" aria-label="Chapter activities">
        <div class="module-phase-steps">
          ${MODULE_SECTIONS.map((item) => {
            const active = item.id === current;
            return `
              <button class="module-phase-step${active ? " active" : ""}" data-module="${escapeAttr(module.id)}" data-module-section="${escapeAttr(item.id)}" type="button"${active ? ' aria-current="page"' : ""}>
                <span class="module-phase-icon">${icon(item.icon)}</span>
                <span class="module-phase-copy">
                  <span class="module-phase-label">${escapeHtml(item.label)}</span>
                  <span class="module-phase-sub">${escapeHtml(item.hint)}</span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </nav>
    `;
  }

  function examObjectivesPanel(module) {
    const domain = data.examDomains.find((item) => item.id === module.id || item.title === module.domain);
    const objectives = [...new Set(module.lessons.flatMap((lesson) => lesson.objectives || []))];
    return `
      <section class="card exam-objectives-panel">
        <h3><span class="panel-icon">${icon("target")}</span> Exam Objectives Covered</h3>
        ${domain ? `<p class="exam-domain-line">${escapeHtml(domain.title)} (${escapeHtml(domain.weight)})</p>` : ""}
        <ul class="exam-objective-list">
          ${objectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderModuleSection(module, section, activeLesson) {
    if (section === "topics") return topicsSection(module, activeLesson);
    if (section === "scenarios") return scenariosSection(module);
    if (section === "labs") return labsSection(module);
    if (section === "flashcards") return flashcardsSection(module);
    if (section === "quiz") return quizSection(module);
    if (section === "summary") return summarySection(module);
    return topicsSection(module, activeLesson);
  }

  function topicsSection(module, activeLesson) {
    const progress = moduleProgress(module);
    const selectedId = state.lessonId || activeLesson?.id;
    return `
      <div class="module-shell" style="--accent:${escapeAttr(module.accent)}">
        <aside class="card lesson-sidebar">
          <h3>Lessons <span class="topic-counter" style="margin-left:auto">${progress.done}/${progress.total} complete</span></h3>
          <div class="lesson-list">
            ${module.lessons.map((lesson) => lessonButton(module, lesson, selectedId)).join("")}
          </div>
        </aside>
        ${lessonPanel(module, activeLesson)}
      </div>
    `;
  }

  // Every scenario in a chapter, in course order (lessons, then objectives).
  function scenarioItems(module) {
    return module.lessons.flatMap((lesson) =>
      (lesson.objectives || []).map((objective, objectiveIndex) => ({
        moduleId: module.id,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        objectiveIndex,
        objective,
      }))
    );
  }

  function scenarioOpenAttr(item) {
    return `${item.moduleId}:${item.lessonId}:${item.objectiveIndex}`;
  }

  // Position of the scenario in state, or -1 when none is selected.
  function selectedScenarioIndex(items) {
    if (!state.lessonId || !Number.isInteger(state.objectiveIndex)) return -1;
    return items.findIndex((item) => item.lessonId === state.lessonId && item.objectiveIndex === state.objectiveIndex);
  }

  function scenarioListMarkup(items, selected) {
    return `
      <nav class="scenario-nav" aria-label="Scenarios in this chapter">
        <div class="scenario-list">
          ${items
            .map((item, index) => {
              const current = index === selected;
              return `
                <button class="scenario-objective${current ? " active" : ""}" data-objective="${escapeAttr(scenarioOpenAttr(item))}" type="button"${current ? ' aria-current="true"' : ""}>
                  <span class="scenario-number" aria-hidden="true">${index + 1}</span>
                  <span class="scenario-lesson">${escapeHtml(item.lessonTitle)}</span>
                  <span class="scenario-text">${escapeHtml(item.objective)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </nav>
    `;
  }

  // Previous / back-to-overview / next controls. Previous and Next are disabled
  // at the ends of the chapter rather than wrapping around.
  function scenarioStepBar(items, selected) {
    const prev = selected > 0 ? items[selected - 1] : null;
    const next = selected < items.length - 1 ? items[selected + 1] : null;
    const current = items[selected];
    return `
      <nav class="scenario-step-bar" aria-label="Scenario navigation">
        ${
          prev
            ? `<button class="button" data-objective="${escapeAttr(scenarioOpenAttr(prev))}" title="${escapeAttr(`Scenario ${selected}: ${prev.objective}`)}" type="button">${icon("arrow-left")} Previous</button>`
            : `<button class="button" type="button" disabled>${icon("arrow-left")} Previous</button>`
        }
        <button class="button ghost" data-module="${escapeAttr(current.moduleId)}" data-module-section="scenarios" type="button">All scenarios</button>
        ${
          next
            ? `<button class="button" data-objective="${escapeAttr(scenarioOpenAttr(next))}" title="${escapeAttr(`Scenario ${selected + 2}: ${next.objective}`)}" type="button">Next ${icon("arrow-right")}</button>`
            : `<button class="button" type="button" disabled>Next ${icon("arrow-right")}</button>`
        }
        <span class="scenario-position">Scenario ${selected + 1} of ${items.length}</span>
      </nav>
    `;
  }

  // The list is always on screen. Selecting a scenario shows its detail beside
  // it, so every other scenario stays one click away.
  function scenariosSection(module) {
    const items = scenarioItems(module);
    const selected = selectedScenarioIndex(items);
    const list = scenarioListMarkup(items, selected);
    if (selected < 0) {
      return `
        <section class="card module-section-panel scenario-overview">
          <h3><span class="panel-icon">${icon("route")}</span> Scenario Objectives</h3>
          <p class="section-lead">Drill into exam-style objectives for this chapter. Pick a scenario to focus study content.</p>
          ${list}
        </section>
      `;
    }
    const item = items[selected];
    const lesson = module.lessons.find((candidate) => candidate.id === item.lessonId);
    const focus = { index: item.objectiveIndex, objective: item.objective };
    return `
      <div class="scenario-layout">
        <div class="scenario-detail">
          ${scenarioStepBar(items, selected)}
          <div class="module-shell module-shell--single" style="--accent:${escapeAttr(module.accent)}">${objectivePanel(module, lesson, lessonContent(module.id, lesson.id), focus)}</div>
        </div>
        <aside class="scenario-rail" aria-labelledby="scenarioRailTitle">
          <h3 id="scenarioRailTitle">All scenarios</h3>
          ${list}
        </aside>
      </div>
    `;
  }

  // ── GitHub-backed lab learning path ───────────────────────
  function authoredBadge() {
    return `<span class="src-badge authored" title="Authored for this study app from AWS documentation. It is not an official AWS lab.">Study Buddy</span>`;
  }

  function repoBadge() {
    return `<span class="src-badge repo" title="Sourced from an upstream AWS lab repository">AWS repo</span>`;
  }

  // Labs carry an origin flag. Authored labs are always badged as Study Buddy
  // content; only labs imported from an upstream repository get the repo badge.
  function sourceBadge(lab) {
    return lab && lab.origin === "authored" ? authoredBadge() : repoBadge();
  }

  function lessonTitleById(module, lessonId) {
    return module.lessons.find((l) => l.id === lessonId)?.title || "";
  }

  function labsSection(module) {
    const labs = labsByModule.get(module.id) || [];
    if (!labs.length) {
      // Modules with no mapped repo lab (orientation, final review) fall back
      // to any authored practice tasks so the section is never empty.
      const items = collectLabItems(module);
      return `
        <section class="card module-section-panel">
          <h3><span class="panel-icon">${icon("flask-conical")}</span> Chapter Labs</h3>
          <p class="section-lead">${
            items.length
              ? "Practice tasks for this chapter. Guided hands-on labs are in the five technical chapters."
              : "No hands-on lab is mapped to this chapter."
          }</p>
          ${items.length ? `<ul class="labs-list">${items.map((i) => `<li class="lab-item"><span class="lab-lesson">${escapeHtml(i.lessonTitle)}</span><p>${escapeHtml(i.task)}</p></li>`).join("")}</ul>` : ""}
        </section>
      `;
    }

    const selected = labsById.get(state.labId) && labs.includes(labsById.get(state.labId))
      ? labsById.get(state.labId)
      : labs[0];

    return `
      <div class="module-shell" style="--accent:${escapeAttr(module.accent)}">
        <aside class="card lesson-sidebar">
          <h3>Hands-on Labs <span class="topic-counter" style="margin-left:auto">${labs.length}</span></h3>
          <p class="lab-sidebar-hint">Authored labs aligned to this skill area. They run in your own AWS account.</p>
          <div class="lesson-list">
            ${labs.map((lab) => labNavButton(module, lab, selected.id)).join("")}
          </div>
          ${labsSourceCredit()}
        </aside>
        ${labLearningPath(module, selected)}
      </div>
    `;
  }

  function labNavButton(module, lab, selectedId) {
    const pct = labProgressPct(lab);
    return `
      <button class="lesson-button lab-nav-button${lab.id === selectedId ? " active" : ""}${pct === 100 ? " done" : ""}" data-lab="${escapeAttr(lab.id)}" type="button">
        <span>${escapeHtml(lab.title)}</span>
        <span>${escapeHtml(lessonTitleById(module, lab.lessonId))} · ${lab.durationMinutes || "?"} min${pct === 100 ? ` · <span class="item-status">${icon("check")} Completed</span>` : pct > 0 ? ` · ${pct}% done` : ""}</span>
        <span class="lab-nav-progress"><span style="width:${pct}%"></span></span>
      </button>
    `;
  }

  // Credits the upstream lab repository. Sync details (commit, date, whether
  // upstream has moved on) are maintenance information and stay out of the app;
  // tools/build_labs_data.py refreshes labs.js from the repository.
  function labsSourceCredit() {
    if (!labsData.repoUrl) {
      return `<p class="lab-sync-note">Labs are authored for this study app from AWS documentation. They are not AWS's official labs.</p>`;
    }
    return `<p class="lab-sync-note">Lab instructions come from AWS documentationing's <a href="${escapeUrl(labsData.repoUrl)}" target="_blank" rel="noopener">SAP-C02 lab repository${NEW_TAB}</a>.</p>`;
  }

  function labProgressPct(lab) {
    const total = (lab.tasks || []).length;
    if (!total) return 0;
    const done = state.labProgress[lab.id] || {};
    const count = Object.keys(done).filter((k) => done[k]).length;
    return Math.round((Math.min(count, total) / total) * 100);
  }

  function toolBadges(tools) {
    return (tools || [])
      .map((t) => `<span class="tool-badge tool-${t}">${escapeHtml(TOOL_LABELS[t] || t)}</span>`)
      .join("");
  }

  function labStep(n, title, badge, bodyHtml) {
    return `
      <section class="lab-step">
        <div class="lab-step-head">
          <span class="lab-step-num">${n}</span>
          <h3>${escapeHtml(title)}</h3>
          ${badge || ""}
        </div>
        <div class="lab-step-body">${bodyHtml}</div>
      </section>
    `;
  }

  function labLearningPath(module, lab) {
    const guide = labGuides[lab.id] || null;
    const demos = demosByModule.get(module.id) || [];
    const pct = labProgressPct(lab);
    const lessonTitle = lessonTitleById(module, lab.lessonId);

    // 1 — Concept & exam objective
    const concept = labStep(
      1,
      "Concept & exam objective",
      authoredBadge(),
      guide
        ? `<p class="lab-exam-obj"><strong>Exam objective:</strong> ${escapeHtml(guide.examObjective)} <span class="lab-domain">${escapeHtml(guide.examDomain)}</span></p>
           <p>${escapeHtml(guide.whyItMatters)}</p>`
        : `<p>This lab reinforces the <strong>${escapeHtml(lessonTitle)}</strong> objective in ${escapeHtml(module.title)}.</p>`
    );

    // 2 — Prerequisites & required resources
    const prep = labStep(
      2,
      "Prerequisites & required resources",
      guide ? authoredBadge() : sourceBadge(lab),
      `<div class="lab-two-col">
        <div>
          <h4>Prerequisites</h4>
          <ul class="lab-list">${(guide?.prerequisites || ["An AWS account with permission to complete the tasks below."]).map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Required AWS resources</h4>
          <ul class="lab-list">${(guide?.requiredResources || lab.primaryTopics || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        </div>
      </div>
      <p class="lab-tools-line">Activities: ${toolBadges(lab.tools) || "portal"}</p>`
    );

    // 3 — Demonstration
    const docLinks = guide?.docs || [];
    const demo = demos.length
      ? labStep(
          3,
          "Watch the demonstration",
          sourceBadge(lab),
          `<p>Demonstration for this skill area:</p>
           <ul class="lab-link-list">${demos.map((d) => `<li><a href="${escapeUrl(d.url)}" target="_blank" rel="noopener">${escapeHtml(d.title)}${NEW_TAB}</a></li>`).join("")}</ul>`
        )
      : docLinks.length
        ? labStep(
            3,
            "Demonstration — read the walkthrough",
            authoredBadge(),
            `<p>This app does not bundle videos. Read the AWS documentation walkthroughs below to see the feature demonstrated before you start the tasks.</p>
             <ul class="lab-link-list">${docLinks.map((d) => `<li><a href="${escapeUrl(d.url)}" target="_blank" rel="noopener">${escapeHtml(d.label)}${NEW_TAB}</a></li>`).join("")}</ul>`
          )
        : "";

    // 4 — Pre-lab knowledge check
    const pre = guide?.preCheck?.length
      ? labStep(4, "Knowledge check — before you start", authoredBadge(), knowledgeCheck(lab.id, "pre", guide.preCheck))
      : "";

    // 5 — Hands-on lab (repo scenario + tasks + files)
    const tasksHtml = (lab.tasks || [])
      .map((task, i) => {
        const done = !!(state.labProgress[lab.id] || {})[i];
        return `
          <section class="lab-task-block${done ? " done" : ""}">
            <div class="lab-task-heading">
              <button class="lab-task-check" data-lab-task="${escapeAttr(lab.id)}:${i}" role="checkbox" aria-checked="${done}" aria-label="Mark task ${i + 1} complete" type="button">${done ? icon("check") : ""}</button>
              <h4>Task ${i + 1}: ${escapeHtml(task.title)}</h4>
            </div>
            <div class="lab-instructions">${task.html || `<p>${escapeHtml(task.title)}</p>`}</div>
          </section>`;
      })
      .join("");
    const filesHtml = (lab.supportingFiles || []).length
      ? `<div class="lab-files">
          <h4>Supporting files</h4>
          <ul class="lab-link-list">${lab.supportingFiles.map((f) => `<li><a href="${escapeUrl(f.url)}" target="_blank" rel="noopener"><span class="file-type">${escapeHtml(f.type)}</span> ${escapeHtml(f.name)}${NEW_TAB}</a></li>`).join("")}</ul>
        </div>`
      : "";
    const hands = labStep(
      5,
      "Hands-on lab",
      sourceBadge(lab),
      `${lab.scenario ? `<p class="lab-scenario">${escapeHtml(lab.scenario)}</p>` : ""}
       <p class="lab-progress-line"><span class="lab-progress-inline">${pct}% complete</span> — full instructions are below; tick each task as you finish it.</p>
       <div class="lab-instructions-wrap">${tasksHtml}</div>
       ${filesHtml}
       ${
         lab.url
           ? `<p class="lab-source-line">Source: <a href="${escapeUrl(lab.url)}" target="_blank" rel="noopener">${escapeHtml(lab.path)}${NEW_TAB}</a></p>`
           : `<p class="lab-source-line">Source: authored for this study app from AWS documentation (see the walkthrough links in step 3). Names and values are examples; adjust them for your subscription.</p>`
       }`
    );

    // 6 — Validation
    const validation = (lab.keyTakeaways || []).length
      ? labStep(6, "Validate & key takeaways", sourceBadge(lab), `<ul class="lab-list">${lab.keyTakeaways.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul>`)
      : "";

    // 7 — Troubleshooting
    const trouble = guide?.troubleshooting?.length
      ? labStep(
          7,
          "Troubleshooting common errors",
          authoredBadge(),
          `<div class="lab-trouble">${guide.troubleshooting.map((t) => `
            <div class="trouble-item">
              <p class="trouble-problem">${icon("triangle-alert")} ${escapeHtml(t.problem)}</p>
              <p class="trouble-cause"><strong>Cause:</strong> ${escapeHtml(t.cause)}</p>
              <p class="trouble-fix"><strong>Fix:</strong> ${escapeHtml(t.fix)}</p>
            </div>`).join("")}</div>`
        )
      : "";

    // 8 — Post-lab knowledge check
    const post = guide?.postCheck?.length
      ? labStep(8, "Knowledge check — after the lab", authoredBadge(), knowledgeCheck(lab.id, "post", guide.postCheck))
      : "";

    // 9 — Resource cleanup (repo steps + authored note)
    const cleanupRepo = (lab.cleanup || []).length
      ? `<p>Delete the lab resources to avoid ongoing AWS charges:</p><ul class="lab-list">${lab.cleanup.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>`
      : "";
    const cleanupNote = guide?.cleanupNote ? `<p class="lab-cleanup-note">${escapeHtml(guide.cleanupNote)}</p>` : "";
    const cleanup = cleanupRepo || cleanupNote
      ? labStep(9, "Clean up resources", cleanupRepo ? sourceBadge(lab) : authoredBadge(), `${cleanupRepo}${cleanupNote}`)
      : "";

    return `
      <article class="card lesson-panel lab-path">
        <header class="lesson-header">
          <div class="lesson-header-copy">
            <span class="topic-counter">Hands-on Lab · ${escapeHtml(lab.repoModule)}</span>
            <h2>${escapeHtml(lab.title)}</h2>
            <p>${escapeHtml(lessonTitle)} · ${escapeHtml(module.title)}</p>
            <div class="lab-meta-badges">
              <span class="lab-meta-pill">${icon("timer")} ${escapeHtml(lab.duration || "—")}</span>
              <span class="lab-meta-pill">Level ${escapeHtml(String(lab.level || "—"))}</span>
              ${toolBadges(lab.tools)}
            </div>
          </div>
        </header>
        <div class="lab-progress-wrap"><div class="lab-progress-bar" style="width:${pct}%"></div></div>
        <p class="lab-path-lead">Structured path: concept → exam objective → demonstration → hands-on lab → validation → troubleshooting → knowledge check → cleanup.</p>
        ${concept}${prep}${demo}${pre}${hands}${validation}${trouble}${post}${cleanup}
      </article>
    `;
  }

  function knowledgeCheck(labId, phase, questions) {
    return `<div class="kcheck">${questions
      .map((qq, qi) => {
        const key = `${labId}:${phase}:${qi}`;
        const chosen = state.labChecks[key];
        const answered = Number.isInteger(chosen);
        const opts = qq.options
          .map((opt, oi) => {
            let cls = "kcheck-opt";
            if (answered) {
              if (oi === qq.answer) cls += " correct";
              else if (oi === chosen) cls += " wrong";
            }
            return `<button class="${cls}" data-lab-check="${escapeAttr(key)}:${oi}" type="button"${answered ? " disabled" : ""}>${escapeHtml(opt)}</button>`;
          })
          .join("");
        return `
          <div class="kcheck-q">
            <p class="kcheck-prompt">${escapeHtml(qq.q)}</p>
            <div class="kcheck-opts">${opts}</div>
            ${answered ? `<p class="kcheck-explain ${chosen === qq.answer ? "right" : "off"}">${chosen === qq.answer ? icon("check") + " Correct. " : icon("x") + " Not quite. "}${escapeHtml(qq.explanation)}</p>` : ""}
          </div>`;
      })
      .join("")}</div>`;
  }

  function collectLabItems(module) {
    return module.lessons.flatMap((lesson) =>
      (lesson.practice || []).map((task) => ({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        task,
      }))
    );
  }

  function flashcardsSection(module) {
    const cards = collectFlashcards(module);
    const index = Math.min(Math.max(state.flashcardIndex || 0, 0), Math.max(0, cards.length - 1));
    const card = cards[index];
    return `
      <section class="card module-section-panel">
        <h3><span class="panel-icon">${icon("layers")}</span> Flashcards</h3>
        <p class="section-lead">Chapter essentials, plus key points and exam tips from the topics.</p>
        ${
          card
            ? `
              <div class="flashcard-stage">
                <div class="flashcard-progress" aria-hidden="true"><span style="width:${Math.round(((index + 1) / cards.length) * 100)}%"></span></div>
                <button class="flashcard${state.flashcardFlipped ? " flipped" : ""}" data-action="flip-flashcard" type="button" aria-describedby="flashcardHint">
                  <span class="flashcard-face flashcard-front"><span class="flashcard-side">Term</span>${escapeHtml(card.front)}</span>
                  <span class="flashcard-face flashcard-back"><span class="flashcard-side">Key point</span>${richText(card.back)}</span>
                </button>
                <p class="flashcard-hint" id="flashcardHint">${state.flashcardFlipped ? "Showing the key point. Select the card to see the term again." : "Select the card, or press Enter, to reveal the key point."}</p>
                <div class="flashcard-meta">${escapeHtml(card.source)} · Card ${index + 1} of ${cards.length}</div>
                <div class="flashcard-nav">
                  <button class="button" data-action="flashcard-prev" type="button"${index === 0 ? " disabled" : ""}>Previous</button>
                  <button class="button primary" data-action="flashcard-next" type="button"${index >= cards.length - 1 ? " disabled" : ""}>Next Card</button>
                </div>
              </div>
            `
            : `<p>No flashcards available for this module yet.</p>`
        }
      </section>
    `;
  }

  function quizSection(module) {
    const count = quizBankQuestions().filter((q) => q.moduleId === module.id).length;
    return `
      <section class="card module-section-panel module-quiz-panel">
        <h3><span class="panel-icon">${icon("clipboard-check")}</span> Chapter Practice</h3>
        <p class="section-lead">${count} practice questions mapped to this module domain.</p>
        <div class="inline-actions">
          <button class="button primary" data-view="practice" data-practice-filter="${escapeAttr(module.id)}" type="button">Start Practice Quiz</button>
        </div>
      </section>
    `;
  }

  function summarySection(module) {
    return `
      ${moduleMindMap(module.id)}
      <section class="card module-section-panel">
        <h3><span class="panel-icon">${icon("file-text")}</span> Chapter Summary</h3>
        <p class="section-lead">${escapeHtml(module.overview)}</p>
        ${listBlock("Key Takeaways", module.takeaways?.length ? module.takeaways : data.summary?.takeaways?.slice(0, 4) || [])}
        <div class="inline-actions" style="margin-top:16px">
          <button class="button" data-module="${escapeAttr(module.id)}" data-module-section="scenarios" type="button">Review Scenarios</button>
          <button class="button primary" data-view="practice" data-practice-filter="${escapeAttr(module.id)}" type="button">Start Practice Quiz</button>
        </div>
      </section>
    `;
  }

  function collectFlashcards(module) {
    const cards = (module.flashcards || []).map((card) => ({
      front: card.front,
      back: card.back,
      source: "Chapter essentials",
    }));
    module.lessons.forEach((lesson) => {
      const content = lessonContent(module.id, lesson.id);
      (content?.topics || []).forEach((topic) => {
        (topic.blocks || []).forEach((block) => {
          if (block.type === "key" || block.type === "exam") {
            cards.push({
              front: block.title || (block.type === "exam" ? `Exam tip: ${topic.baseTitle || topic.title}` : topic.baseTitle || topic.title),
              back: block.body || "",
              source: `${lesson.title} · ${topic.baseTitle || topic.title}`,
            });
          }
        });
      });
    });
    return cards;
  }

  function nextLessonInModule(module) {
    for (const lesson of module.lessons) {
      if (!isComplete(module.id, lesson.id)) {
        return { module, lesson };
      }
    }
    return module.lessons[0] ? { module, lesson: module.lessons[0] } : null;
  }

  function openModuleSection(moduleId, section, lessonId) {
    state.view = "module";
    state.moduleId = moduleId;
    state.moduleSection = section;
    state.objectiveIndex = null;
    state.flashcardIndex = 0;
    state.flashcardFlipped = false;
    state.labIndex = 0;
    state.topic = 0;
    if (lessonId) state.lessonId = lessonId;
    else if (section === "topics") state.lessonId = null;
    else state.lessonId = null;
    clearSearch();
    persist();
    render();
  }

  function moduleMindMap(moduleId) {
    const module = modulesById.get(moduleId);
    const map = module && module.mindMap;
    if (!map) return "";
    return mindMapPanel({
      id: `${module.id}-map`,
      title: map.title,
      body: map.body,
      branches: map.branches || [],
      asset: map.asset,
      alt: map.alt,
    });
  }

  function mindMapPanel({ id, title, body, branches, asset, alt }) {
    return `
      <section class="mind-map-panel card" aria-labelledby="${escapeAttr(id)}-title">
        <div class="mind-map-copy">
          <span class="topic-counter">Visual Map</span>
          <h3 id="${escapeAttr(id)}-title">${escapeHtml(title)}</h3>
          <p>${escapeHtml(body)}</p>
          <ul class="mind-map-branches">
            ${branches.map((branch) => `<li>${escapeHtml(branch)}</li>`).join("")}
          </ul>
          <a class="button link" href="${escapeUrl(asset)}" target="_blank" rel="noreferrer">Open full map</a>
        </div>
        <a class="mind-map-image-link" href="${escapeUrl(asset)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeAttr(title)} mind map">
          <img src="${escapeUrl(asset)}" alt="${escapeAttr(alt)}" />
        </a>
      </section>
    `;
  }


  function renderPractice() {
    elements.title.textContent = "Practice";
    if (window.SAPC02QuizUI) {
      window.SAPC02QuizUI.render(elements.app);
      return;
    }
    elements.app.innerHTML = '<div class="empty-state">The practice questions didn\'t load. Reload the page to try again.</div>';
  }

  function quizQuestionCount() {
    if (window.SAPC02QuizUI?.questionCount) return window.SAPC02QuizUI.questionCount();
    return data.quiz.length;
  }

  function quizBankQuestions() {
    const bank = (window.SAPC02_QUIZ?.questions || []).concat(window.SAPC02_QUIZ_PRIVATE?.questions || []);
    return Array.isArray(bank) && bank.length ? bank : data.quiz;
  }

  function renderSearch(query) {
    elements.title.textContent = "Search";
    const results = search(query);
    elements.app.innerHTML = `
      <div class="search-results">
        ${results.length ? results.map(searchResult).join("") : `<div class="empty-state">No matches for "${escapeHtml(query)}".</div>`}
      </div>
    `;
  }

  function statTile(iconName, value, label) {
    return `
      <div class="stat-card">
        <div class="stat-icon">${icon(iconName)}</div>
        <div class="stat-val">${escapeHtml(value)}</div>
        <div class="stat-label">${escapeHtml(label)}</div>
      </div>
    `;
  }

  function moduleCard(module, index) {
    const progress = moduleProgress(module);
    return `
      <div class="chapter-card" data-module="${escapeAttr(module.id)}" style="--accent:${escapeAttr(module.accent)}" role="button" tabindex="0">
        <div class="ch-header">
          <span class="ch-badge">${String(index + 1).padStart(2, "0")}</span>
          <span class="ch-title">${escapeHtml(module.title)}</span>
        </div>
        <p class="ch-desc">${escapeHtml(module.overview)}</p>
        <div class="ch-topics">
          <span class="tag primary">${escapeHtml(module.weight)}</span>
          <span class="tag">${escapeHtml(module.duration)}</span>
          <span class="tag accent">${progress.done}/${progress.total} lessons</span>
        </div>
        <div class="ch-footer">
          <div class="progress-bar-wrap" aria-hidden="true">
            <div class="progress-bar" style="width:${progress.percent}%"></div>
          </div>
          <span class="progress-label">${progress.percent}%</span>
        </div>
      </div>
    `;
  }

  function domainBar(domain) {
    const width = Math.min(100, Math.max(12, Number(domain.high || 0) * 4));
    const module = modulesById.get(domain.id) || data.modules.find((item) => item.domain === domain.title);
    const color = module?.accent || "#5c6770";
    return `
      <div class="domain-row">
        <div class="domain-label"><span>${escapeHtml(domain.title)}</span><span>${escapeHtml(domain.weight)}</span></div>
        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" style="--progress:${width}%; --accent:${escapeAttr(color)}"></div>
        </div>
      </div>
    `;
  }

  function lessonButton(module, lesson, activeId) {
    const done = isComplete(module.id, lesson.id);
    return `
      <button class="lesson-button${activeId === lesson.id ? " active" : ""}${done ? " done" : ""}" data-lesson="${escapeAttr(module.id)}:${escapeAttr(lesson.id)}" type="button">
        <span>${escapeHtml(lesson.title)}</span>
        <span>${escapeHtml(lesson.duration)}${done ? ` · <span class="item-status">${icon("check")} Completed</span>` : ""}</span>
      </button>
    `;
  }

  function lessonPanel(module, lesson) {
    const key = lessonKey(module.id, lesson.id);
    const done = isComplete(module.id, lesson.id);
    const bookmarked = Boolean(state.bookmarks[key]);
    const content = lessonContent(module.id, lesson.id);
    const focus = objectiveFocus(lesson);
    if (focus) {
      return objectivePanel(module, lesson, content, focus);
    }
    return `
      <article class="card lesson-panel">
        <header class="lesson-header">
          <div class="lesson-header-copy">
            <h2>${escapeHtml(lesson.title)}</h2>
            <p>${escapeHtml(lesson.summary)}</p>
          </div>
          <div class="lesson-actions">
            <button class="button primary" data-action="toggle-complete" data-lesson="${escapeAttr(module.id)}:${escapeAttr(lesson.id)}" type="button">${done ? "Mark Open" : "Mark Complete"}</button>
            <button class="button" data-action="toggle-bookmark" data-lesson="${escapeAttr(module.id)}:${escapeAttr(lesson.id)}" type="button">${bookmarked ? "Remove Bookmark" : "Bookmark"}</button>
            <button class="button" data-view="practice" data-practice-filter="${escapeAttr(module.id)}" type="button">Practice</button>
          </div>
        </header>

        ${content ? topicViewer(content, module.id, lesson.id, followingLesson(module, lesson)) : ""}
        ${(!content || !(content.topics || []).length) && window.SAPC02KnowledgeCheck ? window.SAPC02KnowledgeCheck.markup(module.id, lesson.id, followingLesson(module, lesson)) : ""}
      </article>
    `;
  }

  // The knowledge check is the final step of the lesson's topic sequence (after the last topic).
  function hasKnowledgeCheck(moduleId, lessonId) {
    const list = (window.SAPC02_KNOWLEDGE_CHECKS || {})[lessonKey(moduleId, lessonId)];
    return Array.isArray(list) && list.length > 0 && Boolean(window.SAPC02KnowledgeCheck);
  }

  // Number of steps in the topic viewer: every topic, plus the knowledge check when the lesson has one.
  function topicStepCount(moduleId, lessonId, content) {
    const topics = (content && content.topics) || [];
    return topics.length + (topics.length && hasKnowledgeCheck(moduleId, lessonId) ? 1 : 0);
  }

  // The lesson after this one in course order (crossing into the next module), for "Continue".
  function followingLesson(module, lesson) {
    const all = data.modules.flatMap((m) => m.lessons.map((l) => ({ key: lessonKey(m.id, l.id), title: l.title })));
    const index = all.findIndex((item) => item.key === lessonKey(module.id, lesson.id));
    return index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  }

  // After moving between topics, bring the viewer to the top of the screen so the whole page is visible.
  function revealTopicViewer() {
    const viewer = document.querySelector(".topic-viewer");
    if (viewer) viewer.scrollIntoView({ block: "start", behavior: "auto" });
  }

  // Lesson content is paginated into screen-sized topics so a topic fits the viewport without inner scrolling.
  function lessonContent(moduleId, lessonId) {
    const store = window.SAPC02_LESSON_CONTENT || {};
    const raw = store[moduleId + ":" + lessonId] || null;
    if (!raw) return null;
    lessonContent.cache = lessonContent.cache || new WeakMap();
    const budget = pageBudget();
    const hit = lessonContent.cache.get(raw);
    if (hit && hit.budget === budget) return hit.value;
    const value = { ...raw, topics: (raw.topics || []).flatMap(paginateTopic) };
    lessonContent.cache.set(raw, { budget, value });
    return value;
  }

  // Estimated px of block content that fits one screen.
  function pageBudget() {
    return Math.round(bodyMaxHeight() / (1.5 * fontScale()));
  }
  // Height the topic body may use: the viewport minus the header, toolbar, title and navigation bar.
  function bodyMaxHeight() {
    return Math.min(1100, Math.max(430, (window.innerHeight || 768) - 240));
  }
  // Size of topic body text in px (mirrors the clamp() in styles.css), relative to the 16px the estimates assume.
  function fontScale() {
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const text = Math.min(1.15 * root, Math.max(root, 0.8 * root + 0.002 * (window.innerWidth || 1366)));
    return text / 16;
  }

  function textLines(text, perLine) {
    return Math.max(1, Math.ceil(String(text || "").length / perLine));
  }

  function blockWeight(block) {
    switch (block.type) {
      case "text":
        return textLines(block.body, 100) * 26 + 14;
      case "bullets":
      case "steps":
        return (block.items || []).reduce((sum, item) => sum + textLines(item, 92) * 24 + 8, 8);
      case "code":
        return String(block.body || "").split("\n").length * 21 + 44;
      case "table": {
        const rows = (block.rows || []).reduce((sum, row) => sum + Math.max(...row.map((cell) => textLines(cell, 28))) * 22 + 18, 0);
        return rows + 50;
      }
      case "key":
      case "exam":
        return textLines(block.body, 88) * 24 + 64;
      case "learn":
        return 96;
      default:
        return 80;
    }
  }

  // Break one oversized block into pieces that each fit a screen where the block type allows it.
  function splitBlock(block) {
    if (blockWeight(block) <= pageBudget()) return [block];
    if (block.type === "bullets" || block.type === "steps") {
      const parts = [];
      let current = [];
      let weight = 8;
      (block.items || []).forEach((item) => {
        const w = textLines(item, 92) * 24 + 8;
        if (current.length && weight + w > pageBudget()) {
          parts.push({ ...block, items: current });
          current = [];
          weight = 8;
        }
        current.push(item);
        weight += w;
      });
      if (current.length) parts.push({ ...block, items: current });
      return parts;
    }
    if (block.type === "table") {
      const parts = [];
      let current = [];
      let weight = 50;
      (block.rows || []).forEach((row) => {
        const w = Math.max(...row.map((cell) => textLines(cell, 28))) * 22 + 18;
        if (current.length && weight + w > pageBudget()) {
          parts.push({ ...block, rows: current });
          current = [];
          weight = 50;
        }
        current.push(row);
        weight += w;
      });
      if (current.length) parts.push({ ...block, rows: current });
      return parts;
    }
    if (block.type === "text") {
      const sentences = String(block.body || "").match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [block.body];
      const parts = [];
      let current = "";
      sentences.forEach((sentence) => {
        if (current && textLines(current + sentence, 100) * 26 + 14 > pageBudget()) {
          parts.push({ ...block, body: current.trim() });
          current = "";
        }
        current += sentence;
      });
      if (current.trim()) parts.push({ ...block, body: current.trim() });
      return parts;
    }
    return [block];
  }

  // Split a list or table block so its first part fits `room` px; returns [first, rest] or null.
  function splitToFit(block, room) {
    const key = block.type === "table" ? "rows" : block.items ? "items" : null;
    if (!key) return null;
    const unit = (entry) => (block.type === "table" ? Math.max(...entry.map((cell) => textLines(cell, 28))) * 22 + 18 : textLines(entry, 92) * 24 + 8);
    let used = block.type === "table" ? 50 : 8;
    let count = 0;
    for (const entry of block[key]) {
      const w = unit(entry);
      if (used + w > room) break;
      used += w;
      count += 1;
    }
    if (count === 0 || count === block[key].length) return null;
    return [{ ...block, [key]: block[key].slice(0, count) }, { ...block, [key]: block[key].slice(count) }];
  }

  function paginateTopic(topic) {
    const queue = (topic.blocks || []).flatMap(splitBlock);
    const pages = [];
    let current = [];
    let weight = 0;
    const closePage = () => {
      if (current.length) pages.push(current);
      current = [];
      weight = 0;
    };
    while (queue.length) {
      const block = queue.shift();
      const w = blockWeight(block);
      if (!current.length || weight + w <= pageBudget()) {
        current.push(block);
        weight += w;
        continue;
      }
      // Fill the rest of this page with the start of a list or table, then continue on the next page.
      const room = pageBudget() - weight;
      const parts = room > 130 ? splitToFit(block, room) : null;
      if (parts) {
        current.push(parts[0]);
        queue.unshift(parts[1]);
      } else {
        queue.unshift(block);
      }
      closePage();
    }
    closePage();
    // Fold a tiny trailing page back into the previous one.
    if (pages.length > 1) {
      const last = pages[pages.length - 1];
      const lastWeight = last.reduce((sum, b) => sum + blockWeight(b), 0);
      const prevWeight = pages[pages.length - 2].reduce((sum, b) => sum + blockWeight(b), 0);
      if (lastWeight < 130 && prevWeight + lastWeight <= pageBudget() - 100) pages.splice(pages.length - 2, 2, [...pages[pages.length - 2], ...last]);
    }
    // Leave room on the final page for the Learn links added after pagination.
    const lastPage = pages[pages.length - 1];
    if (lastPage && lastPage.length > 1 && lastPage.reduce((sum, b) => sum + blockWeight(b), 0) > pageBudget() - 100) {
      pages.push([lastPage.pop()]);
    }
    // A heading line must not be the last block on a page.
    for (let i = 0; i < pages.length - 1; i += 1) {
      const tail = pages[i][pages[i].length - 1];
      if (pages[i].length > 1 && tail.type === "text" && /:\s*$/.test(tail.body)) pages[i + 1].unshift(pages[i].pop());
    }
    if (pages.length <= 1) return [{ ...topic, baseTitle: topic.title, blocks: pages[0] || [] }];
    return pages.map((pageBlocks, i) => ({
      ...topic,
      baseTitle: topic.title,
      title: `${topic.title} (${i + 1} of ${pages.length})`,
      isLastPage: i === pages.length - 1,
      blocks: pageBlocks,
    }));
  }

  function objectivePanel(module, lesson, content, focus) {
    const topic = topicForObjective(content, focus.objective);
    const practice = relatedItems(lesson.practice || [], focus.objective);
    return `
      <article class="card lesson-panel objective-focus" tabindex="-1">
        <div>
          <span class="topic-counter">Focused Objective</span>
          <h2>${escapeHtml(focus.objective)}</h2>
          <p>${escapeHtml(lesson.title)} · ${escapeHtml(module.title)}</p>
        </div>
        <div class="lesson-actions">
          <button class="button primary" data-action="view-full-lesson" data-lesson="${escapeAttr(module.id)}:${escapeAttr(lesson.id)}" type="button">View Full Lesson</button>
          <button class="button" data-view="practice" data-practice-filter="${escapeAttr(module.id)}" type="button">Practice</button>
        </div>

        <section class="objective-card">
          <h3>Selected Objective</h3>
          <p>${escapeHtml(focus.objective)}</p>
        </section>

        ${labRecommendation(module, lesson)}
        ${topic ? focusedTopicMarkup(topic, module.id, lesson.id) : ""}
        ${practice.length ? listBlock("Related Lab Tasks", practice) : ""}
      </article>
    `;
  }

  // Recommend the AWS lab most relevant to the lesson under study and
  // explain (from the authored guide) why it maps to this exam objective.
  function labRecommendation(module, lesson) {
    const labs = labsForLesson(module.id, lesson.id);
    if (!labs.length) return "";
    const lab = labs[0];
    const guide = labGuides[lab.id];
    const why = guide?.whyItMatters
      ? guide.whyItMatters.split(". ")[0] + "."
      : `Reinforces the ${lesson.title} skill hands-on in AWS.`;
    return `
      <section class="lab-rec">
        <div class="lab-rec-head">
          <span class="lab-rec-icon">${icon("flask-conical")}</span>
          <span class="lab-rec-eyebrow">Recommended hands-on lab</span>
          ${sourceBadge(lab)}
        </div>
        <h4 class="lab-rec-title">${escapeHtml(lab.title)}</h4>
        <p class="lab-rec-why">${escapeHtml(why)}</p>
        <div class="lab-rec-meta">
          <span class="lab-meta-pill">${icon("timer")} ${escapeHtml(lab.duration || "—")}</span>
          ${toolBadges(lab.tools)}
        </div>
        <div class="lab-rec-actions">
          <button class="button primary" data-open-lab="${escapeAttr(module.id)}:${escapeAttr(lab.id)}" type="button">Start this lab ${icon("arrow-right")}</button>
          ${lab.url ? `<a class="button link" href="${escapeUrl(lab.url)}" target="_blank" rel="noopener">View on GitHub${NEW_TAB}</a>` : ""}
        </div>
      </section>
    `;
  }

  function focusedTopicMarkup(topic, moduleId, lessonId) {
    const blocks = enrichTopicBlocks(moduleId, lessonId, topic);
    return `
      <section class="topic-viewer focused-topic">
        <div class="topic-viewer-header">
          <h3>Related Study Topic</h3>
        </div>
        <div class="topic-slide">
          <div class="topic-title">${escapeHtml(topic.title)}</div>
          <div class="topic-slide-body" tabindex="0" role="region" aria-label="Topic content">
            ${blocks.map(blockMarkup).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function objectiveFocus(lesson) {
    if (!lesson || !Number.isInteger(state.objectiveIndex)) return null;
    if (!state.lessonId || state.lessonId !== lesson.id) return null;
    const objective = lesson.objectives?.[state.objectiveIndex];
    return objective ? { index: state.objectiveIndex, objective } : null;
  }

  function topicForObjective(content, objective) {
    const topics = content?.topics || [];
    if (!topics.length) return null;
    const scored = topics
      .map((topic) => ({ topic, score: relevanceScore(topicText(topic), objective) }))
      .sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].topic : null;
  }

  function topicText(topic) {
    return [topic.title, ...(topic.blocks || []).map(blockText)].join(" ");
  }

  function blockText(block) {
    if (!block) return "";
    if (Array.isArray(block.items)) return [block.title, ...block.items].filter(Boolean).join(" ");
    if (Array.isArray(block.rows)) return [block.title, block.headers?.join(" "), block.rows.flat().join(" ")].filter(Boolean).join(" ");
    return [block.title, block.label, block.body].filter(Boolean).join(" ");
  }

  function relatedItems(items, objective) {
    return items.filter((item) => relevanceScore(item, objective) > 0).slice(0, 4);
  }

  function relevanceScore(text, objective) {
    const haystack = String(text || "").toLowerCase();
    return objectiveTokens(objective).reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
  }

  function objectiveTokens(objective) {
    const stop = new Set(["azure", "configure", "manage", "using", "create", "and", "with", "from", "into", "logs", "log"]);
    return String(objective || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3 && !stop.has(token));
  }

  function topicViewer(content, moduleId, lessonId, nextLesson) {
    const topics = content.topics || [];
    if (!topics.length) return "";
    const steps = topicStepCount(moduleId, lessonId, content);
    const index = Math.min(Math.max(state.topic || 0, 0), steps - 1);
    const isCheck = index >= topics.length;
    const topic = isCheck ? null : topics[index];
    const blocks = isCheck ? [] : enrichTopicBlocks(moduleId, lessonId, topic);
    const nextLabel = index === topics.length - 1 && steps > topics.length ? "Knowledge check" : "Next";
    const dotTitle = (i) => (i >= topics.length ? "Knowledge check" : topics[i].title);
    return `
      <section class="topic-viewer" aria-label="Study topics">
        <div class="topic-viewer-toolbar">
          <div class="topic-viewer-header">
            <h3>Study Topics</h3>
            <span class="topic-counter">${isCheck ? "Knowledge check" : `Topic ${index + 1} of ${topics.length}`}</span>
          </div>
          <div class="topic-dots" role="tablist" aria-label="Topic navigation">
            ${Array.from({ length: steps }, (_, i) => i)
              .map(
                (i) =>
                  `<button class="topic-dot${i === index ? " active" : ""}${i < index ? " seen" : ""}" data-topic-index="${i}" title="${escapeAttr(dotTitle(i))}" type="button" role="tab" aria-selected="${i === index ? "true" : "false"}" aria-label="${escapeAttr(dotTitle(i))}"></button>`
              )
              .join("")}
          </div>
        </div>
        <div class="topic-slide" role="tabpanel">
          <div class="topic-title">${escapeHtml(isCheck ? "Knowledge check" : topic.title)}</div>
          <div class="topic-slide-body${isCheck ? " topic-slide-body--check" : ""}"${isCheck ? "" : ' tabindex="0" role="region" aria-label="Topic content"'}>
            ${isCheck ? window.SAPC02KnowledgeCheck.markup(moduleId, lessonId, nextLesson) : blocks.map(blockMarkup).join("")}
          </div>
        </div>
        <div class="topic-nav-bar">
          <button class="button" data-action="topic-prev" type="button"${index === 0 ? " disabled" : ""}>${icon("arrow-left")} Previous</button>
          <span class="progress-label">${index + 1} / ${steps}</span>
          <button class="button primary" data-action="topic-next" type="button"${index === steps - 1 ? " disabled" : ""}>${nextLabel} ${icon("arrow-right")}</button>
        </div>
      </section>
    `;
  }

  function enrichTopicBlocks(moduleId, lessonId, topic) {
    const blocks = [...(topic.blocks || [])];
    if (blocks.some((block) => block.type === "learn")) return blocks;
    const lessonLinks = (window.SAPC02_TOPIC_LEARN || {})[`${moduleId}:${lessonId}`] || {};
    const links = topic.isLastPage === false ? null : lessonLinks[topic.baseTitle || topic.title];
    if (links?.length) blocks.push({ type: "learn", links });
    return blocks;
  }

  function shouldIgnoreTopicHotkeys(event) {
    const tag = event.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.target?.isContentEditable) return true;
    return Boolean(event.ctrlKey || event.metaKey || event.altKey);
  }

  function blockMarkup(block) {
    if (!block) return "";
    if (block.type === "text") {
      return `<p class="topic-text">${richText(block.body)}</p>`;
    }
    if (block.type === "bullets") {
      return `<ul class="topic-bullets">${block.items.map((item) => `<li>${richText(item)}</li>`).join("")}</ul>`;
    }
    if (block.type === "steps") {
      return `<ol class="topic-steps">${block.items.map((item) => `<li>${richText(item)}</li>`).join("")}</ol>`;
    }
    if (block.type === "key") {
      return `<div class="topic-keybox"><strong>${escapeHtml(block.title || "Key point")}</strong>${richText(block.body)}</div>`;
    }
    if (block.type === "exam") {
      return `<div class="exam-tip"><strong>Exam tip</strong>${richText(block.body)}</div>`;
    }
    if (block.type === "code") {
      return `
        <div class="topic-code-toolbar"><span class="topic-code-label">${escapeHtml(block.label || "Example")}</span></div>
        <pre class="topic-code">${escapeHtml(block.body)}</pre>
      `;
    }
    if (block.type === "table") {
      return `
        <div class="topic-table-wrap" tabindex="0">
          <table class="topic-table">
            <thead><tr>${block.headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
            <tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${richText(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>
      `;
    }
    if (block.type === "learn") {
      return `
        <aside class="topic-learn">
          <strong>AWS documentation</strong>
          <ul>
            ${(block.links || [])
              .map(
                (link) =>
                  `<li><a href="${escapeUrl(link.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(link.label)}${NEW_TAB}</a></li>`
              )
              .join("")}
          </ul>
        </aside>
      `;
    }
    return "";
  }

  function richText(value) {
    return escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function listBlock(title, items) {
    if (!items || !items.length) return "";
    return `
      <section>
        ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
        <ul class="list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function search(query) {
    const needle = query.toLowerCase();
    const results = [];
    data.modules.forEach((module) => {
      const moduleText = `${module.title} ${module.domain} ${module.overview}`.toLowerCase();
      if (moduleText.includes(needle)) {
        results.push({ type: "Module", title: module.title, body: module.overview, moduleId: module.id });
      }
      module.lessons.forEach((lesson) => {
        const lessonText = `${lesson.title} ${lesson.summary} ${(lesson.objectives || []).join(" ")}`.toLowerCase();
        if (lessonText.includes(needle)) {
          results.push({ type: "Lesson", title: lesson.title, body: lesson.summary, moduleId: module.id, lessonId: lesson.id });
        }
      });
    });
    quizBankQuestions().slice(0, 400).forEach((question) => {
      if (question.question.toLowerCase().includes(needle)) {
        results.push({
          type: "Practice",
          title: `Question ${question.number || question.id}`,
          body: question.question,
          questionId: question.id,
          moduleId: question.moduleId,
        });
      }
    });
    return results.slice(0, 30);
  }

  function searchResult(result) {
    const action = result.lessonId
      ? `data-open-lesson="${escapeAttr(result.moduleId)}:${escapeAttr(result.lessonId)}"`
      : result.moduleId
        ? `data-module="${escapeAttr(result.moduleId)}"`
        : result.questionId
          ? `data-open-question="${escapeAttr(result.questionId)}"`
          : "";
    const link = result.href ? `<a class="button link" href="${escapeUrl(result.href)}" target="_blank" rel="noreferrer">Open</a>` : `<button class="button" ${action} type="button">Open</button>`;
    return `
      <article class="search-result">
        <div class="meta-line"><span>${escapeHtml(result.type)}</span></div>
        <h2>${escapeHtml(result.title)}</h2>
        <p>${escapeHtml(result.body || "")}</p>
        <div class="inline-actions" style="margin-top:12px">${link}</div>
      </article>
    `;
  }

  function onClick(event) {
    // Drawer toggle/scrim handled first so it works in every view, including
    // practice (where the quiz UI otherwise claims [data-action] clicks).
    const navControl = event.target.closest(
      '[data-action="toggle-nav"], [data-action="close-nav"]'
    );
    if (navControl) {
      setNav(navControl.getAttribute("data-action") === "toggle-nav" ? !isNavOpen() : false);
      return;
    }

    if (state.view === "practice" && window.SAPC02QuizUI) {
      const quizTarget = event.target.closest(
        "[data-action], [data-quiz-choice], [data-quiz-yn-slot]"
      );
      if (quizTarget) {
        const result = window.SAPC02QuizUI.onClick(quizTarget);
        if (result === "rerender") {
          render();
          return;
        }
        if (result) return;
      }
    }

    const target = event.target.closest("button, a, [data-module], [data-open-lesson], [data-action]");
    if (!target) return;

    // Picking any destination inside the drawer collapses it. Inert on desktop.
    if (target.closest(".sidebar")) setNav(false);

    if (target.matches("[data-view]")) {
      state.view = target.getAttribute("data-view");
      state.objectiveIndex = null;
      if (target.dataset.practiceFilter && window.SAPC02QuizUI?.setDomainFilter) {
        window.SAPC02QuizUI.setDomainFilter(target.dataset.practiceFilter);
      }
      clearSearch();
      persist();
      render();
      return;
    }

    if (target.matches("[data-module-section]")) {
      openModuleSection(target.getAttribute("data-module"), target.getAttribute("data-module-section"));
      return;
    }

    if (target.matches("[data-module-phase]")) {
      const phase = target.getAttribute("data-module-phase");
      openModuleSection(target.getAttribute("data-module"), PHASE_DEFAULT_SECTION[phase] || "topics");
      return;
    }

    if (target.matches("[data-module]")) {
      openModuleSection(target.getAttribute("data-module"), "topics");
      return;
    }

    const action = target.getAttribute("data-action");
    if (action === "show-domains") {
      state.view = "dashboard";
      state.objectiveIndex = null;
      clearSearch();
      persist();
      render();
      requestAnimationFrame(() => {
        document.querySelector(".domain-bars")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    if (action === "toggle-complete") {
      const [moduleId, lessonId] = target.getAttribute("data-lesson").split(":");
      const key = lessonKey(moduleId, lessonId);
      state.completed[key] = !state.completed[key];
      persist();
      render();
      return;
    } else if (action === "toggle-bookmark") {
      const [moduleId, lessonId] = target.getAttribute("data-lesson").split(":");
      const key = lessonKey(moduleId, lessonId);
      if (state.bookmarks[key]) delete state.bookmarks[key];
      else state.bookmarks[key] = Date.now();
      persist();
      render();
      return;
    } else if (action === "toggle-sidebar") {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      persist();
      applySidebarState();
      return;
    } else if (action === "reset-progress") {
      resetProgress();
      return;
    } else if (action === "export-progress") {
      downloadProgressBackup();
      return;
    } else if (action === "import-progress") {
      chooseProgressFile();
      return;
    } else if (action === "start-studying") {
      const [moduleId, lessonId] = target.getAttribute("data-lesson").split(":");
      openModuleSection(moduleId, "topics", lessonId);
      return;
    } else if (action === "flip-flashcard") {
      state.flashcardFlipped = !state.flashcardFlipped;
      persist();
      render();
      refocusFlashcard(action);
      return;
    } else if (action === "flashcard-prev") {
      state.flashcardIndex = Math.max(0, (state.flashcardIndex || 0) - 1);
      state.flashcardFlipped = false;
      persist();
      render();
      refocusFlashcard(action);
      return;
    } else if (action === "flashcard-next") {
      const module = modulesById.get(state.moduleId);
      const max = Math.max(0, collectFlashcards(module).length - 1);
      state.flashcardIndex = Math.min(max, (state.flashcardIndex || 0) + 1);
      state.flashcardFlipped = false;
      persist();
      render();
      refocusFlashcard(action);
      return;
    } else if (action === "topic-prev" || action === "topic-next") {
      // The Learn view can show the default first lesson while state.lessonId
      // is null, so resolve the active lesson the same way the renderer does
      // (otherwise the topic count is 0 and Next/Previous can't advance).
      const module = modulesById.get(state.moduleId);
      const lesson = module ? resolveLesson(module) : null;
      const content = lesson ? lessonContent(state.moduleId, lesson.id) : null;
      const maxTopic = Math.max(0, (lesson ? topicStepCount(state.moduleId, lesson.id, content) : 1) - 1);
      const delta = action === "topic-next" ? 1 : -1;
      state.topic = Math.min(maxTopic, Math.max(0, (state.topic || 0) + delta));
      persist();
      render();
      revealTopicViewer();
      return;
    } else if (action === "view-full-lesson") {
      const [moduleId, lessonId] = target.getAttribute("data-lesson").split(":");
      state.view = "module";
      state.moduleId = moduleId;
      state.lessonId = lessonId;
      state.moduleSection = "topics";
      state.objectiveIndex = null;
      clearSearch();
      persist();
      render();
      return;
    }

    if (target.matches("[data-lab]")) {
      state.labId = target.getAttribute("data-lab");
      persist();
      render();
      return;
    }

    if (target.matches("[data-open-lab]")) {
      const [moduleId, labId] = target.getAttribute("data-open-lab").split(":");
      state.view = "module";
      state.moduleId = moduleId;
      state.moduleSection = "labs";
      state.labId = labId;
      state.objectiveIndex = null;
      clearSearch();
      persist();
      render();
      return;
    }

    if (target.matches("[data-lab-task]")) {
      const [labId, idx] = target.getAttribute("data-lab-task").split(":");
      const map = state.labProgress[labId] || (state.labProgress[labId] = {});
      map[idx] = !map[idx];
      persist();
      render();
      return;
    }

    if (target.matches("[data-lab-check]")) {
      const raw = target.getAttribute("data-lab-check");
      const oi = raw.slice(raw.lastIndexOf(":") + 1);
      const key = raw.slice(0, raw.lastIndexOf(":"));
      if (!Number.isInteger(state.labChecks[key])) {
        state.labChecks[key] = Number(oi);
        persist();
        render();
      }
      return;
    }

    if (target.matches("[data-topic-index]")) {
      state.topic = Number(target.getAttribute("data-topic-index")) || 0;
      persist();
      render();
      revealTopicViewer();
      return;
    }

    if (target.matches("[data-objective]")) {
      const [moduleId, lessonId, objectiveIndex] = target.getAttribute("data-objective").split(":");
      state.view = "module";
      state.moduleId = moduleId;
      state.lessonId = lessonId;
      state.moduleSection = "scenarios";
      state.objectiveIndex = Number.parseInt(objectiveIndex, 10);
      state.topic = 0;
      clearSearch();
      persist();
      render();
      // Move focus to the selected scenario; re-rendering would otherwise drop it.
      elements.app.querySelector(".scenario-detail .objective-focus")?.focus();
      return;
    }

    if (target.matches("[data-lesson]")) {
      const [moduleId, lessonId] = target.getAttribute("data-lesson").split(":");
      state.view = "module";
      state.moduleId = moduleId;
      state.lessonId = lessonId;
      state.moduleSection = "topics";
      state.objectiveIndex = null;
      state.topic = 0;
      clearSearch();
      persist();
      render();
      return;
    }

    if (target.matches("[data-open-lesson]")) {
      const [moduleId, lessonId] = target.getAttribute("data-open-lesson").split(":");
      state.view = "module";
      state.moduleId = moduleId;
      state.lessonId = lessonId;
      state.moduleSection = "topics";
      state.objectiveIndex = null;
      state.topic = 0;
      clearSearch();
      persist();
      render();
      return;
    }

    if (target.matches("[data-open-question]")) {
      state.view = "practice";
      state.objectiveIndex = null;
      const qid = target.getAttribute("data-open-question");
      if (window.SAPC02QuizUI?.openQuestion) {
        window.SAPC02QuizUI.openQuestion(qid);
      }
      clearSearch();
      persist();
      render();
      return;
    }
  }

  function onInput(event) {
    if (event.target === elements.search) {
      render();
    }
  }

  function onChange(event) {
    if (state.view === "practice" && window.SAPC02QuizUI?.onChange(event) === "rerender") {
      render();
      return;
    }
  }

  function resolveLesson(module) {
    if (state.lessonId) {
      const found = module.lessons.find((lesson) => lesson.id === state.lessonId);
      if (found) return found;
    }
    return module.lessons[0];
  }

  function nextLesson() {
    for (const module of data.modules) {
      for (const lesson of module.lessons) {
        if (!isComplete(module.id, lesson.id)) {
          return { module, lesson };
        }
      }
    }
    return null;
  }

  function courseProgress() {
    const total = data.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const done = data.modules.reduce((sum, module) => sum + module.lessons.filter((lesson) => isComplete(module.id, lesson.id)).length, 0);
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  function moduleProgress(module) {
    const total = module.lessons.length;
    const done = module.lessons.filter((lesson) => isComplete(module.id, lesson.id)).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  function isComplete(moduleId, lessonId) {
    return Boolean(state.completed[lessonKey(moduleId, lessonId)]);
  }

  function lessonKey(moduleId, lessonId) {
    return `${moduleId}:${lessonId}`;
  }

  function bookmarkList() {
    return Object.keys(state.bookmarks)
      .map((key) => {
        const [moduleId, lessonId] = key.split(":");
        const module = modulesById.get(moduleId);
        const lesson = module?.lessons.find((item) => item.id === lessonId);
        return module && lesson ? { key, module, lesson } : null;
      })
      .filter(Boolean)
      .sort((a, b) => state.bookmarks[b.key] - state.bookmarks[a.key]);
  }

  function bookmarkPill(bookmark) {
    return `<button class="pill" data-open-lesson="${escapeAttr(bookmark.module.id)}:${escapeAttr(bookmark.lesson.id)}" type="button">${escapeHtml(bookmark.lesson.title)}</button>`;
  }

  function clearSearch() {
    if (elements.search.value) {
      elements.search.value = "";
    }
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

  // Only http(s) and relative URLs may reach href or src. Anything else
  // (javascript:, data:, vbscript:, ...) becomes an inert "#".
  function safeUrl(value) {
    const url = String(value ?? "").trim();
    if (/^https?:\/\//i.test(url) || !/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
    return "#";
  }

  function escapeUrl(value) {
    return escapeAttr(safeUrl(value));
  }
})();
