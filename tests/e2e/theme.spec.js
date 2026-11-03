// @ts-check
const { test, expect } = require("@playwright/test");

const APP = "/lms/index.html";
const html = (page) => page.locator("html");

test("system preference is the default and follows the operating system", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(APP);
  await expect(html(page)).toHaveAttribute("data-theme-preference", "system");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "System" })).toBeChecked();

  // The OS switches while the page is open: system mode follows without a reload.
  await page.emulateMedia({ colorScheme: "light" });
  await expect(html(page)).toHaveAttribute("data-theme", "light");
});

test("choosing Dark persists across reloads and overrides the system setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(APP);
  await page.getByRole("radio", { name: "Dark" }).check();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("sapc02-theme"))).toBe("dark");

  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
  // An explicit choice ignores later OS changes.
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
});

test("the theme is applied before the stylesheets load, so there is no flash", async ({ page }) => {
  await page.goto(APP);
  const order = await page.evaluate(() =>
    [...document.head.children].map((el) => (el.tagName === "SCRIPT" ? "script:" + el.getAttribute("src") : el.tagName === "LINK" ? "link:" + el.getAttribute("rel") : el.tagName))
  );
  const init = order.findIndex((entry) => entry.startsWith("script:theme-init.js"));
  const firstStylesheet = order.findIndex((entry) => entry === "link:stylesheet");
  expect(init).toBeGreaterThanOrEqual(0);
  expect(init).toBeLessThan(firstStylesheet);
});

test("the theme control is a keyboard-operable radio group", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(APP);
  const group = page.getByRole("group", { name: "Theme" });
  await expect(group.getByRole("radio")).toHaveCount(3);

  await page.getByRole("radio", { name: "System" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "Light" })).toBeChecked();
  await expect(html(page)).toHaveAttribute("data-theme", "light");
});

test("Reset Progress keeps the theme preference", async ({ page }) => {
  await page.goto(APP);
  await page.getByRole("radio", { name: "Dark" }).check();
  let prompts = 0;
  page.on("dialog", async (dialog) => {
    prompts += 1;
    if (prompts === 1) await dialog.accept();
    else await dialog.dismiss();
  });
  const reloaded = page.waitForEvent("load");
  await page.getByRole("button", { name: "Reset Progress" }).first().click();
  await reloaded;
  expect(await page.evaluate(() => localStorage.getItem("sapc02-theme"))).toBe("dark");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
});

test("navigation chrome uses SVG icons, not emoji", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(APP);
  await page.evaluate(() =>
    localStorage.setItem(
      "sapc02-lms-state-v2",
      JSON.stringify({ schemaVersion: 2, state: { view: "module", moduleId: "org-complexity", moduleSection: "topics", completed: {}, bookmarks: {} } })
    )
  );
  await page.reload();

  const chrome = [".sidebar", ".topbar", ".module-phase-bar"];
  for (const selector of chrome) {
    const text = await page.locator(selector).first().innerText();
    expect(text, `${selector} contains emoji`).not.toMatch(/\p{Extended_Pictographic}/u);
  }
  await expect(page.locator(".module-phase-step svg.icon")).toHaveCount(6);
  await expect(page.locator(".nav-section-link svg.icon")).toHaveCount(6);
  // Icons are decorative; each control keeps its text label.
  const exposed = await page.locator("svg.icon:not([aria-hidden='true'])").count();
  expect(exposed).toBe(0);
});
