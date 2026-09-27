import { test, expect } from "@playwright/test";

test.describe("public user journey", () => {
  test("shows the landing page and lets a visitor reach login", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Log in" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /less waiting/i })).toBeVisible();

    await page.getByRole("link", { name: "Log in" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome!" })).toBeVisible();
  });

  test("requires a phone number and password before login", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Please fill in all fields.")).toBeVisible();
  });

  test("redirects unauthenticated visitors from protected pages", async ({ page }) => {
    await page.goto("/patient");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome!" })).toBeVisible();
  });
});
