// @ts-check
const { test, expect } = require("@playwright/test");

const APP = "/lms/index.html";
const LMS_V2 = "sapc02-lms-state-v2";

async function openSection(page, section, extra = {}) {
  await page.goto(APP);
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [LMS_V2, { schemaVersion: 2, state: { view: "module", moduleId: "org-complexity", moduleSection: section, completed: {}, bookmarks: {}, ...extra } }]
  );
  await page.reload();
  await page.waitForLoadState("load");
}

const ACTIVITIES = [
  ["Topics", ".lesson-panel"],
  ["Scenarios", ".scenario-objective"],
  ["Labs", ".lab-nav-button"],
  ["Flashcards", ".flashcard"],
  ["Practice", ".module-quiz-panel"],
  ["Summary", ".exam-objectives-panel"],
];

for (const width of [360, 1440]) {
  test(`all six chapter activities are reachable from the activity bar at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openSection(page, "topics");

    const bar = page.getByRole("navigation", { name: "Chapter activities" });
    await expect(bar.getByRole("button")).toHaveCount(6);

    for (const [label, marker] of ACTIVITIES) {
      await bar.getByRole("button", { name: new RegExp(`^${label}`) }).click();
      await expect(page.locator(marker).first()).toBeVisible();
      await expect(bar.getByRole("button", { name: new RegExp(`^${label}`) })).toHaveAttribute("aria-current", "page");
      await expect(bar.locator('[aria-current="page"]')).toHaveCount(1);
    }
  });
}

test("code blocks get a copy button that copies the block text unchanged", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Lab 09a is one of the two labs whose instructions contain a code block.
  await openSection(page, "labs", { moduleId: "connectivity", labId: "lab-vnet-to-vnet-vpn" });

  const block = page.locator(".code-block").first();
  await expect(block).toBeVisible();
  const original = await block.locator("pre").textContent();

  await block.getByRole("button", { name: "Copy code to clipboard" }).click();
  await expect(block.locator(".code-copy")).toHaveText("Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(original);
  // The button lives beside the pre, so the copied text never includes "Copy".
  expect(copied).not.toContain("Copied");
});

test("flashcards label each face and keep focus on the card after flipping", async ({ page }) => {
  await openSection(page, "flashcards");

  const card = page.locator(".flashcard");
  await expect(card.locator(".flashcard-front .flashcard-side")).toHaveText("Term");
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".flashcard")).toHaveClass(/flipped/);
  await expect(page.locator(".flashcard")).toBeFocused();
  await expect(page.locator("#flashcardHint")).toContainText("Showing the key point");

  await page.getByRole("button", { name: "Next Card" }).click();
  await expect(page.locator(".flashcard-meta")).toContainText("Card 2 of");
  await expect(page.getByRole("button", { name: "Next Card" })).toBeFocused();
});

test("practice options expose their selected state to assistive technology", async ({ page }) => {
  await page.goto(APP);
  await page.locator('.tab-button[data-view="practice"]').click();
  await page.getByRole("button", { name: /Start Training/ }).first().click();

  // Advance to the first question that uses text choices (some use exhibits instead).
  for (let i = 0; i < 25 && (await page.locator(".quiz-option").count()) === 0; i++) {
    await page.getByRole("button", { name: /Next|Skip/ }).first().click();
  }
  const option = page.locator(".quiz-option").first();
  await expect(option).toHaveAttribute("aria-pressed", "false");
  await option.click();
  await expect(page.locator(".quiz-option").first()).toHaveAttribute("aria-pressed", "true");
});

test("on a 360px phone the view switch and theme control share one row", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(APP);
  const dashboard = await page.locator('.tab-button[data-view="dashboard"]').boundingBox();
  const practice = await page.locator('.tab-button[data-view="practice"]').boundingBox();
  const theme = await page.locator(".theme-switch").boundingBox();
  expect(Math.abs(dashboard.y - practice.y)).toBeLessThan(2);
  expect(Math.abs(dashboard.y - theme.y)).toBeLessThan(4);
});

test("completed lessons say so in text, not only with colour", async ({ page }) => {
  await openSection(page, "topics", { completed: { "org-complexity:network-connectivity": true } });
  const done = page.locator(".lesson-button.done").first();
  await expect(done).toContainText("Completed");
  await expect(done.locator("svg.icon")).toHaveAttribute("aria-hidden", "true");
});

// Labs are authored for this app, so the credit must say so honestly and the
// app must not call the GitHub API or link to a GitHub lab repository.
test("labs are credited as authored, with no repository link or API calls", async ({ page }) => {
  const apiCalls = [];
  page.on("request", (request) => {
    if (request.url().includes("api.github.com")) apiCalls.push(request.url());
  });
  await openSection(page, "labs");
  const note = page.locator(".lab-sync-note");
  await expect(note).toContainText("Labs are authored for this study app from AWS documentation documentation");
  await expect(note).toContainText("not AWS's official labs");
  await expect(page.locator("main")).not.toContainText(/View on GitHub|Repo synced|build_labs_data|AWSLearning/);
  await page.waitForTimeout(500);
  expect(apiCalls).toEqual([]);
});
