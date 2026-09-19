// Run with the Vite dev server on port 3000: node tests/experimental-landing.cjs
const assert = require("node:assert/strict");
const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const url = "http://127.0.0.1:3000/";

  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 1024, height: 700 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(url);
      await page.getByRole("heading", { name: "Less waiting. More living." }).waitFor();
      assert.equal(await page.locator("#features article").count(), 6);
      assert(await page.locator(".cinematic-intro").evaluate((element) => getComputedStyle(element).backgroundImage.includes("BGHero.webp")));
      const preview = page.locator(".cinematic-patient-preview");
      assert(await preview.evaluate((element) => element.inert), "Preview controls must stay inactive");
      assert((await preview.textContent()).includes("Your Health, Schedule."));
      assert.equal(await preview.locator('[aria-label="Live queue status"]').count(), 1);
      assert.equal(await preview.locator("button").first().evaluate((element) => { element.focus(); return document.activeElement === element; }), false);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Horizontal overflow");
      const animated = viewport.width >= 1024 && viewport.height >= 700;
      assert.equal(await page.locator(".pin-spacer").count(), animated ? 1 : 0);
      if (animated) {
        await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector(".cinematic-card-copy")).opacity) > 0.99);
      } else {
        await page.locator(".cinematic-card").scrollIntoViewIfNeeded();
      }
      const card = await page.locator(".cinematic-card").boundingBox();
      const phone = await page.locator(".cinematic-phone").boundingBox();
      assert(phone.x >= card.x && phone.x + phone.width <= card.x + card.width, "Phone clipped horizontally");
      assert(phone.y >= card.y && phone.y + phone.height <= card.y + card.height, "Phone clipped vertically");
      await page.getByRole("link", { name: "Schedule your visit" }).click();
      await page.waitForURL("**/login");
      await page.locator(".cinematic-stage").waitFor({ state: "detached" });
      assert.equal(await page.locator(".pin-spacer").count(), 0, "Animation did not clean up");
      console.log(`PASS ${viewport.width}×${viewport.height}: layout, queue preview, CTA, cleanup`);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url);
    await page.locator(".cinematic-card").waitFor();
    assert.equal(await page.locator(".pin-spacer").count(), 0);
    assert.equal(await page.locator(".cinematic-card-copy").first().evaluate((element) => getComputedStyle(element).opacity), "1");
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").textContent(), "Skip to content");
    await page.getByRole("link", { name: "E-KALUSUGAN home", exact: true }).click();
    await page.waitForURL("http://127.0.0.1:3000/");
    await page.getByRole("heading", { name: "Less waiting. More living." }).waitFor();
    await page.goto(`${url}experimental`);
    await page.waitForURL(url);
    await page.getByRole("heading", { name: "Less waiting. More living." }).waitFor();
    assert.deepEqual(errors, [], "Browser runtime errors");
    console.log("PASS reduced motion, keyboard entry, homepage promotion, preview redirect, no runtime errors");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
