// @ts-check
// Keyboard-only journeys driven with real key presses in Chromium. Nothing
// here uses mouse clicks; every action is Tab, Shift+Tab, Enter, Space,
// arrow keys or Escape.
const { test, expect } = require("@playwright/test");

const APP = "/lms/index.html";
test.use({ reducedMotion: "reduce" });

async function seed(page, state) {
  await page.goto(APP);
  await page.evaluate(
    (s) => localStorage.setItem("sapc02-lms-state-v2", JSON.stringify({ schemaVersion: 2, state: { completed: {}, bookmarks: {}, ...s } })),
    state
  );
  await page.reload();
  await page.waitForLoadState("load");
}

/** Describes the focused element and whether it shows a visible focus indicator. */
function focusInfo(page) {
  return page.evaluate(async () => {
    // Let the 0.01ms reduced-motion transition settle so the ring is at full width.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const el = document.activeElement;
    if (!el || el === document.body) return { id: "body", visible: false, indicator: false };
    const cs = getComputedStyle(el);
    // The theme radios draw their ring on the wrapping label.
    const ringOn = el.matches(".theme-option input") ? el.parentElement : el;
    const ring = getComputedStyle(ringOn);
    const indicator = (ring.outlineStyle !== "none" && parseFloat(ring.outlineWidth) >= 2) || ring.boxShadow !== "none";
    const r = el.getBoundingClientRect();
    const name = el.getAttribute("aria-label") || el.textContent.trim().slice(0, 40) || el.getAttribute("value") || "";
    return {
      id: `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""} "${name}"`,
      visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden",
      indicator,
    };
  });
}

for (const width of [1440, 360]) {
  test(`Tab reaches every control with a visible focus ring and Shift+Tab walks back (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page, { view: "module", moduleId: "org-complexity", moduleSection: "topics" });

    const forward = [];
    for (let i = 0; i < 200; i++) {
      await page.keyboard.press("Tab");
      const info = await focusInfo(page);
      // Leaving the last control returns focus to the browser (document body).
      if (info.id === "body") break;
      forward.push(info);
      // Off-screen controls in the closed mobile drawer must not be reachable.
      expect(info.visible, `Tab stop ${i + 1} (${info.id}) is not visible`).toBe(true);
      expect(info.indicator, `Tab stop ${i + 1} (${info.id}) has no visible focus indicator`).toBe(true);
    }
    expect(forward.length, "too few Tab stops: controls are missing from the tab order").toBeGreaterThan(20);
    // From the end of the page, Shift+Tab walks the same stops in reverse.
    await page.keyboard.press("Shift+Tab");
    expect((await focusInfo(page)).id).toBe(forward[forward.length - 1].id);
    // Shift+Tab returns through the same stops in reverse: no traps, no skipped controls.
    for (let i = forward.length - 2; i >= 0; i--) {
      await page.keyboard.press("Shift+Tab");
      expect((await focusInfo(page)).id).toBe(forward[i].id);
    }
  });
}

test("sidebar toggle, chapter and activity selection work from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page, { view: "dashboard" });

  const toggle = page.locator(".sidebar-toggle");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  // Open chapter 2 from the dashboard card (role=button) with Enter.
  const card = page.locator('.chapter-card[data-module="org-complexity"]');
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#viewTitle")).toContainText(/organizational complexity/i);

  // Move to Labs in the activity bar with the keyboard.
  const labs = page.getByRole("navigation", { name: "Chapter activities" }).getByRole("button", { name: /^Labs/ });
  await labs.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Chapter activities" }).getByRole("button", { name: /^Labs/ })).toHaveAttribute("aria-current", "page");
});

test("scenarios: select with Enter, focus moves to the detail, Previous/Next work with Space", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page, { view: "module", moduleId: "org-complexity", moduleSection: "scenarios" });

  await page.locator(".scenario-objective").nth(1).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".scenario-detail .objective-focus")).toBeFocused();
  await expect(page.locator(".scenario-position")).toHaveText(/Scenario 2 of/);

  const next = page.getByRole("button", { name: "Next", exact: true });
  await next.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".scenario-position")).toHaveText(/Scenario 3 of/);
  const previous = page.getByRole("button", { name: "Previous", exact: true });
  await previous.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".scenario-position")).toHaveText(/Scenario 2 of/);
});

test("flashcards flip with Enter and Space and the card keeps focus", async ({ page }) => {
  await seed(page, { view: "module", moduleId: "org-complexity", moduleSection: "flashcards" });
  await page.locator(".flashcard").focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".flashcard")).toHaveClass(/flipped/);
  await expect(page.locator(".flashcard")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".flashcard")).not.toHaveClass(/flipped/);
});

test("practice: start, choose an answer and check it using only the keyboard", async ({ page }) => {
  await seed(page, { view: "practice" });
  await page.getByRole("button", { name: /Start Training/ }).focus();
  await page.keyboard.press("Enter");

  for (let i = 0; i < 25 && (await page.locator(".quiz-option").count()) === 0; i++) {
    await page.getByRole("button", { name: /^(Next|Skip)/ }).first().focus();
    await page.keyboard.press("Enter");
  }
  const options = page.locator(".quiz-option");
  const check = page.locator('[data-action="quiz-check"]');
  for (let i = 0; i < (await options.count()) && (await check.isDisabled()); i++) {
    await options.nth(i).focus();
    await page.keyboard.press("Space");
    await expect(options.nth(i)).toHaveAttribute("aria-pressed", "true");
  }
  await check.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".quiz-feedback")).toBeVisible();
});

test("mobile drawer: focus moves in, Tab stays usable, Escape closes and focus returns", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seed(page, { view: "dashboard" });
  const menu = page.locator(".nav-toggle");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const focusedInDrawer = await page.evaluate(() => Boolean(document.activeElement?.closest(".sidebar")));
  expect(focusedInDrawer).toBe(true);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect((await focusInfo(page)).indicator).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});
