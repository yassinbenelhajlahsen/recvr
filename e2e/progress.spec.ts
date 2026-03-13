import { test, expect } from "@playwright/test";

test.describe("Progress page", () => {
  test("loads and shows exercise selector", async ({ page }) => {
    await page.goto("/progress");

    // Page should load without redirect
    await expect(page).toHaveURL(/\/progress/, { timeout: 10_000 });

    // Exercise selector should be present (a select/combobox or button)
    const selector = page
      .locator('select, [role="combobox"], [role="listbox"], button[aria-haspopup]')
      .first();
    await expect(selector).toBeVisible({ timeout: 5_000 });
  });

  test("page does not crash and renders layout", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/progress");
    await expect(page).toHaveURL(/\/progress/, { timeout: 10_000 });

    expect(errors).toHaveLength(0);
  });
});
