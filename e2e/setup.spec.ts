import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth", "user.json");

test("create account and complete onboarding", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not configured");
    return;
  }

  // --- Sign up ---
  await page.goto("/auth/signup");

  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirm").fill(password);
  await page.locator("button[type=submit]").click();

  // Race: either we navigate (signup success) or an error appears (account exists)
  const outcome = await Promise.race([
    page
      .waitForURL(/\/(onboarding|dashboard)/, { timeout: 20_000 })
      .then(() => "navigated" as const),
    page
      .locator(".text-danger")
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "error" as const),
  ]);

  // If account already exists, fall back to sign-in
  if (outcome === "error") {
    await page.goto("/auth/signin");
    await page.locator("[type=email]").fill(email);
    await page.locator("[type=password]").fill(password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 15_000 });
  }

  // --- Complete onboarding if needed ---
  if (page.url().includes("/onboarding")) {
    // Step 0: Name
    await page.locator("#onboarding-name").fill("E2E Test");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 1: Gender — skip
    await page.getByRole("button", { name: "Skip" }).click();

    // Step 2: Body Metrics — skip
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3: Goals — finish
    await page.getByRole("button", { name: "Get started" }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  }

  await expect(page).toHaveURL(/\/dashboard/);

  // Save authenticated session
  await page.context().storageState({ path: authFile });
});
