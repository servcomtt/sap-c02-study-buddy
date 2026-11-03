// @ts-check
// The verified bank must be optional: ?bank=0 (or a missing file)
// leaves exactly the committed bank. When present, imported questions are
// clearly labelled and show their audit note after answering.
const { test, expect } = require("@playwright/test");

test.use({ reducedMotion: "reduce" });

test("?bank=0 shows only the committed bank", async ({ page }) => {
  await page.goto("/lms/index.html?bank=0");
  await page.evaluate(() => localStorage.setItem("sapc02-lms-state-v2", JSON.stringify({ schemaVersion: 2, state: { view: "practice", completed: {}, bookmarks: {} } })));
  await page.reload();
  expect(await page.evaluate(() => (window.SAPC02_QUIZ_PRIVATE ? window.SAPC02_QUIZ_PRIVATE.questions.length : 0))).toBe(0);
  await expect(page.locator("main")).toContainText("90");
});

async function openPrivate(page, id) {
  await page.goto("/lms/index.html");
  await page.evaluate((qid) => {
    localStorage.setItem("sapc02-lms-state-v2", JSON.stringify({ schemaVersion: 2, state: { view: "practice", completed: {}, bookmarks: {} } }));
    localStorage.setItem("sapc02-quiz-state-v2", JSON.stringify({ schemaVersion: 2, state: { screen: "session", mode: "training", session: { ids: [qid], index: 0, answers: {}, mode: "training", deadline: null }, record: {} } }));
  }, id);
  await page.reload();
}
const privateQuestion = (page, pred) => page.evaluate((src) => {
  const f = new Function("q", `return ${src}`);
  return window.SAPC02_QUIZ_PRIVATE ? window.SAPC02_QUIZ_PRIVATE.questions.find((q) => f(q)) || null : null;
}, pred);

test("verified-bank choice question is labelled, graded and shows Learn proof", async ({ page }) => {
  await page.goto("/lms/index.html");
  const first = await privateQuestion(page, "(q.qtype === 'mcq' || q.qtype === 'multi') && q.proof && q.proof.claims.length");
  test.skip(!first, "no bank file");
  await openPrivate(page, first.id);
  await expect(page.locator(".pq-meta")).toContainText("Verified bank");
  await expect(page.locator(".pq-meta")).toContainText("AWS documentation");
  const options = page.locator(".quiz-option");
  for (const k of first.answer) await options.nth(first.options.findIndex((o) => o.key === k)).click();
  await page.locator('[data-action="quiz-check"]').click();
  await expect(page.locator(".quiz-feedback")).toContainText(/correct/i);
  await expect(page.locator(".quiz-feedback.wrong")).toHaveCount(0);
  await expect(page.locator(".pq-proof")).toBeVisible();
  await page.locator(".pq-proof summary").click();
  await expect(page.locator(".pq-proof .pq-proof-ev a").first()).toHaveAttribute("href", /^https:\/\/learn\.microsoft\.com\//);
  await expect(page.locator(".pq-proof .pq-claim").first()).toContainText(/Documented fact|Reasoning|Limitation/);
});

test("verified-bank dropdown (per-field options) question grades correctly", async ({ page }) => {
  await page.goto("/lms/index.html");
  const q = await privateQuestion(page, "q.interactive && q.interactive.kind === 'match' && q.interactive.targets.every((t) => t.options)");
  test.skip(!q, "no bank file");
  await openPrivate(page, q.id);
  await expect(page.locator('[data-action="quiz-check"]')).toBeDisabled();
  const selects = page.locator("select.pq-order-select");
  await expect(selects).toHaveCount(q.interactive.targets.length);
  for (let i = 0; i < q.answer.length; i++) await selects.nth(i).selectOption(q.answer[i]);
  await page.locator('[data-action="quiz-check"]').click();
  await expect(page.locator(".quiz-feedback")).toContainText(/correct/i);
  await expect(page.locator(".pq-match-row.wrong")).toHaveCount(0);
});

test("a wrong dropdown answer is marked wrong", async ({ page }) => {
  await page.goto("/lms/index.html");
  const q = await privateQuestion(page, "q.interactive && q.interactive.kind === 'match' && q.interactive.targets.every((t) => t.options && t.options.length > 1)");
  test.skip(!q, "no bank file");
  await openPrivate(page, q.id);
  const selects = page.locator("select.pq-order-select");
  for (let i = 0; i < q.answer.length; i++) {
    const wrong = q.interactive.targets[i].options.find((o) => o.key !== q.answer[i]).key;
    await selects.nth(i).selectOption(wrong);
  }
  await page.locator('[data-action="quiz-check"]').click();
  await expect(page.locator(".quiz-feedback.wrong")).toBeVisible();
});

test("case-study questions show their background and exhibits load", async ({ page }) => {
  await page.goto("/lms/index.html");
  const q = await privateQuestion(page, "q.context && q.context.images.length");
  test.skip(!q, "no bank file");
  await openPrivate(page, q.id);
  await expect(page.locator(".pq-context")).toBeVisible();
  const img = page.locator(".pq-context img").first();
  await expect(img).toBeVisible();
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth), { timeout: 10000 }).toBeGreaterThan(0);
});

test("no PDF answer or community-vote text reaches the page", async ({ page }) => {
  await page.goto("/lms/index.html");
  const leaked = await page.evaluate(() => (window.SAPC02_QUIZ_PRIVATE ? JSON.stringify(window.SAPC02_QUIZ_PRIVATE).match(/Correct Answer:|Community vote/) : null));
  expect(leaked).toBeNull();
});
