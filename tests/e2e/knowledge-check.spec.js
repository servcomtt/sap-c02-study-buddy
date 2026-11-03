// @ts-check
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const APP = "/lms/index.html";
const LESSON = { moduleId: "org-complexity", lessonId: "network-connectivity" };
const KEY = `${LESSON.moduleId}:${LESSON.lessonId}`;

test.use({ reducedMotion: "reduce" });

/** Opens a lesson through saved state, then moves to its final topic where the knowledge check lives. */
async function openLesson(page, lesson = LESSON) {
  await openLessonAtStart(page, lesson);
  await page.locator("[data-topic-index]").last().click();
}

/** Opens a lesson through saved state, on its first topic. */
async function openLessonAtStart(page, lesson = LESSON) {
  await page.goto(APP);
  await page.evaluate(
    (l) =>
      localStorage.setItem(
        "sapc02-lms-state-v2",
        JSON.stringify({
          schemaVersion: 2,
          state: { view: "module", moduleId: l.moduleId, lessonId: l.lessonId, moduleSection: "topics", completed: {}, bookmarks: {} },
        })
      ),
    lesson
  );
  await page.reload();
  await page.waitForLoadState("load");
}

/** Selects every correct answer, using the knowledge-check data loaded in the page. */
async function answerAll(page, key, { correct }) {
  const questions = await page.evaluate((k) => window.SAPC02_KNOWLEDGE_CHECKS[k], key);
  for (const q of questions) {
    const fieldset = page.locator(`[data-kc-question="${q.id}"]`);
    const letters = correct ? q.answer.split("") : [q.options.map((o) => o.key).find((k) => !q.answer.includes(k))];
    for (const letter of letters) await fieldset.locator(`input[value="${letter}"]`).check();
  }
  return questions.length;
}

test("the knowledge check is hidden on earlier topics and shown only on the last one", async ({ page }) => {
  await openLessonAtStart(page);
  await expect(page.locator(`[data-kc-section="${KEY}"]`)).toHaveCount(0);
  const dots = page.locator("[data-topic-index]");
  await dots.nth((await dots.count()) - 2).click();
  await expect(page.locator(`[data-kc-section="${KEY}"]`)).toHaveCount(0);
  await dots.last().click();
  await expect(page.locator(`[data-kc-section="${KEY}"]`)).toBeVisible();
});

test("the knowledge check appears at the end of the lesson without revealing answers", async ({ page }) => {
  await openLesson(page);
  const section = page.locator(`[data-kc-section="${KEY}"]`);
  await expect(section.getByRole("heading", { name: "Knowledge Check" })).toBeVisible();
  await expect(section.locator(".kc-feedback")).toHaveCount(0);
  await expect(section.locator(".kc-option.is-answer")).toHaveCount(0);
});

test("submitting with unanswered questions shows an error and nothing is graded", async ({ page }) => {
  await openLesson(page);
  const section = page.locator(`[data-kc-section="${KEY}"]`);
  await section.getByRole("button", { name: "Submit answers" }).click();
  await expect(section.getByRole("alert")).toContainText("Answer all questions");
  await expect(section.locator(".kc-feedback")).toHaveCount(0);
});

test("correct answers score full marks with explanations and Learn links", async ({ page }) => {
  await openLesson(page);
  const section = page.locator(`[data-kc-section="${KEY}"]`);
  const total = await answerAll(page, KEY, { correct: true });
  await section.getByRole("button", { name: "Submit answers" }).click();
  await expect(section.locator(".kc-score")).toHaveText(new RegExp(`You answered ${total} of ${total} correctly`));
  await expect(section.locator(".kc-score")).toBeFocused();
  await expect(section.locator(".kc-feedback.is-correct")).toHaveCount(total);
  await expect(section.locator(".kc-feedback a").first()).toHaveAttribute("href", /^https:\/\/learn\.microsoft\.com\//);
  await expect(section.locator("input:not([disabled])")).toHaveCount(0);
});

test("wrong answers are marked incorrect and show the correct answer in text", async ({ page }) => {
  await openLesson(page);
  const section = page.locator(`[data-kc-section="${KEY}"]`);
  const total = await answerAll(page, KEY, { correct: false });
  await section.getByRole("button", { name: "Submit answers" }).click();
  await expect(section.locator(".kc-score")).toHaveText(new RegExp(`You answered 0 of ${total} correctly`));
  await expect(section.locator(".kc-feedback.is-incorrect").first()).toContainText("Correct answer:");
  await expect(section.locator(".kc-option.is-wrong").first()).toContainText("Your answer — incorrect");
});

test("retry clears answers and lets the learner answer again", async ({ page }) => {
  await openLesson(page);
  const section = page.locator(`[data-kc-section="${KEY}"]`);
  await answerAll(page, KEY, { correct: true });
  await section.getByRole("button", { name: "Submit answers" }).click();
  await section.getByRole("button", { name: "Retry knowledge check" }).click();
  await expect(section.locator(".kc-feedback")).toHaveCount(0);
  await expect(section.locator("input:checked")).toHaveCount(0);
  await expect(section.getByRole("button", { name: "Submit answers" })).toBeVisible();
  await expect(section.locator("input").first()).toBeFocused();
});

test("continue opens the next lesson in course order", async ({ page }) => {
  await openLesson(page);
  const section = page.locator(`[data-kc-section="${KEY}"]`);
  await answerAll(page, KEY, { correct: true });
  await section.getByRole("button", { name: "Submit answers" }).click();
  const nextKey = await page.evaluate((key) => {
    const all = window.SAPC02_LMS_DATA.modules.flatMap((m) => m.lessons.map((l) => `${m.id}:${l.id}`));
    return all[all.indexOf(key) + 1];
  }, KEY);
  await section.getByRole("button", { name: /^Continue:/ }).click();
  // The next lesson opens on its first topic; its knowledge check waits for the final topic.
  await page.locator("[data-topic-index]").last().click();
  await expect(page.locator(`[data-kc-section="${nextKey}"]`)).toBeVisible();
  await expect(page.locator(`[data-kc-section="${KEY}"]`)).toHaveCount(0);
});

test("knowledge checks don't change the practice quiz or learner progress", async ({ page }) => {
  await openLesson(page);
  const before = await page.evaluate(() => ({ quiz: localStorage.getItem("sapc02-quiz-state-v2"), count: window.SAPC02_QUIZ.questions.length }));
  const section = page.locator(`[data-kc-section="${KEY}"]`);
  await answerAll(page, KEY, { correct: true });
  await section.getByRole("button", { name: "Submit answers" }).click();
  const after = await page.evaluate(() => ({ quiz: localStorage.getItem("sapc02-quiz-state-v2"), count: window.SAPC02_QUIZ.questions.length }));
  expect(after).toEqual(before);
});

for (const width of [360, 1440]) {
  test(`knowledge check has no serious or critical axe findings at ${width}px, before and after submit`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openLesson(page);
    const scan = () =>
      new AxeBuilder({ page }).include(`[data-kc-section="${KEY}"]`).analyze();
    let results = await scan();
    expect(results.violations.filter((v) => ["serious", "critical"].includes(v.impact || ""))).toEqual([]);
    await answerAll(page, KEY, { correct: false });
    await page.locator(`[data-kc-section="${KEY}"]`).getByRole("button", { name: "Submit answers" }).click();
    results = await scan();
    expect(results.violations.filter((v) => ["serious", "critical"].includes(v.impact || ""))).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test("a saved practice session that includes a retired question resumes without it", async ({ page }) => {
  await page.goto(APP);
  await page.evaluate(() => {
    localStorage.setItem("sapc02-lms-state-v2", JSON.stringify({ schemaVersion: 2, state: { view: "practice", completed: {}, bookmarks: {} } }));
    localStorage.setItem(
      "sapc02-quiz-state-v2",
      JSON.stringify({
        schemaVersion: 2,
        state: { screen: "session", mode: "training", session: { ids: ["q700-retired-001", "q700-core-001"], index: 0, answers: {}, mode: "training", deadline: null }, record: {} },
      })
    );
  });
  await page.reload();
  await page.waitForLoadState("load");
  // q700-retired-001 no longer exists; the session continues on the remaining question.
  await expect(page.locator(".topic-counter")).toContainText("Question 1 / 1");
  await expect(page.locator(".pq-question, .quiz-card").first()).toContainText("deploying AWS Bastion");
});
