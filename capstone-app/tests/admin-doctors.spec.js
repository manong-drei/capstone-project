import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const doctors = [
  { doctor_id: 7, first_name: "Maria", last_name: "Santos", specialization_name: "Dentistry", is_available: 1 },
  { doctor_id: 9, first_name: "Juan", last_name: "Cruz", is_available: 0 },
];
const records = {
  doctor: { ...doctors[0], contact_number: "09123456780", license_number: "TEST-12345", date_added: "2026-01-14T16:30:00.000Z" },
  availability: [
    { date: "2026-10-18", is_available: 1, appointment_limit: 10, walk_in_limit: 0 },
    { date: "2026-10-17", is_available: 0, appointment_limit: 0, walk_in_limit: 5 },
  ],
};

async function openDoctors(page, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.addInitScript((token) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "admin" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 8, role: "admin" }));
  const responses = {
    "/api/auth/profile": { data: { user_id: 8, role: "admin", display_name: "Test Admin" } },
    "/api/admin/overview": { totalPatients: 0, totalDoctors: 2, totalAppointments: 0, completedQueues: 0 },
    "/api/doctor": { data: doctors },
    "/api/doctor/7/records": { data: records },
    "/api/doctor/9/records": { data: { doctor: doctors[1], availability: [] } },
  };
  await page.route("**/api/**", (route) => route.fulfill({ json: responses[new URL(route.request().url()).pathname] ?? { data: [] } }));
  await page.goto("/admin");
  if (width <= 900) await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#ad-sidebar").getByRole("button", { name: "Doctors", exact: true }).click();
}

for (const width of [1440, 375]) {
  test(`admin can inspect each doctor's profile and availability at ${width}px`, async ({ page }, testInfo) => {
    await openDoctors(page, width);
    const trigger = page.getByRole("button", { name: "View records for Dr. Maria Santos" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Dr. Maria Santos" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Doctor information" })).toBeVisible();
    for (const [label, value] of [["First name", "Maria"], ["Last name", "Santos"], ["Contact number", "09123456780"], ["Specialization", "Dentistry"], ["License number", "TEST-12345"]]) {
      await expect(dialog.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd")).toHaveText(value);
    }
    await expect(dialog.locator("dl > div").filter({ hasText: "Date added" }).locator("dd")).toContainText("Jan 15, 2026");
    await expect(dialog.locator("dl > div").filter({ hasText: "Date added" }).locator("dd")).toContainText("12:30 AM");
    const rows = dialog.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator("td")).toHaveText(["Oct 18, 2026", "Available", "10", "Not set"]);
    await expect(rows.nth(1).locator("td")).toHaveText(["Oct 17, 2026", "Unavailable", "0", "5"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const bounds = await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`doctor-records-${width}.png`), fullPage: true });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.getByRole("button", { name: "View records for Dr. Juan Cruz" }).click();
    const other = page.getByRole("dialog", { name: "Dr. Juan Cruz" });
    await expect(other.getByText("No availability records saved for this doctor yet.")).toBeVisible();
    await expect(other.locator("dl > div").filter({ hasText: "Contact number" }).locator("dd")).toHaveText("Not recorded");
    await expect(other.locator("dl > div").filter({ hasText: "Date added" }).locator("dd")).toHaveText("Not recorded");
    await expect(other.locator("dl > div").filter({ hasText: "Today’s availability" }).locator("dd")).toHaveText("Unavailable");
    await expect(other.getByText("TEST-12345")).toHaveCount(0);
    await other.getByRole("button", { name: "Close doctor records" }).click();
    await expect(other).toHaveCount(0);
  });
}

test("failed doctor record requests can be retried and show a loading state", async ({ page }) => {
  await openDoctors(page);
  let fail = true;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  await page.route("**/api/doctor/7/records", async (route) => {
    if (fail) return route.fulfill({ status: 503, json: { message: "Unable to load doctor records." } });
    await pending;
    return route.fulfill({ json: { data: records } });
  });
  await page.getByRole("button", { name: "View records for Dr. Maria Santos" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText("Unable to load doctor records.");
  fail = false;
  await dialog.getByRole("button", { name: "Try again" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Loading doctor records…");
  release();
  await expect(dialog.getByRole("heading", { name: "Availability history" })).toBeVisible();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
});

test("closing a pending request and selecting another doctor does not show the previous doctor's records", async ({ page }) => {
  await openDoctors(page);
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  await page.route("**/api/doctor/7/records", async (route) => {
    await pending;
    await route.fulfill({ json: { data: records } });
  });
  await page.getByRole("button", { name: "View records for Dr. Maria Santos" }).click();
  await expect(page.getByRole("status")).toHaveText("Loading doctor records…");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "View records for Dr. Juan Cruz" }).click();
  const dialog = page.getByRole("dialog", { name: "Dr. Juan Cruz" });
  await expect(dialog.getByText("No availability records saved for this doctor yet.")).toBeVisible();
  const finished = page.waitForResponse("**/api/doctor/7/records");
  release();
  await finished;
  await expect(dialog.getByText("TEST-12345")).toHaveCount(0);
  await expect(dialog.getByText("No availability records saved for this doctor yet.")).toBeVisible();
});
