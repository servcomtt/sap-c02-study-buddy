/* SAP-C02 Study Buddy — per-lesson knowledge check UI.
 * Data: window.SAPC02_KNOWLEDGE_CHECKS (knowledge-checks.js), keyed by "moduleId:lessonId".
 * Renders at the end of a lesson (app.js calls markup()) and handles its own
 * change/submit/retry events so the practice quiz and learner progress are untouched.
 * Answers live in memory only: a retry or page reload starts the check fresh.
 */
(function () {
  "use strict";

  const bank = () => window.SAPC02_KNOWLEDGE_CHECKS || {};
  // key -> { selected: { [questionId]: string[] }, submitted: boolean, missing: number }
  const sessions = new Map();

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const slug = (key) => key.replace(/[^a-z0-9]+/gi, "-");

  function questionsFor(key) {
    const list = bank()[key];
    return Array.isArray(list) ? list : [];
  }

  function session(key) {
    if (!sessions.has(key)) sessions.set(key, { selected: {}, submitted: false, missing: 0 });
    return sessions.get(key);
  }

  function isCorrect(question, selected) {
    const picked = [...(selected || [])].sort().join("");
    const expected = String(question.answer).split("").sort().join("");
    return picked === expected;
  }

  function score(key) {
    const s = session(key);
    return questionsFor(key).filter((q) => isCorrect(q, s.selected[q.id])).length;
  }

  function optionMarkup(key, question, option, index) {
    const s = session(key);
    const picked = (s.selected[question.id] || []).includes(option.key);
    const isAnswer = String(question.answer).includes(option.key);
    const inputType = question.type === "multi" ? "checkbox" : "radio";
    let state = "";
    let note = "";
    if (s.submitted) {
      if (isAnswer) {
        state = " is-answer";
        note = `<span class="kc-option-note">${picked ? "Your answer — correct" : "Correct answer"}</span>`;
      } else if (picked) {
        state = " is-wrong";
        note = `<span class="kc-option-note">Your answer — incorrect</span>`;
      }
    } else if (picked) {
      state = " selected";
    }
    const inputId = `kc-${slug(question.id)}-${index}`;
    return `
      <label class="kc-option${state}" for="${inputId}">
        <input id="${inputId}" type="${inputType}" name="${escapeHtml(question.id)}" value="${escapeHtml(option.key)}"${picked ? " checked" : ""}${s.submitted ? " disabled" : ""} data-kc-input="${escapeHtml(key)}">
        <span class="choice-key" aria-hidden="true">${escapeHtml(option.key)}</span>
        <span class="kc-option-text">${escapeHtml(option.text)}${note}</span>
      </label>
    `;
  }

  function feedbackMarkup(key, question) {
    const s = session(key);
    if (!s.submitted) return "";
    const correct = isCorrect(question, s.selected[question.id]);
    const ref = question.reference;
    return `
      <div class="kc-feedback ${correct ? "is-correct" : "is-incorrect"}">
        <strong>${correct ? "Correct." : `Incorrect. Correct answer: ${escapeHtml(String(question.answer).split("").join(", "))}.`}</strong>
        <p>${escapeHtml(question.explanation)}</p>
        ${ref && ref.url ? `<a href="${escapeHtml(ref.url)}" target="_blank" rel="noreferrer noopener">AWS documentation: ${escapeHtml(ref.label)}<span class="sr-only"> (opens in a new tab)</span></a>` : ""}
      </div>
    `;
  }

  function sectionInner(key, next) {
    const questions = questionsFor(key);
    const s = session(key);
    const total = questions.length;
    const points = score(key);
    const actions = s.submitted
      ? `
        <p class="kc-score" role="status" tabindex="-1">You answered ${points} of ${total} correctly.${points === total ? " Well done." : " Review the explanations, then retry."}</p>
        <div class="kc-buttons">
          <button class="button" type="button" data-kc-retry="${escapeHtml(key)}">Retry knowledge check</button>
          ${next ? `<button class="button primary" type="button" data-lesson="${escapeHtml(next.key)}">Continue: ${escapeHtml(next.title)}</button>` : ""}
        </div>
      `
      : `
        ${s.missing ? `<p class="kc-error" role="alert">Answer all questions before submitting (${s.missing} remaining).</p>` : ""}
        <div class="kc-buttons"><button class="button primary" type="submit">Submit answers</button></div>
      `;
    return `
      <header class="kc-header">
        <h3 id="kc-title-${slug(key)}">Knowledge Check</h3>
        <p class="section-lead">${total} question${total === 1 ? "" : "s"} on this lesson. Answers and explanations appear after you submit.</p>
      </header>
      <form class="kc-form" data-kc-form="${escapeHtml(key)}" novalidate>
        ${questions
          .map(
            (q, qi) => `
          <fieldset class="kc-question" data-kc-question="${escapeHtml(q.id)}">
            <legend><span class="kc-number">Question ${qi + 1} of ${total}</span>${escapeHtml(q.question)}${q.type === "multi" ? ' <span class="kc-hint">(Select all that apply.)</span>' : ""}</legend>
            <div class="kc-options">${q.options.map((o, oi) => optionMarkup(key, q, o, oi)).join("")}</div>
            ${feedbackMarkup(key, q)}
          </fieldset>`
          )
          .join("")}
        <div class="kc-actions">${actions}</div>
      </form>
    `;
  }

  function markup(moduleId, lessonId, next) {
    const key = `${moduleId}:${lessonId}`;
    if (!questionsFor(key).length) return "";
    return `<section class="card knowledge-check" aria-labelledby="kc-title-${slug(key)}" data-kc-section="${escapeHtml(key)}" data-kc-next="${escapeHtml(next ? JSON.stringify(next) : "")}">${sectionInner(key, next)}</section>`;
  }

  function rerender(key, focusSelector) {
    const section = document.querySelector(`[data-kc-section="${CSS.escape(key)}"]`);
    if (!section) return;
    const nextAttr = section.getAttribute("data-kc-next");
    const next = nextAttr ? JSON.parse(nextAttr) : null;
    section.innerHTML = sectionInner(key, next);
    const target = focusSelector && section.querySelector(focusSelector);
    if (target) target.focus();
  }

  document.addEventListener("change", (event) => {
    const input = event.target.closest && event.target.closest("[data-kc-input]");
    if (!input) return;
    const key = input.getAttribute("data-kc-input");
    const s = session(key);
    if (s.submitted) return;
    const form = input.form;
    s.selected[input.name] = [...form.querySelectorAll(`input[name="${CSS.escape(input.name)}"]:checked`)].map((el) => el.value);
    // Mirror the selection state on the labels without a full re-render, so keyboard focus stays put.
    form.querySelectorAll(`input[name="${CSS.escape(input.name)}"]`).forEach((el) => el.closest(".kc-option").classList.toggle("selected", el.checked));
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest && event.target.closest("[data-kc-form]");
    if (!form) return;
    event.preventDefault();
    const key = form.getAttribute("data-kc-form");
    const s = session(key);
    const unanswered = questionsFor(key).filter((q) => !(s.selected[q.id] || []).length);
    if (unanswered.length) {
      s.missing = unanswered.length;
      rerender(key, `[data-kc-question="${CSS.escape(unanswered[0].id)}"] input`);
      return;
    }
    s.missing = 0;
    s.submitted = true;
    rerender(key, ".kc-score");
  });

  document.addEventListener("click", (event) => {
    const retry = event.target.closest && event.target.closest("[data-kc-retry]");
    if (!retry) return;
    const key = retry.getAttribute("data-kc-retry");
    sessions.set(key, { selected: {}, submitted: false, missing: 0 });
    rerender(key, "input");
  });

  window.SAPC02KnowledgeCheck = { markup, isCorrect };
})();
