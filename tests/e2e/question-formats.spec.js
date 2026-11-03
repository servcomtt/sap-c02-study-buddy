// @ts-check
// Every practice format is graded automatically: single, multi-select, Yes/No
// tables, matching rows, ordering and select-N. Correct answers must mark
// correct, wrong answers must mark wrong, and a multi-select needs ALL keys.
const { test, expect } = require("@playwright/test");

const APP = "/lms/index.html";
test.use({ reducedMotion: "reduce" });

async function openQuestion(page, id) {
  await page.goto(APP);
  await page.evaluate((qid) => {
    localStorage.setItem("sapc02-lms-state-v2", JSON.stringify({ schemaVersion: 2, state: { view: "practice", completed: {}, bookmarks: {} } }));
    localStorage.setItem(
      "sapc02-quiz-state-v2",
      JSON.stringify({ schemaVersion: 2, state: { screen: "session", mode: "training", session: { ids: [qid], index: 0, answers: {}, mode: "training", deadline: null }, record: {} } })
    );
  }, id);
  await page.reload();
  await page.waitForLoadState("load");
}

const check = (page) => page.locator('[data-action="quiz-check"]');

test("no format is presented as a drag-and-drop simulator", async ({ page }) => {
  await openQuestion(page, "q700-core-006");
  await expect(page.locator(".pq-meta")).not.toContainText(/drag/i);
  await expect(page.locator(".pq-meta")).toContainText("Put in order");
});

test("yes/no table: correct answers are graded correct", async ({ page }) => {
  await openQuestion(page, "q700-core-003"); // YNY
  await expect(check(page)).toBeDisabled();
  for (const [slot, value] of [["0", "Y"], ["1", "N"], ["2", "Y"]]) {
    await page.locator(`[data-quiz-yn-slot="${slot}"][data-quiz-yn-value="${value}"]`).click();
  }
  await check(page).click();
  await expect(page.locator(".quiz-feedback")).toContainText(/correct/i);
  await expect(page.locator(".pq-match-row.wrong")).toHaveCount(0);
});

test("yes/no table: a wrong answer is graded wrong and the key is shown", async ({ page }) => {
  await openQuestion(page, "q700-core-003");
  for (const [slot, value] of [["0", "N"], ["1", "N"], ["2", "Y"]]) {
    await page.locator(`[data-quiz-yn-slot="${slot}"][data-quiz-yn-value="${value}"]`).click();
  }
  await check(page).click();
  await expect(page.locator(".pq-match-row.wrong")).toHaveCount(1);
  await expect(page.locator(".quiz-feedback")).toContainText(/incorrect|not quite|wrong/i);
});

test("matching, ordering and select-N grade from the answer key", async ({ page }) => {
  for (const [id, key] of [["q700-core-004", "CBAD"], ["q700-core-006", "CBAD"], ["q700-core-010", "BD"]]) {
    await openQuestion(page, id);
    const selects = page.locator("select[data-quiz-slot]");
    const n = await selects.count();
    expect(n).toBe(key.length);
    for (let i = 0; i < n; i++) await selects.nth(i).selectOption(key[i]);
    await check(page).click();
    await expect(page.locator(".quiz-feedback")).toContainText(/correct/i);
    await expect(page.locator(".pq-match-row.wrong, .pq-order-row.wrong")).toHaveCount(0);
  }
});

test("select-N accepts the right items in any order", async ({ page }) => {
  await openQuestion(page, "q700-core-010"); // BD
  const selects = page.locator("select[data-quiz-slot]");
  await selects.nth(0).selectOption("D");
  await selects.nth(1).selectOption("B");
  await check(page).click();
  await expect(page.locator(".pq-order-row.wrong")).toHaveCount(0);
});

test("multi-select needs every correct option: one of two is wrong", async ({ page }) => {
  await openQuestion(page, "q700-core-007"); // AD
  const options = page.locator(".quiz-option");
  await options.nth(0).click(); // A only
  await options.nth(2).click(); // C (wrong)
  await check(page).click();
  await expect(page.locator(".quiz-feedback")).toBeVisible();
  await expect(page.locator(".quiz-option.wrong")).toHaveCount(1);
  await expect(page.locator(".quiz-option.correct")).toHaveCount(2);
});

test("multi-select with all correct options is graded correct", async ({ page }) => {
  await openQuestion(page, "q700-core-007"); // AD
  const options = page.locator(".quiz-option");
  await options.nth(0).click();
  await options.nth(3).click();
  await check(page).click();
  await expect(page.locator(".quiz-option.wrong")).toHaveCount(0);
  await expect(page.locator(".quiz-feedback")).toContainText(/correct/i);
});

test("feedback shows the explanation and a Learn reference that opens in a new tab", async ({ page }) => {
  await openQuestion(page, "q700-core-001"); // B
  await page.locator(".quiz-option").nth(1).click();
  await check(page).click();
  await expect(page.locator(".quiz-feedback")).toContainText(/\S{20,}/);
  await expect(page.locator(".quiz-feedback .pq-ref a")).toContainText("opens in a new tab");
  await expect(page.locator(".quiz-feedback .pq-ref a")).toHaveAttribute("href", /^https:\/\/learn\.microsoft\.com\//);
});

test("resume survives a retired question id and a changed answer key", async ({ page }) => {
  await page.goto(APP);
  await page.evaluate(() => {
    localStorage.setItem("sapc02-lms-state-v2", JSON.stringify({ schemaVersion: 2, state: { view: "practice", completed: {}, bookmarks: {} } }));
    localStorage.setItem(
      "sapc02-quiz-state-v2",
      JSON.stringify({
        schemaVersion: 2,
        state: {
          screen: "session",
          mode: "training",
          session: { ids: ["q700-retired-999", "q700-core-001"], index: 0, answers: { "q700-core-001": { selected: ["A"], checked: true, correct: true } }, mode: "training", deadline: null },
          record: {},
        },
      })
    );
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await page.waitForLoadState("load");
  await expect(page.locator(".pq-meta")).toBeVisible();
  expect(errors).toEqual([]);
  // The stored "correct: true" for A is stale (the key is B); the app regrades.
  await expect(page.locator(".quiz-option.correct")).toHaveCount(1);
  await expect(page.locator(".quiz-option.wrong")).toHaveCount(1);
});
