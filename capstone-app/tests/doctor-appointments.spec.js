import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

test.use({ timezoneId: "America/Los_Angeles" });

const appointments = [
  { appointment_id: 1, appointment_date: "2026-10-24T16:00:00.000Z", patient_full_name: "Timestamp Today Patient" },
  { appointment_id: 2, appointment_date: "2026-10-25", patient_full_name: "Date Today Patient" },
  { appointment_id: 3, appointment_date: "2026-10-23T16:00:00.000Z", patient_full_name: "Previous Patient" },
  { appointment_id: 4, appointment_date: "2026-10-25T16:00:00.000Z", patient_full_name: "Next Patient" },
];

async function openHistory(page, now) {
  const user = { user_id: 4, role: "doctor", display_name: "Test Doctor" };
  await page.clock.install({ time: new Date(now) });
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
  }, { user, token: createTestToken({ ...user, exp: Math.floor(new Date(now).getTime() / 1000) + 86400 }) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("**/api/**", route => {
    const responses = {
      "/api/auth/profile": { data: user },
      "/api/queue": [],
      "/api/doctor/daily-settings": { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 },
      "/api/appointments/doctor": { success: true, appointments },
    };
    return route.fulfill({ json: responses[new URL(route.request().url()).pathname] ?? {} });
  });
  await page.goto("/doctor");
  if (page.viewportSize().width <= 640) await page.getByRole("button", { name: "Toggle menu", exact: true }).click();
  await page.getByRole("button", { name: "Appointment History", exact: true }).filter({ visible: true }).click();
  await expect(page.getByText("Loading appointments...", { exact: true })).toHaveCount(0);
}

for (const width of [1440, 375]) {
  for (const time of ["00:30", "12:00"]) {
    test(`Today includes Philippine appointments at ${time} with a different device timezone at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openHistory(page, `2026-10-25T${time}:00+08:00`);
      for (const name of ["Timestamp Today Patient", "Date Today Patient"]) {
        await expect(page.getByText(name, { exact: true }).filter({ visible: true })).toBeVisible();
      }
      await expect(page.getByText(/Oct 25/).filter({ visible: true })).toHaveCount(2);
      for (const name of ["Previous Patient", "Next Patient"]) {
        await expect(page.getByText(name, { exact: true })).toHaveCount(0);
      }
      await page.getByRole("button", { name: "All", exact: true }).click();
      for (const appointment of appointments) {
        await expect(page.getByText(appointment.patient_full_name, { exact: true }).filter({ visible: true })).toBeVisible();
      }
      await page.getByRole("button", { name: "Today", exact: true }).click();
      await expect(page.getByText("Previous Patient", { exact: true })).toHaveCount(0);
      await expect(page.getByText("Next Patient", { exact: true })).toHaveCount(0);
    });
  }
}

test("Today recalculates the Philippine date when the filter is used after midnight", async ({ page }) => {
  await openHistory(page, "2026-10-25T23:59:00+08:00");
  await expect(page.getByText("Date Today Patient", { exact: true }).filter({ visible: true })).toBeVisible();
  await page.clock.setSystemTime(new Date("2026-10-26T00:01:00+08:00"));
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByText("Next Patient", { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText("Date Today Patient", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Timestamp Today Patient", { exact: true })).toHaveCount(0);
});
