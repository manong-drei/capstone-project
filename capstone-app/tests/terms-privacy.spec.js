import { test, expect } from "@playwright/test";

for (const width of [320, 1024]) {
  test(`terms language toggles preserve consent requirements at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto("/login");
    const openTerms = page.getByRole("button", { name: "terms and conditions", exact: true });
    await openTerms.click();
    const dialog = page.getByRole("dialog");
    const content = dialog.getByRole("region");
    const checkbox = dialog.getByRole("checkbox");
    await expect(dialog).toHaveAttribute("lang", "en");
    await expect(dialog.getByRole("img", { name: "Bago City Primary Care Facility" })).toBeVisible();
    await expect(dialog.getByRole("img", { name: "E-Kalusugan", exact: true })).toBeVisible();
    await expect(dialog.locator("svg")).toHaveCount(0);
    await expect(dialog).not.toContainText(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}✕]/u);

    for (const [language, code, heading, consent, accept] of [
      ["English", "en", "Terms & Conditions", "I have read and fully understood", "Accept & Continue"],
      ["Pilipino", "fil", "Mga Tuntunin at Kondisyon", "Nabasa ko at lubos kong naunawaan", "Tanggapin at Magpatuloy"],
      ["Hiligaynon", "hil", "Mga Patakaran kag Kondisyon", "Nabasa ko kag bug-os nga naintiendihan", "Batunon kag Magpadayon"],
    ]) {
      await dialog.getByRole("button", { name: language, exact: true }).click();
      await expect(dialog).toHaveAttribute("lang", code);
      await expect(dialog.getByRole("button", { name: language, exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(dialog.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(dialog.getByRole("heading", { level: 3 })).toHaveCount(3);
      await expect(checkbox).toBeDisabled();
      await expect(checkbox).not.toBeChecked();
      expect(await content.evaluate(el => el.scrollTop)).toBe(0);
      await expect(dialog.getByRole("button").last()).toBeDisabled();
      await expect(dialog.getByText(consent, { exact: false })).toBeVisible();

      await content.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await expect(checkbox).toBeEnabled();
      await checkbox.check();
      await expect(dialog.getByRole("button", { name: accept, exact: true })).toBeEnabled();
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const bounds = await dialog.boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(780);
    }

    await dialog.getByRole("button", { name: "Siraduhon", exact: true }).click();
    await expect(dialog).toBeHidden();
    await openTerms.click();
    await expect(checkbox).toBeDisabled();
    await expect(checkbox).not.toBeChecked();
    await dialog.getByRole("button", { name: "Kanselahon", exact: true }).click();
    await expect(dialog).toBeHidden();
    await openTerms.click();
    await content.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await expect(checkbox).toBeEnabled();
    await checkbox.check();
    await dialog.getByRole("button", { name: "Batunon kag Magpadayon", exact: true }).click();
    await expect(dialog).toBeHidden();
  });
}
