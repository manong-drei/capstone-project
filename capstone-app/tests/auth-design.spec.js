import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

for (const width of [375, 1024, 1440]) {
  for (const passwordPage of [false, true]) {
    test(`${passwordPage ? "password change" : "login"} layout and controls at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ body: "", contentType: "text/css" }));
      if (passwordPage) {
        const user = { user_id: 8, role: "patient" };
        await page.addInitScript(({ user, token }) => {
          sessionStorage.setItem("ek_user", JSON.stringify(user));
          sessionStorage.setItem("ek_token", token);
        }, { user, token: createTestToken(user) });
      }
      await page.goto(passwordPage ? "/patient/profile/change-password" : "/login");
      await expect(page.getByRole("heading", { name: passwordPage ? "Change Your Password" : "Welcome!", exact: true })).toBeVisible();
      const form = page.locator(".auth-form-panel");
      const story = page.locator(".auth-story");
      const formBox = await form.boundingBox();
      const storyBox = await story.boundingBox();
      if (width > 900) {
        expect(formBox.x).toBeGreaterThan(storyBox.x + storyBox.width);
        await expect(page.getByRole("img", { name: /sample dental queue ticket/ })).toBeVisible();
      } else {
        expect(formBox.y).toBeGreaterThanOrEqual(storyBox.y + storyBox.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.getByRole("button", { name: passwordPage ? "Update Password" : "Login", exact: true }).click();
      await expect(page.getByRole("alert")).toHaveText("Please fill in all fields.");
      const password = page.getByLabel(passwordPage ? "New Password" : "Password", { exact: true });
      await password.fill("Example123");
      await page.getByRole("button", { name: passwordPage ? "Show new password" : "Show password", exact: true }).click();
      await expect(password).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: passwordPage ? "Hide new password" : "Hide password", exact: true }).click();
      await expect(password).toHaveAttribute("type", "password");
      await page.screenshot({ path: testInfo.outputPath("auth-page.png"), fullPage: true });
    });
  }
}
