import { chromium } from "@playwright/test";
import path from "path";

export default async function globalSetup() {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    console.warn(
      "[global-setup] E2E_TEST_EMAIL or E2E_TEST_PASSWORD not set — skipping auth setup.",
    );
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/auth/signin");

  // Fill email and password using the FloatingInput type=email / type=password inputs
  await page.locator('[type=email]').fill(email);
  await page.locator('[type=password]').fill(password);

  // Submit the sign-in form
  await page.locator('button[type=submit]').click();

  // Wait until redirected to /dashboard (onboarding must be completed for test user)
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

  const authFile = path.join(__dirname, ".auth", "user.json");
  await context.storageState({ path: authFile });

  await browser.close();
}
