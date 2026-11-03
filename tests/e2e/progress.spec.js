// @ts-check
const { test, expect } = require("@playwright/test");

const APP = "/lms/index.html";
const LMS_V1 = "sapc02-lms-state-v1";
const LMS_V2 = "sapc02-lms-state-v2";
const QUIZ_V1 = "sapc02-quiz-state-v1";
const QUIZ_V2 = "sapc02-quiz-state-v2";

/** Collects uncaught page errors so a broken script fails the test. */
function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("app loads with no uncaught errors and the dashboard renders", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(APP);
  await expect(page.locator("#app")).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test("legacy v1 progress migrates to v2 and the v1 key is kept", async ({ page }) => {
  const errors = trackErrors(page);
  const legacy = { view: "dashboard", completed: { "orientation:intro": true }, bookmarks: {} };

  await page.goto(APP);
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [LMS_V1, legacy]
  );
  await page.reload();

  const result = await page.evaluate(
    ([v1, v2]) => ({
      v1: JSON.parse(localStorage.getItem(v1) || "null"),
      v2: JSON.parse(localStorage.getItem(v2) || "null"),
    }),
    [LMS_V1, LMS_V2]
  );
  expect(result.v1).toEqual(legacy);
  expect(result.v2.schemaVersion).toBe(2);
  expect(result.v2.state.completed).toEqual({ "orientation:intro": true });
  expect(errors).toEqual([]);
});

test("export downloads a valid backup document", async ({ page }) => {
  await page.goto(APP);
  await page.evaluate(
    ([key]) =>
      localStorage.setItem(
        key,
        JSON.stringify({ schemaVersion: 2, state: { completed: { "orientation:intro": true } } })
      ),
    [LMS_V2]
  );
  await page.reload();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export progress" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^sapc02-progress-\d{4}-\d{2}-\d{2}\.json$/);

  const path = await download.path();
  const doc = JSON.parse(require("node:fs").readFileSync(path, "utf8"));
  expect(doc.format).toBe("sapc02-study-progress");
  expect(doc.schemaVersion).toBe(2);
  expect(doc.sections.lms.completed).toEqual({ "orientation:intro": true });
});

test("a malformed import is rejected and existing progress is unchanged", async ({ page }) => {
  await page.goto(APP);
  await page.evaluate(
    ([key]) =>
      localStorage.setItem(key, JSON.stringify({ schemaVersion: 2, state: { completed: { keep: true } } })),
    [LMS_V2]
  );
  await page.reload();

  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import progress" }).click();
  (await chooser).setFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{not json") });

  await expect.poll(() => dialogs.length).toBeGreaterThan(0);
  expect(dialogs[0]).toContain("Import failed");

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), LMS_V2);
  expect(stored.state.completed).toEqual({ keep: true });
});

test("cancelling reset keeps all progress", async ({ page }) => {
  await page.goto(APP);
  await page.evaluate(
    ([lms, quiz]) => {
      localStorage.setItem(lms, JSON.stringify({ schemaVersion: 2, state: { completed: { keep: true } } }));
      localStorage.setItem(quiz, JSON.stringify({ schemaVersion: 2, state: { record: { q1: {} } } }));
    },
    [LMS_V2, QUIZ_V2]
  );
  await page.reload();

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Reset Progress" }).first().click();

  const stillThere = await page.evaluate(
    ([a, b]) => [localStorage.getItem(a) !== null, localStorage.getItem(b) !== null],
    [LMS_V2, QUIZ_V2]
  );
  expect(stillThere).toEqual([true, true]);
});

test("confirmed reset without backup removes learner keys only", async ({ page }) => {
  await page.goto(APP);
  await page.evaluate(
    ([lms, quiz]) => {
      localStorage.setItem(lms, JSON.stringify({ schemaVersion: 2, state: { completed: { x: true } } }));
      localStorage.setItem(quiz, JSON.stringify({ schemaVersion: 2, state: { record: { q1: {} } } }));
      localStorage.setItem("sapc02-labs-freshness", JSON.stringify({ commit: "abc" }));
    },
    [LMS_V2, QUIZ_V2]
  );
  await page.reload();

  let prompts = 0;
  page.on("dialog", async (dialog) => {
    prompts += 1;
    // First prompt: continue with reset. Second prompt: skip the backup.
    if (prompts === 1) await dialog.accept();
    else await dialog.dismiss();
  });
  // Reset reloads the page asynchronously; wait for that reload, not the current page.
  const reloaded = page.waitForEvent("load");
  await page.getByRole("button", { name: "Reset Progress" }).first().click();
  await reloaded;

  const after = await page.evaluate(
    ([a, b]) => ({
      lms: localStorage.getItem(a),
      quiz: localStorage.getItem(b),
      freshness: localStorage.getItem("sapc02-labs-freshness"),
    }),
    [LMS_V2, QUIZ_V2]
  );
  expect(after.lms).toBeNull();
  expect(after.quiz).toBeNull();
  expect(after.freshness).not.toBeNull();
});
