import { test, expect } from "@playwright/test";

test("homepage loads without crash", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBeLessThan(400);
  // Ensure no uncaught errors (check title is present)
  await expect(page).toHaveTitle(/.+/);
});

test("unauthenticated user is redirected away from /dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  // Should not be on /dashboard — redirected to login or onboarding
  await expect(page).not.toHaveURL(/\/dashboard/);
});
