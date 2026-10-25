import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const dashboards = [
  { role: "patient", path: "/queue/me", interval: 15_000 },
  { role: "doctor", path: "/queue", interval: 30_000 },
  { role: "staff", path: "/queue", interval: 15_000 },
  { role: "admin", path: "/admin/overview", interval: 15_000 },
];

async function mockDashboard(page, dashboard) {
  const user = { user_id: 8, role: dashboard.role, display_name: "Test User" };
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
  }, { user, token: createTestToken(user) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  const queue = { id: 1, category: "dental", queue_number: "AQ02", full_name: "Test Patient", status: "waiting", type: "regular", services: ["CONSULTATION"] };
  const responses = {
    "/api/auth/profile": { data: user },
    "/api/patients/me": { data: {} },
    "/api/queue/me": queue,
    "/api/queue": [queue],
    "/api/queue/status": { now_serving: "AQ01", next_queuing: "AQ02" },
    "/api/doctor": { data: [{ doctor_id: 1, first_name: "Maria", last_name: "Santos", is_available: 1 }] },
    "/api/doctor/daily-settings": { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 },
    "/api/admin/overview": { totalPatients: 12, totalDoctors: 1, totalAppointments: 0, completedQueues: 0 },
    "/api/appointments": { data: [] },
    "/api/admin/staff": { staff: [] },
    "/api/admin/patients": { patients: [] },
  };
  const state = { path: `/api${dashboard.path}`, fail: false };
  let pending;
  state.hold = () => { pending = new Promise(resolve => { state.release = resolve; }); };
  state.hold();
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === state.path) {
      await pending;
      if (state.fail) return route.fulfill({ status: 503, json: { message: "Temporarily unavailable. Please try again." } });
    }
    return route.fulfill({ json: responses[path] ?? { data: [] } });
  });
  await page.clock.install();
  return state;
}

function loadedContent(page, role) {
  if (role === "patient") return page.getByRole("button", { name: /Get queue ticket/i });
  if (role === "doctor") return page.getByText("Today's dental queues", { exact: true });
  if (role === "staff") return page.getByRole("form", { name: "Dental walk-in registration" });
  return page.getByText("Total Patient Visits", { exact: true });
}

for (const dashboard of dashboards) {
  for (const width of [1280, 375]) {
    test(`${dashboard.role} skeleton is only shown on first load at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const state = await mockDashboard(page, dashboard);
      await page.goto(`/${dashboard.role}`);
      const skeleton = page.getByRole("status", { name: "Loading dashboard", exact: true });
      await expect(skeleton).toBeVisible();
      await expect(page.locator("nav")).toBeVisible();
      expect(await skeleton.locator(".bg-slate-200").first().evaluate(element => getComputedStyle(element).animationName)).toBe("none");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: testInfo.outputPath(`initial-${dashboard.role}-${width}.png`), animations: "disabled" });
      state.release();
      await expect(skeleton).toHaveCount(0);
      await expect(loadedContent(page, dashboard.role)).toBeVisible();

      state.path = dashboard.role === "admin" ? "/api/queue" : state.path;
      state.hold();
      const poll = page.waitForRequest(request => new URL(request.url()).pathname === state.path);
      await page.clock.fastForward(dashboard.interval);
      await poll;
      await expect(skeleton).toHaveCount(0);
      await expect(loadedContent(page, dashboard.role)).toBeVisible();
      state.release();
    });
  }

  test(`${dashboard.role} leaves its initial skeleton after a failed request`, async ({ page }) => {
    const state = await mockDashboard(page, dashboard);
    state.fail = true;
    await page.goto(`/${dashboard.role}`);
    const skeleton = page.getByRole("status", { name: "Loading dashboard", exact: true });
    await expect(skeleton).toBeVisible();
    state.release();
    await expect(skeleton).toHaveCount(0);
    await expect(loadedContent(page, dashboard.role)).toBeVisible();
  });
}

test("page navigation displays feedback while a lazy page downloads", async ({ page }, testInfo) => {
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route("**/src/pages/LoginPage.jsx*", async route => {
    await pending;
    await route.continue();
  });
  await page.goto("/");
  await page.locator('a[href="/login"]').first().click();
  await expect(page.getByRole("status", { name: "Loading page", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("page-transition.png") });
  release();
  await expect(page.getByRole("status", { name: "Loading page", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible();
});
