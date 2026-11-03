// @ts-check
const { test, expect } = require("@playwright/test");

const APP = "/lms/index.html";
const LMS_V2 = "sapc02-lms-state-v2";

/** Opens the app with a saved learner state, then reloads so it is read. */
async function openWithState(page, state) {
  await page.goto(APP);
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [LMS_V2, { schemaVersion: 2, state: { completed: {}, bookmarks: {}, ...state } }]
  );
  await page.reload();
  await page.waitForLoadState("load");
}

const STORAGE_STATE = { view: "module", moduleId: "org-complexity", moduleSection: "scenarios" };

test.describe("collapsible sidebar", () => {
  test("collapse and expand update aria-expanded, the layout class, and the label", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, STORAGE_STATE);

    const toggle = page.locator(".sidebar-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Expand sidebar");
    await expect(page.locator(".app-shell")).toHaveClass(/sidebar-collapsed/);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".app-shell")).not.toHaveClass(/sidebar-collapsed/);
  });

  test("collapsed items keep accessible names and tooltips", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, STORAGE_STATE);
    await page.locator(".sidebar-toggle").click();

    // The label is visually hidden, but the button still has a name for screen readers.
    const dashboard = page.locator(".overview-link", { hasText: "Dashboard" });
    await expect(dashboard).toHaveAttribute("title", "Dashboard");
    await expect(dashboard).toHaveAccessibleName("Dashboard");

    const scenarios = page.locator(".nav-section-link", { hasText: "Scenarios" }).first();
    await expect(scenarios).toHaveAccessibleName(/Scenarios/);
    await expect(scenarios).toBeVisible();
  });

  test("the sidebar preference survives a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, STORAGE_STATE);
    await page.locator(".sidebar-toggle").click();
    await page.reload();
    await page.waitForLoadState("load");
    await expect(page.locator(".app-shell")).toHaveClass(/sidebar-collapsed/);
    await expect(page.locator(".sidebar-toggle")).toHaveAttribute("aria-expanded", "false");
  });

  test("the drawer closes with its close button and with Escape, and focus returns to the menu button", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await openWithState(page, STORAGE_STATE);

    const open = page.getByRole("button", { name: "Open navigation menu" });
    await open.click();
    await expect(page.locator(".app-shell")).toHaveClass(/nav-open/);
    await expect(page.locator(".sidebar-close")).toBeFocused();

    await page.locator(".sidebar-close").click();
    await expect(page.locator(".app-shell")).not.toHaveClass(/nav-open/);
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();

    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".app-shell")).not.toHaveClass(/nav-open/);
  });
});

test.describe("scenario navigation", () => {
  test("the list stays visible, the selected scenario is highlighted, and Previous/Next move through the chapter", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, STORAGE_STATE);

    const items = page.locator(".scenario-objective");
    const total = await items.count();
    expect(total).toBeGreaterThan(2);

    await items.nth(0).click();
    await expect(items).toHaveCount(total);
    await expect(items.nth(0)).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.locator(".scenario-position")).toHaveText(`Scenario 2 of ${total}`);
    await expect(items.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(items.nth(0)).not.toHaveAttribute("aria-current", "true");

    await items.nth(total - 1).click();
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  });

  test("the selected scenario is restored after a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, STORAGE_STATE);
    await page.locator(".scenario-objective").nth(3).click();
    await page.reload();
    await page.waitForLoadState("load");
    await expect(page.locator(".scenario-position")).toHaveText(/Scenario 4 of/);
  });

  test("scenario navigation works with the sidebar collapsed", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, { ...STORAGE_STATE, sidebarCollapsed: true });
    await page.locator(".scenario-objective").nth(1).click();
    await expect(page.locator(".scenario-position")).toHaveText(/Scenario 2 of/);
    await page.getByRole("button", { name: "All scenarios" }).click();
    await expect(page.locator(".scenario-step-bar")).toHaveCount(0);
  });

  test("learner progress survives scenario navigation and sidebar changes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, { ...STORAGE_STATE, completed: { "org-complexity:network-connectivity": true } });
    await page.locator(".scenario-objective").nth(2).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.locator(".sidebar-toggle").click();

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), LMS_V2);
    expect(stored.state.completed).toEqual({ "org-complexity:network-connectivity": true });
  });

  test("every scenario in the storage chapter opens its own content", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openWithState(page, STORAGE_STATE);

    const count = await page.locator(".scenario-objective").count();
    for (let i = 0; i < count; i++) {
      const expected = (await page.locator(".scenario-objective .scenario-text").nth(i).innerText()).trim();
      await page.locator(".scenario-objective").nth(i).click();
      await expect(page.locator(".scenario-position")).toHaveText(`Scenario ${i + 1} of ${count}`);
      await expect(page.locator(".objective-focus h2")).toHaveText(expected);
    }
  });
});
