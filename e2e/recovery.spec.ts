import { test, expect } from "@playwright/test";

test.describe("Recovery page", () => {
  test("loads and shows front and back SVG body maps", async ({ page }) => {
    await page.goto("/recovery");

    // Page should load without redirect
    await expect(page).toHaveURL(/\/recovery/, { timeout: 10_000 });

    // Both SVG body maps should be present (front and back)
    const svgs = page.locator("svg");
    await expect(svgs.first()).toBeVisible({ timeout: 5_000 });

    // At least 2 SVGs expected (front + back body maps)
    const svgCount = await svgs.count();
    expect(svgCount).toBeGreaterThanOrEqual(2);
  });

  test("page title or heading is visible", async ({ page }) => {
    await page.goto("/recovery");
    // Some heading text should be visible
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 5_000 });
  });
});
