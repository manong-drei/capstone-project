import { test, expect } from "@playwright/test";

test("doctor's daily barangay entries survive reload and total into a monthly form", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ek_user", JSON.stringify({ user_id: 4, role: "doctor", display_name: "Dr. Test" }));
    localStorage.setItem("ek_token", "test-token");
  });
  const saved = new Map();
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let body = {};
    if (path === "/api/doctor/analytics") body = {
      report_date: "2026-10-06", patients: 2, waiting: 1, serving: 0,
      completed: 1, priority: 0, appointments: 1, walk_ins: 1,
      age_groups: [{ age_group: "20–59 years", count: 2 }],
    };
    else if (path === "/api/doctor/daily-report") {
      if (route.request().method() === "PUT") {
        const { date, data } = route.request().postDataJSON();
        saved.set(date, data);
        body = { success: true, data };
      } else body = { data: saved.get(url.searchParams.get("date")) || null };
    } else if (path === "/api/doctor/monthly-report") body = { reports: [...saved.entries()].filter(([date]) => date.startsWith(url.searchParams.get("month"))).map(([, data]) => data) };
    else if (path === "/api/doctor/daily-settings") body = { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 };
    else if (path === "/api/queue") body = [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });

  await page.goto("/doctor");
  await page.getByRole("button", { name: "Analytics" }).first().click();
  await expect(page.getByRole("heading", { name: "Daily barangay entries" })).toBeVisible();
  const male = page.getByRole("textbox", { name: /Abuanan, Orally fit children.*Male/ });
  const seniorFemale = page.getByRole("textbox", { name: /Abuanan, Senior citizens.*Female/ });
  await male.fill("3");
  await seniorFemale.fill("1");
  await page.getByRole("button", { name: "Save entries" }).click();
  await expect(page.getByText("Saved for this date")).toBeVisible();
  expect(saved.get("2026-10-06")[0][23]).toBe(1);

  await page.getByLabel("Entry date").fill("2026-10-05");
  await expect(male).toHaveValue("");
  await male.fill("2");
  await seniorFemale.fill("4");
  await page.getByRole("button", { name: "Save entries" }).click();
  expect(saved.get("2026-10-05")[0][23]).toBe(4);
  await expect(page.locator(".da-month-table tbody tr").first()).toContainText("5");
  await expect(page.locator(".da-month-table").nth(1).locator("tbody tr").first()).toContainText("5");

  await page.reload();
  await page.getByRole("button", { name: "Analytics" }).first().click();
  await expect(male).toHaveValue("3");
  await expect(page.locator(".da-month-table tbody tr").first()).toContainText("5");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#doctor-report-print")).toBeVisible();
  const pdf = await page.pdf({ format: "A3", landscape: true, printBackground: true });
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length).toBe(2);
  await page.emulateMedia({ media: "screen" });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Excel" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("dental-report-2026-10.xlsx");
});
