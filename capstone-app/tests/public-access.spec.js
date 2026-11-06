import { test, expect } from "@playwright/test";

test.describe("public user journey", () => {
  test("shows the landing page and lets a visitor reach login", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto("/");

    const header = page.getByRole("banner");
    const brand = header.getByRole("link", { name: /Bago City.*E-Kalusugan home/i });
    await expect(brand.getByRole("img", { name: "Bago City Primary Care Facility seal" })).toBeVisible();
    await expect(brand.getByRole("img", { name: "E-Kalusugan" })).toBeVisible();
    const nav = header.getByRole("navigation", { name: "Main navigation" });
    await expect(nav.getByRole("link")).toHaveText(["Patient Portal"]);
    await expect(header.getByRole("button")).toHaveCount(0);
    const brandBounds = await brand.boundingBox();
    expect(brandBounds.x + brandBounds.width).toBeLessThan((await nav.boundingBox()).x);
    await expect(page.getByRole("heading", { name: /dental care for the people of bago/i })).toBeVisible();

    for (const [label, title] of [
      ["Explore dental services", "Dental Services"],
      ["Oral Health", "Oral Health"],
      ["Plan your visit", "Visit the Clinic"],
    ]) {
      const button = page.getByRole("button", { name: label, exact: true });
      await button.click();
      const dialog = page.getByRole("dialog", { name: title });
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(button).toBeFocused();
    }

    await nav.getByRole("link", { name: "Patient Portal" }).click();
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

for (const width of [320, 390, 768, 1440]) {
  test(`dental landing page supports the ticket journey at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ body: "", contentType: "text/css" }));
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const ticketLink = page.locator(".cinematic-intro").getByRole("link", { name: "Get a queue ticket" });
    await expect(ticketLink).toBeInViewport();
    expect((await ticketLink.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await page.getByRole("link", { name: "How it works", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Your dental visit starts here." })).toBeInViewport();
    await expect(page.locator(".cinematic-steps > li")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "SMS notifications", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Check dentist availability", exact: true })).toBeVisible();
    const sample = page.getByRole("img", { name: /Sample dental queue ticket AQ07/ });
    await sample.scrollIntoViewIfNeeded();
    await expect.poll(() => sample.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    const faq = page.locator("details").filter({ hasText: "Will I always receive an SMS?" });
    await faq.locator("summary").click();
    await expect(faq.getByText(/Messages can be delayed/)).toBeVisible();
    await faq.locator("summary").press("Enter");
    await expect(faq).not.toHaveAttribute("open", "");
    await page.getByRole("button", { name: "Find the clinic" }).click();
    const dialog = page.getByRole("dialog", { name: "Visit the Clinic" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("button", { name: "Find the clinic" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`landing-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
    await page.locator("#get-started").getByRole("link", { name: "Get a queue ticket" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
}
