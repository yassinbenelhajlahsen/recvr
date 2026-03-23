import { test, expect } from "@playwright/test";

test("delete test account", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  // Open account menu
  await page.locator('button[aria-label="Open account menu"]').click();

  // Click Settings
  await page.getByText("Settings").click();

  // Wait for settings drawer
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  // Click "Delete account" (first click — enters confirmation state)
  await dialog.getByRole("button", { name: /delete account/i }).click();

  // Click "Confirm delete — this is permanent" (second click — actually deletes)
  await dialog
    .getByRole("button", { name: /confirm delete/i })
    .click();

  // Should redirect to sign-in page after deletion
  await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 15_000 });
});
