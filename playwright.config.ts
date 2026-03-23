import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export default defineConfig({
  testDir: "./e2e",
  outputDir: "/tmp/playwright-results",
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    // Setup — creates account, completes onboarding, saves session
    {
      name: "setup",
      testMatch: "**/setup.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    // Unauthenticated project — smoke tests + auth flow tests
    {
      name: "chromium",
      testMatch: ["**/smoke.spec.ts", "**/auth.spec.ts"],
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    // Authenticated project — uses stored session from setup
    {
      name: "authenticated",
      testMatch: ["**/dashboard.spec.ts", "**/workout.spec.ts", "**/recovery.spec.ts", "**/progress.spec.ts"],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "e2e/.auth/user.json"),
      },
    },
    // Teardown — deletes the test account
    {
      name: "teardown",
      testMatch: "**/teardown.spec.ts",
      dependencies: ["authenticated", "chromium"],
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
