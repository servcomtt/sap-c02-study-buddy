// @ts-check
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const APP = "/lms/index.html";

// Measure the settled page. Entrance animations and transitions are disabled
// by the reduced-motion preference, which the stylesheet honours.
test.use({ reducedMotion: "reduce" });

/** Opens a chapter section directly through saved state. */
async function openSection(page, section) {
  await page.evaluate(
    (name) =>
      localStorage.setItem(
        "sapc02-lms-state-v2",
        JSON.stringify({ schemaVersion: 2, state: { view: "module", moduleId: "org-complexity", moduleSection: name, completed: {}, bookmarks: {} } })
      ),
    section
  );
  await page.reload();
  await page.waitForLoadState("load");
}

// Widths from the repository standard (section 7).
const WIDTHS = [360, 768, 1024, 1440];

// Primary routes: dashboard, a module chapter, and the practice view.
const ROUTES = [
  { name: "dashboard", open: async () => {} },
  {
    name: "module",
    open: async (page) => {
      await page.getByRole("button", { name: /Ch 1|Orientation|Identity/i }).first().click();
    },
  },
  {
    name: "practice",
    open: async (page) => {
      await page.locator('.tab-button[data-view="practice"]').click();
    },
  },
  {
    name: "scenario detail",
    open: async (page) => {
      // Select the second scenario so the two-pane detail view is rendered.
      await page.evaluate(() =>
        localStorage.setItem(
          "sapc02-lms-state-v2",
          JSON.stringify({ schemaVersion: 2, state: { view: "module", moduleId: "org-complexity", moduleSection: "scenarios", completed: {}, bookmarks: {} } })
        )
      );
      await page.reload();
      await page.waitForLoadState("load");
      await page.locator(".scenario-objective").nth(1).click();
    },
  },
  ...["labs", "flashcards", "summary"].map((section) => ({
    name: section,
    open: async (page) => openSection(page, section),
  })),
  {
    name: "practice question",
    open: async (page) => {
      await page.locator('.tab-button[data-view="practice"]').click();
      await page.getByRole("button", { name: /Start Training/ }).first().click();
    },
  },
  {
    name: "lab with code block",
    open: async (page) => {
      await page.evaluate(() =>
        localStorage.setItem(
          "sapc02-lms-state-v2",
          JSON.stringify({ schemaVersion: 2, state: { view: "module", moduleId: "connectivity", moduleSection: "labs", labId: "lab-vnet-to-vnet-vpn", completed: {}, bookmarks: {} } })
        )
      );
      await page.reload();
      await page.waitForLoadState("load");
    },
  },
  {
    name: "answered practice question",
    open: async (page) => {
      await page.locator('.tab-button[data-view="practice"]').click();
      await page.getByRole("button", { name: /Start Training/ }).first().click();
      for (let i = 0; i < 25 && (await page.locator(".quiz-option").count()) === 0; i++) {
        await page.getByRole("button", { name: /Next|Skip/ }).first().click();
      }
      const options = page.locator(".quiz-option");
      const check = page.locator('[data-action="quiz-check"]');
      for (let i = 0; i < (await options.count()) && (await check.isDisabled()); i++) await options.nth(i).click();
      await check.click();
      await expect(page.locator(".quiz-feedback")).toBeVisible();
    },
  },
  {
    name: "collapsed sidebar",
    open: async (page) => {
      // The collapsed rail exists only on desktop; the drawer covers narrow widths.
      const toggle = page.locator(".sidebar-toggle");
      if (await toggle.isVisible()) await toggle.click();
    },
  },
];

// Both themes are checked: dark-theme colours are not assumed accessible.
const THEMES = ["light", "dark"];

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    for (const theme of THEMES) {
    test(`${route.name} at ${width}px in ${theme} theme has no serious or critical axe findings`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("sapc02-theme", value), theme);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(APP);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.waitForLoadState("load");
      await route.open(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();

      const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const summary = blocking.map((v) => `${v.impact}: ${v.id} (${v.nodes.length} node[s]) ${v.help}\n    at ${v.nodes.slice(0, 5).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });
    }

    test(`${route.name} at ${width}px has no horizontal page overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(APP);
      await page.waitForLoadState("load");
      await route.open(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `page overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    });
  }
}
