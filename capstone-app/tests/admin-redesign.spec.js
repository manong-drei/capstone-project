import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";
import { selectAdminSection } from "./helpers/admin";

test.use({ colorScheme: "dark", timezoneId: "Asia/Manila" });

async function setup(page) {
  const user = { user_id: 8, role: "admin", display_name: "Test Admin" };
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
  }, { user, token: createTestToken(user) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const responses = {
    "/api/auth/profile": { data: user },
    "/api/admin/overview": { totalPatients: 1284, totalDoctors: 2, totalAppointments: 186, completedQueues: 1098, waiting: 2, serving: 1, doneToday: 24, cancelled: 3, dentalAgeGroups: [{ age_group: "5–9 years", count: 20 }, { age_group: "20–59 years", count: 10 }, { age_group: "Unknown", count: 25 }], volumeDaily: [{ day, count: 23 }] },
    "/api/doctor": { data: [{ doctor_id: 7, first_name: "Ana", last_name: "Reyes", is_available: 1 }] },
    "/api/admin/doctor-leaves": { requests: [{ id: 9, doctor_name: "Ana Reyes", start_date: "2026-12-09", end_date: "2026-12-10", status: "pending" }] },
    "/api/admin/sms-jobs": { jobs: [{ id: 1, queue_id: 11, state: "failed", is_failed: 1, purpose: "queue_alert", masked_recipient: "*******6789", attempts: 1, created_at: "2026-11-05T01:00:00Z", updated_at: "2026-11-05T01:00:00Z" }] },
    "/api/admin/sms-settings": { data: { threshold: 5 } },
    "/api/queue": [
      { id: 1, category: "dental", queue_number: "AP02", full_name: "Elena Cruz", status: "serving", type: "priority" },
      { id: 2, category: "dental", queue_number: "AQ03", full_name: "Miguel Reyes", status: "waiting", type: "regular" },
    ],
    "/api/appointments": { data: [{ appointment_id: 1, patient_full_name: "Maria Santos", appointment_date: day, appointment_time: "09:00:00", doctor_first_name: "Ana", doctor_last_name: "Reyes", reason: "Dental check-up", status: "completed" }], summary: { total: 1, completed: 1 }, pagination: { page: 1, total: 1, totalPages: 1 } },
    "/api/admin/staff": { staff: [] },
    "/api/admin/patients": { patients: [], pagination: { page: 1, total: 0, totalPages: 1 } },
    "/api/admin/audit-logs": { events: [], pagination: { page: 1, total: 0, totalPages: 1 } },
    "/api/admin/bohc-forecast": { forecasts: [], history: [] },
  };
  await page.route("**/api/**", route => route.fulfill({ json: responses[new URL(route.request().url()).pathname] ?? {} }));
  return responses;
}

test("View shows only failed SMS and reviewing each job clears its dashboard count", async ({ page }) => {
  const responses = await setup(page);
  const jobs = responses["/api/admin/sms-jobs"].jobs;
  jobs.push(
    { ...jobs[0], id: 2, queue_id: 12, state: "submitted", provider_status: "refunded" },
    { ...jobs[0], id: 3, queue_id: 13, state: "submitted", provider_status: "sent", is_failed: 0 },
  );
  await page.route("**/api/admin/sms-jobs/*/review", route => {
    expect(route.request().method()).toBe("PATCH");
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-2));
    jobs.find(job => job.id === id).reviewed_at = new Date().toISOString();
    return route.fulfill({ json: { success: true } });
  });
  await page.goto("/admin");
  const attention = page.getByRole("region", { name: "Needs attention" });
  await expect(attention).toContainText("2 recent SMS failures");
  await attention.getByRole("link", { name: "View", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recent SMS failures" })).toBeVisible();
  await expect(page.getByText("Queue alert #13", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Mark SMS job #1 as reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true }).filter({ visible: true })).toHaveCount(1);
  await page.goBack();
  await expect(attention).toContainText("1 recent SMS failure");
  await attention.getByRole("link", { name: "View", exact: true }).click();
  await page.getByRole("button", { name: "Mark SMS job #2 as reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true }).filter({ visible: true })).toHaveCount(2);
  await page.goBack();
  await expect(attention).not.toContainText(/\d recent SMS failure/i);
  await expect(attention).toContainText("Recent SMS failures");
});

for (const width of [320, 375, 641, 768, 1024, 1440]) {
  test(`redesigned admin navigation, overview charts, and panels fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (/of chart should be greater than 0/.test(message.text())) errors.push(message.text());
    });
    await setup(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Welcome, Test Admin.", exact: true })).toBeVisible();
    const totals = page.getByRole("region", { name: "Health center totals", exact: true });
    const queue = page.getByRole("region", { name: "Live queue monitor", exact: true });
    const today = page.getByRole("region", { name: "Queues today", exact: true });
    await expect(totals).toContainText("1,284");
    await expect(queue).toContainText("AP02");
    await expect(today).toContainText("Waiting");
    await expect(today).toContainText("24");
    await expect(page.getByRole("region", { name: "Needs attention", exact: true })).toContainText("1 pending leave request");
    await expect(page.getByRole("region", { name: "Needs attention", exact: true })).toContainText("1 recent SMS failure");
    expect((await totals.boundingBox()).y).toBeLessThan((await queue.boundingBox()).y);
    if (width >= 1280) expect((await today.boundingBox()).x).toBeGreaterThan((await queue.boundingBox()).x);
    await expect(page.getByRole("img", { name: "Dental age distribution: 30 queues", exact: true })).toBeVisible();
    const ageChart = page.getByRole("region", { name: "Dental Queues by Age Group" });
    await expect(ageChart.getByText("Unknown", { exact: true })).toHaveCount(0);
    const volumeChart = page.getByRole("region", { name: "Patient Volume" });
    await expect(page.getByRole("heading", { name: "Doctors today", exact: true })).toHaveCount(0);
    expect((await volumeChart.boundingBox()).y).toBeGreaterThan((await ageChart.boundingBox()).y);
    if (width >= 1280) {
      expect((await ageChart.boundingBox()).x).toBeGreaterThan((await queue.boundingBox()).x);
      expect((await volumeChart.boundingBox()).width).toBeGreaterThan((await ageChart.boundingBox()).width);
    }
    await page.getByRole("button", { name: "Daily", exact: true }).click();
    await expect(page.getByRole("img", { name: /^Daily patient volume:/ })).toHaveAttribute("aria-label", /23/);
    await page.getByRole("button", { name: "Weekly", exact: true }).click();
    await expect(page.getByRole("img", { name: /^Weekly patient volume:/ })).toBeVisible();
    const darkHostBackground = await page.locator(".ad-root").evaluate(el => getComputedStyle(el).backgroundColor);
    expect(await page.locator(".ad-root").evaluate(el => getComputedStyle(el).colorScheme)).not.toContain("dark");
    await page.emulateMedia({ colorScheme: "light" });
    expect(await page.locator(".ad-root").evaluate(el => getComputedStyle(el).backgroundColor)).toBe(darkHostBackground);
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if ([375, 1440].includes(width)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`admin-dashboard-${width}.png`), fullPage: true, animations: "disabled" });
    }
    const navigation = page.getByRole("navigation", { name: "Admin navigation", exact: true });
    if (width <= 640) {
      await navigation.getByRole("button", { name: "Open menu" }).click();
      await expect(navigation.getByRole("button", { name: /^(Dashboard|Management|Analytics|Activity)$/, exact: false }).filter({ visible: true })).toHaveCount(4);
      await page.keyboard.press("Escape");
      await expect(page.locator("#admin-mobile-menu")).toHaveCount(0);
    } else await expect(navigation.getByRole("button", { name: /^(Dashboard|Management|Analytics|Activity)$/, exact: false }).filter({ visible: true })).toHaveCount(4);
    await expect(page.locator("#ad-sidebar")).toHaveCount(0);
    await expect(navigation.getByRole("button", { name: "Live Queue", exact: true })).toHaveCount(0);
    for (const [name, heading] of [["Doctors", "Doctor Availability"], ["Accounts", "Staff Management"], ["Patients History", "Patients History"], ["Notifications", "SMS notifications"], ["Audit Logs", "Audit Logs"], ["Statistics/Analytics", "Statistics & Analytics"]]) {
      await selectAdminSection(page, name);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      if (name === "Patients History") await expect(page.getByRole("main").getByText("Maria Santos", { exact: true }).filter({ visible: true })).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    await page.goto("/admin/queue");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(queue).toBeVisible();
    expect(errors).toEqual([]);
  });
}
