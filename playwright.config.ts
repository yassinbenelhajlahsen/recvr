import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export default defineConfig({
  testDir: "./e2e",
  outputDir: "/tmp/playwright-results",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    // Unauthenticated project — smoke tests + auth flow tests
    {
      name: "chromium",
      testMatch: ["**/smoke.spec.ts", "**/auth.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    // Authenticated project — uses stored session from global-setup
    {
      name: "authenticated",
      testMatch: ["**/dashboard.spec.ts", "**/workout.spec.ts", "**/recovery.spec.ts", "**/progress.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "e2e/.auth/user.json"),
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
