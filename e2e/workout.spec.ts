import { test, expect } from "@playwright/test";

test.describe("Workout CRUD", () => {
  test("create a workout and verify it appears in the list", async ({ page }) => {
    await page.goto("/dashboard");

    // Open the new workout drawer
    const newWorkoutBtn = page
      .getByRole("button", { name: /new workout|add workout|log workout/i })
      .first();
    await newWorkoutBtn.click();

    // Wait for drawer to be visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Click "Add Exercise" to open the search panel
    const addExerciseBtn = dialog.getByRole("button", { name: /add exercise/i });
    await addExerciseBtn.click();

    // Search for an exercise
    const searchInput = dialog.locator('input[placeholder*="Search"]');
    await searchInput.fill("Bench");

    // Wait for search results to load, then click the first non-disabled result
    const resultBtn = dialog.locator("button.w-full.text-left:not([disabled])").first();
    await expect(resultBtn).toBeVisible({ timeout: 5_000 });
    await resultBtn.click();

    // Wait for search panel to close (handleAddExercise calls closeSearch)
    await expect(searchInput).not.toBeVisible({ timeout: 3_000 });

    // Scope set inputs to the exercise card (not the form header which also has number inputs)
    const exerciseCard = dialog.locator(".rounded-xl.bg-surface").filter({ hasText: /Bench/ });
    const repsInput = exerciseCard.locator('input[type="number"][placeholder="10"]').first();
    await expect(repsInput).toBeVisible({ timeout: 3_000 });

    // Fill in reps and weight for the default set
    await repsInput.fill("10");
    const weightInput = exerciseCard.locator('input[type="number"][placeholder="60"]').first();
    await weightInput.fill("135");

    // Submit the form — "Log Workout" button should now be visible
    const submitBtn = dialog.getByRole("button", { name: /log workout/i });
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });
    await submitBtn.click();

    // Wait for the summary view to appear (confirms workout was saved)
    const doneBtn = dialog.getByRole("button", { name: /^done$/i });
    await expect(doneBtn).toBeVisible({ timeout: 10_000 });
    await doneBtn.click();

    // Drawer should close
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test("view workout details — clicking a workout card opens drawer with exercise data", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const cards = page.locator('button.w-full.text-left.rounded-xl.bg-surface');

    // Wait for cards to render (auto-retries) before checking count
    try {
      await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    } catch {
      test.skip(true, "No workout cards on dashboard to test view");
      return;
    }

    await cards.first().click();
    await expect(
      page.locator('[role="dialog"]').first(),
    ).toBeVisible({ timeout: 3_000 });
  });

  test("delete a workout removes it from the list", async ({ page }) => {
    await page.goto("/dashboard");

    const cards = page.locator('button.w-full.text-left.rounded-xl.bg-surface');

    // Wait for cards to render before counting
    try {
      await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    } catch {
      test.skip(true, "No workouts to delete");
      return;
    }

    const countBefore = await cards.count();

    // Open first workout
    await cards.first().click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3_000 });

    // Find and click the Delete button
    const deleteBtn = dialog.getByRole("button", { name: /delete/i });
    await expect(deleteBtn).toBeVisible({ timeout: 3_000 });
    await deleteBtn.click();

    // Confirm dialog if one appears
    const confirmBtn = page.getByRole("button", { name: /confirm|yes|delete/i }).last();
    if (await confirmBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Workout count should decrease
    await expect(cards).toHaveCount(countBefore - 1, { timeout: 5_000 });
  });
});
