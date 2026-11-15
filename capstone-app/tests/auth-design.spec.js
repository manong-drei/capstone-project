import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

for (const [width, height] of [[320, 568], [320, 701], [375, 667], [375, 900], [568, 320], [844, 390], [1024, 650], [1366, 768], [1440, 900]]) {
  for (const passwordPage of [false, true]) {
    test(`${passwordPage ? "password change" : "login"} layout and controls at ${width}x${height}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height });
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
      const compactLogin = !passwordPage && (width <= 900 || height <= 500);
      if (compactLogin) await expect(story).toBeHidden();
      else await expect(story).toBeVisible();
      const formBox = await form.boundingBox();
      const storyBox = await story.boundingBox();
      if (width > 900 && !compactLogin) {
        expect(formBox.x).toBeGreaterThan(storyBox.x + storyBox.width);
        await expect(page.getByRole("img", { name: /sample dental queue ticket/ })).toBeVisible();
      } else if (!compactLogin) {
        expect(formBox.y).toBeGreaterThanOrEqual(storyBox.y + storyBox.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const shell = await page.locator(".auth-shell").boundingBox();
      expect(formBox.y).toBeGreaterThanOrEqual(shell.y);
      expect(formBox.y + formBox.height).toBeLessThanOrEqual(shell.y + shell.height);
      const footer = page.locator(".auth-form-footer");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeInViewport();
      await page.getByRole("button", { name: passwordPage ? "Update Password" : "Login", exact: true }).click();
      await expect(page.getByRole("alert")).toHaveText("Please fill in all fields.");
      if (!passwordPage) {
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
        for (const control of [
          page.getByLabel("Phone Number", { exact: true }),
          page.getByLabel("Password", { exact: true }),
          page.getByRole("button", { name: "Forgot password?", exact: true }),
          page.getByRole("button", { name: "Login", exact: true }),
          page.locator(".auth-terms"),
        ]) {
          const bounds = await control.boundingBox();
          expect(bounds.y).toBeGreaterThanOrEqual(0);
          expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
        }
      }
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
