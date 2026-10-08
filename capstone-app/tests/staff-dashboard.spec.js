import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockStaff(page) {
  await page.addInitScript((token) => {
    localStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "staff", display_name: "Alex Staff" }));
    localStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 8, role: "staff" }));
  const state = { calls: [], registrations: [], searches: [], queues: [
    { id: 1, category: "dental", queue_number: "P-002", status: "waiting", type: "priority", patient_id: 11, full_name: "Priority Patient", is_walk_in: 0 },
    { id: 2, category: "dental", queue_number: "Q-010", status: "waiting", type: "regular", patient_id: 12, full_name: "Walk-in Patient", is_walk_in: 1 },
    { id: 3, category: "general", queue_number: "G-001", status: "waiting", type: "regular", full_name: "Excluded General Patient" },
    { id: 4, category: "dental", queue_number: "Q-009", status: "done", type: "regular", full_name: "Completed Patient", is_walk_in: 0 },
  ] };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body = {};
    if (url.pathname === "/api/auth/profile") body = { data: { user_id: 8, role: "staff", display_name: "Alex Staff" } };
    else if (url.pathname === "/api/doctor") body = { data: [{ doctor_id: 1, is_available: 1 }] };
    else if (url.pathname === "/api/queue") {
      expect(url.searchParams.get("category")).toBe("dental");
      body = state.queues.filter((queue) => ["waiting", "serving", "done"].includes(queue.status));
    } else if (url.pathname === "/api/queue/call-next") {
      state.calls.push(request.postDataJSON());
      const next = state.queues.find((queue) => queue.category === "dental" && queue.status === "waiting");
      if (next) next.status = "serving";
      body = { success: true, queue: next };
    } else if (/\/api\/queue\/\d+\/status/.test(url.pathname)) {
      const id = Number(url.pathname.split("/")[3]);
      const data = request.postDataJSON();
      expect(data.reason).toBeTruthy();
      state.queues.find((queue) => queue.id === id).status = data.status;
      body = { success: true };
    } else if (url.pathname === "/api/queue/walkin") {
      state.registrations.push(request.postDataJSON());
      body = { queue: { queue_number: "P-003", sms_initial_position: 2, sms_alert_state: "suppressed" } };
    } else if (url.pathname === "/api/patients/search") {
      state.searches.push(url.search);
      body = { data: url.searchParams.get("name") === "Returning" ? [{ patient_id: 20, first_name: "Returning", last_name: "Patient", date_of_birth: "1960-01-01", masked_contact: "*******6789" }] : [] };
    } else if (url.pathname === "/api/patients/20") body = { data: { patient_id: 20, first_name: "Returning", last_name: "Patient", date_of_birth: "1960-01-01", gender: "Female", barangay: "Abuanan", contact_number: "09123456789", visits: [
      { id: 30, category: "dental", queue_number: "Q-030", status: "done", created_at: "2026-10-07T09:00:00+08:00" },
      { id: 31, category: "general", queue_number: "G-031", status: "done", created_at: "2026-10-07T09:00:00+08:00" },
    ] } };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return state;
}

test("staff keeps serving order, handles reasons, and calls only the dental queue", async ({ page }) => {
  const state = await mockStaff(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Welcome, Alex Staff." })).toBeVisible();
  await expect(page.getByText("Excluded General Patient")).toHaveCount(0);
  await expect(page.locator("#dental-queue ol li").first()).toContainText("P-002");
  await expect(page.getByText("Dentist available today")).toBeVisible();
  await page.screenshot({ path: "test-results/staff-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Call next patient" }).click();
  await expect(page.getByRole("button", { name: "Mark no-show" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Call next patient" })).toBeDisabled();
  await page.getByRole("button", { name: "Mark no-show" }).click();
  await page.getByRole("radio", { name: /No-show — patient not present/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#dental-queue")).toContainText("Q-010");
  await expect.poll(() => state.calls.length).toBe(2);
  expect(state.calls).toEqual([{ category: "dental" }, { category: "dental" }]);
  await page.reload();
  state.queues[0].status = "waiting";
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: "Cancel queue P-002" }).click();
  await page.getByRole("radio", { name: "Schedule conflict / no longer available" }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel queue P-002" })).toHaveCount(0);
});

test("mobile walk-in registration preserves patient lookup, priority, service limits, and SMS instructions", async ({ page }) => {
  const state = await mockStaff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Register dental walk-in" })).toBeVisible();
  await page.getByLabel("Find an existing patient").fill("Returning");
  await page.getByRole("button", { name: /Returning Patient · 1960-01-01/ }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Returning Patient");
  await expect(page.getByLabel("Confirmed mobile number")).toHaveValue("9123456789");
  await expect(page.getByText("Previous dental visits: 1")).toBeVisible();
  await expect(page.getByText(/G-031/)).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Dental Check-up", exact: true }).check();
  await page.getByRole("checkbox", { name: "Oral Prophylaxis", exact: true }).check();
  await expect(page.getByRole("checkbox", { name: "Fluoride", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: "Priority", exact: true }).check();
  await page.getByLabel("Priority category").selectOption("senior");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/staff-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Register and assign dental queue" }).click();
  await expect(page.getByRole("status")).toContainText("Please stay nearby; no queue SMS will be sent.");
  expect(state.registrations[0]).toMatchObject({ category: "dental", patient_id: 20, services: ["CONSULTATION", "ORAL_PROPHYLAXIS"], type: "priority", priority_category: "senior", contact: "+639123456789" });
  await expect(page.getByLabel("Full name")).toHaveValue("");
});
