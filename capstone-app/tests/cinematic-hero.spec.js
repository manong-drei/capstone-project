import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ body: "", contentType: "text/css" }));
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }]) {
  test(`desktop hero reveals, reverses and releases the page at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    const intro = page.locator(".cinematic-intro");
    const card = page.locator(".cinematic-card");
    await expect(page.locator(".pin-spacer")).toHaveCount(1);
    await expect(intro).toHaveCSS("opacity", "1");

    await page.evaluate(() => {
      const spacer = document.querySelector(".pin-spacer");
      const stage = document.querySelector(".cinematic-stage");
      window.scrollTo(0, (spacer.offsetHeight - stage.offsetHeight) * 0.9);
    });
    await expect(intro).toHaveCSS("opacity", "0");
    await expect(page.locator(".cinematic-card-copy").first()).toHaveCSS("opacity", "1");
    await expect(page.locator(".cinematic-badge").last()).toHaveCSS("opacity", "1");
    await expect(page.locator(".cinematic-phone")).toBeInViewport({ ratio: 1 });
    await expect.poll(async () => (await card.boundingBox()).y).toBeCloseTo(88, 0);

    await page.locator("#features").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /small details/i })).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(intro).toHaveCSS("opacity", "1");
    await expect.poll(async () => (await card.boundingBox()).y).toBeGreaterThan(viewport.height);

    await page.getByRole("link", { name: "Log in", exact: true }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await page.goBack();
    await expect(page.locator(".pin-spacer")).toHaveCount(1);
  });
}

for (const { viewport, reducedMotion } of [
  { viewport: { width: 375, height: 812 }, reducedMotion: "no-preference" },
  { viewport: { width: 1440, height: 650 }, reducedMotion: "no-preference" },
  { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" },
]) {
  test(`hero stays readable without pinning at ${viewport.width}x${viewport.height}, motion ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /less waiting/i })).toBeVisible();
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await page.locator(".cinematic-phone-wrap").scrollIntoViewIfNeeded();
    await expect(page.locator(".cinematic-phone-wrap")).toHaveCSS("opacity", "1");
    await expect(page.locator(".cinematic-phone")).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
