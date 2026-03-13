import { test, expect } from "@playwright/test";

// These tests run in the unauthenticated project
test.describe("Authentication", () => {
  test("valid credentials redirect to /dashboard", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not configured");
      return;
    }

    await page.goto("/auth/signin");
    await page.locator("[type=email]").fill(email);
    await page.locator("[type=password]").fill(password);
    await page.locator("button[type=submit]").click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("wrong password shows error and stays on login page", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL ?? "test@recvr.dev";

    await page.goto("/auth/signin");
    await page.locator("[type=email]").fill(email);
    await page.locator("[type=password]").fill("definitely-wrong-password-xyz-123");
    await page.locator("button[type=submit]").click();

    // Should remain on signin page
    await expect(page).toHaveURL(/\/auth\/signin/);
    // Error message visible (any text in the danger text element)
    await expect(page.locator(".text-danger")).toBeVisible({ timeout: 5_000 });
  });
});
