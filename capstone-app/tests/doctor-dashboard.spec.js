import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockDoctor(page) {
  const user = { user_id: 4, role: "doctor", display_name: "Dr. Maria Santos" };
  const state = {
    queues: [
      { id: 1, category: "dental", queue_number: "AP02", status: "serving", type: "priority", full_name: "Elena Cruz" },
      { id: 2, category: "dental", queue_number: "AQ03", status: "waiting", type: "regular", full_name: "Miguel Reyes" },
      { id: 3, category: "dental", queue_number: "P04", status: "waiting", type: "priority", full_name: "Rosa Garcia" },
      { id: 4, category: "dental", queue_number: "AQ01", status: "done", type: "regular", full_name: "Luis Mendoza", services: ["Dental Check-up"], updated_at: "2026-11-04T09:05:00+08:00", has_consultation: 0 },
      { id: 5, category: "dental", queue_number: "Q01", status: "done", type: "regular", full_name: "Carla Ramos", services: ["Oral Prophylaxis"], updated_at: "2026-11-04T08:42:00+08:00", has_consultation: 1 },
      { id: 6, category: "general", queue_number: "G01", status: "waiting", full_name: "Excluded General Patient" },
    ],
    settings: { appointment_limit: 10, walk_in_limit: 5, booked_count: 8, walkin_count: 3, is_available: 1 },
    writes: [],
  };
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
  }, { user, token: createTestToken(user) });
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const write = request.method() !== "GET";
    const data = write ? request.postDataJSON() : null;
    if (write) state.writes.push({ path, data });
    let body = {};
    if (path === "/api/auth/profile") body = { data: user };
    else if (path === "/api/queue") body = state.queues;
    else if (path === "/api/doctor/daily-settings") {
      if (write) Object.assign(state.settings, data);
      body = state.settings;
    } else if (path === "/api/doctor/consultations") {
      Object.assign(state.queues.find(queue => queue.id === data.queue_id), { status: "done", has_consultation: 1 });
      body = { success: true };
    } else if (/^\/api\/queue\/\d+\/status$/.test(path)) {
      const queue = state.queues.find(queue => queue.id === Number(path.split("/")[3]));
      Object.assign(queue, data); body = queue;
    } else if (path === "/api/doctor/leave-requests") body = { requests: [] };
    await route.fulfill({ json: body });
  });
  return state;
}

test("the doctor banner renders while queue data is still loading", async ({ page }) => {
  await mockDoctor(page);
  const { promise, resolve } = Promise.withResolvers();
  await page.route("**/api/queue", async (route) => {
    await promise;
    await route.fallback();
  });
  try {
    await page.goto("/doctor");
    await expect(page.getByRole("heading", { name: "Welcome, Dr. Maria Santos." })).toBeVisible();
    await expect(page.getByText("Checking availability…")).toBeVisible();
    await expect(page.getByRole("region", { name: "Dental queue", exact: true })).toHaveCount(0);
  } finally {
    resolve();
  }
  await expect(page.getByRole("region", { name: "Dental queue", exact: true })).toContainText("AP02");
});

for (const width of [320, 375, 641, 768, 1024, 1440]) {
  test(`doctor dashboard and consultation fit at ${width}px and save the existing payload`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await mockDoctor(page);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && message.text().startsWith("fetchDailySettings error:")) errors.push(message.text());
    });
    await page.goto("/doctor");
    await expect(page.getByRole("heading", { name: "Welcome, Dr. Maria Santos." })).toBeVisible();
    const fontStylesheet = page.locator('link[rel="stylesheet"][href^="https://fonts.googleapis.com/"]');
    await expect(fontStylesheet).toHaveAttribute("media", "(min-width: 64rem)");
    expect(await fontStylesheet.evaluate(link => matchMedia(link.media).matches)).toBe(width >= 1024);
    await expect(page.locator('head link[rel="preload"][as="image"][href="/assets/BGHero.webp"]'))
      .toHaveAttribute("fetchpriority", "high");
    const queue = page.getByRole("region", { name: "Dental queue", exact: true });
    const upcoming = page.getByRole("region", { name: "Up next", exact: true });
    await expect(queue).toContainText("AP02");
    await expect(upcoming.getByRole("listitem")).toHaveText([/AQ03.*Miguel Reyes/, /P04.*Rosa Garcia/]);
    await expect(page.getByText("Excluded General Patient")).toHaveCount(0);
    const capacity = page.getByRole("region", { name: "Daily capacity", exact: true });
    await expect(capacity.getByRole("progressbar", { name: "Appointment capacity used" })).toHaveAttribute("value", "80");
    await expect(capacity.getByRole("progressbar", { name: "Walk-in capacity used" })).toHaveAttribute("value", "60");
    const queueBox = await queue.boundingBox();
    const capacityBox = await capacity.boundingBox();
    if (width >= 1024) expect(capacityBox.x).toBeGreaterThan(queueBox.x + queueBox.width);
    else expect(capacityBox.y).toBeGreaterThan(queueBox.y + queueBox.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if ([375, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`doctor-dashboard-${width}.png`), fullPage: true });

    await queue.getByRole("button", { name: "Consult", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Consultation Notes", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Elena Cruz");
    await expect(dialog.getByRole("button", { name: "Save Consultation" })).toBeDisabled();
    await dialog.getByLabel("Consultation Notes", { exact: false }).fill("   ");
    await expect(dialog.getByRole("button", { name: "Save Consultation" })).toBeDisabled();
    await dialog.getByLabel("Consultation Notes", { exact: false }).fill("Chief complaint and findings");
    await dialog.getByLabel("Diagnosis", { exact: true }).fill("Assessment");
    await dialog.getByLabel("Prescription / Recommendations", { exact: true }).fill("Follow-up instructions");
    expect(await dialog.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if ([375, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`doctor-consultation-${width}.png`) });
    await dialog.getByRole("button", { name: "Save Consultation" }).click();
    await expect(dialog).toHaveCount(0);
    expect(state.writes).toEqual([{ path: "/api/doctor/consultations", data: { queue_id: 1, notes: "Chief complaint and findings", diagnosis: "Assessment", prescription: "Follow-up instructions" } }]);
    await expect(queue.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
    expect(errors).toEqual([]);
  });
}

test("mobile menu, availability, capacity warning, and completion actions still work", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const state = await mockDoctor(page);
  await page.goto("/doctor");
  const menu = page.getByRole("button", { name: "Toggle menu" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Leave Requests", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Patient History", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/doctor\/patient-history$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  const requestLeave = page.getByRole("region", { name: "Today's availability", exact: true }).getByRole("button", { name: "Request leave", exact: true });
  await requestLeave.click();
  const leave = page.getByRole("dialog", { name: "Leave Requests", exact: true });
  await expect(leave).toBeVisible();
  await expect(page).toHaveURL(/\/doctor\/leave-requests$/);
  await leave.getByRole("button", { name: "Close leave requests", exact: true }).click();
  await expect(requestLeave).toBeFocused();
  await page.getByRole("button", { name: "Available", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unavailable", exact: true })).toBeEnabled();
  expect(state.settings.is_available).toBe(0);

  const capacity = page.getByRole("region", { name: "Daily capacity", exact: true });
  await capacity.getByRole("button", { name: /Daily capacity/ }).click();
  await expect(page.getByLabel("Appointment Limit", { exact: true })).toHaveCount(0);
  await capacity.getByRole("button", { name: /Daily capacity/ }).click();
  await page.getByLabel("Appointment Limit", { exact: true }).fill("5");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  const warning = page.getByRole("dialog", { name: "Lower Appointment Limit?" });
  await expect(warning).toContainText("8 appointments booked today");
  await warning.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Appointment Limit", { exact: true })).toHaveValue("10");
  await page.getByLabel("Appointment Limit", { exact: true }).fill("5");
  await page.getByLabel("Walk-In Capacity", { exact: true }).fill("40");
  await expect(page.getByLabel("Walk-In Capacity", { exact: true })).toHaveValue("30");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await warning.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved ✓", exact: true })).toBeVisible();
  expect(state.settings.appointment_limit).toBe(5);
  expect(state.settings.walk_in_limit).toBe(30);
  await page.getByRole("button", { name: "Mark as Complete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
  expect(state.queues[0].status).toBe("done");
  await page.getByRole("button", { name: "Add notes for AQ01", exact: true }).click();
  const notes = page.getByRole("dialog", { name: "Consultation Notes", exact: true });
  await expect(notes).toContainText("Luis Mendoza");
  await page.keyboard.press("Escape");
  await expect(notes).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add notes for AQ01", exact: true })).toBeFocused();
});
