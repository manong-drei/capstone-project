import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

test("two tabs keep their own credentials through actions, refresh, and logout", async ({ page: staffTab, context }) => {
  const staff = { user_id: 8, role: "staff", display_name: "User A" };
  const patient = { user_id: 11, role: "patient", display_name: "User B" };
  const staffToken = createTestToken(staff);
  const patientToken = createTestToken(patient);
  const waiting = { id: 1, category: "dental", queue_number: "AQ01", status: "waiting", type: "regular" };
  let staffQueue = waiting;
  let patientQueue = null;

  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const token = request.headers().authorization;
    const user = token === `Bearer ${staffToken}` ? staff : token === `Bearer ${patientToken}` ? patient : null;
    let body = { data: [] };
    if (path === "/api/auth/login") {
      const isStaff = request.postDataJSON().phone === "09123456789";
      body = { success: true, user: isStaff ? staff : patient, token: isStaff ? staffToken : patientToken };
    } else if ((path === "/api/queue" && request.method() === "GET") || path === "/api/queue/call-next") {
      if (user?.role !== "staff") {
        return route.fulfill({ status: 403, json: { message: "Access denied." } });
      }
      if (request.method() === "POST") staffQueue = { ...waiting, status: "called", call_count: 1, last_called_at: new Date().toISOString() };
      body = request.method() === "POST" ? staffQueue : [staffQueue];
    } else if (path === "/api/queue" && request.method() === "POST") {
      if (user?.role !== "patient") {
        return route.fulfill({ status: 403, json: { message: "Access denied." } });
      }
      patientQueue = { ...waiting, id: 2, queue_number: "AQ02" };
      body = patientQueue;
    } else if (path === "/api/auth/profile") body = { data: user };
    else if (path === "/api/queue/me") body = patientQueue;
    else if (path === "/api/queue/status") body = {};
    await route.fulfill({ json: body });
  });

  const patientTab = await context.newPage();
  const login = async (tab, phone, role) => {
    await tab.goto("/login");
    await tab.locator('input[name="phone"]').fill(phone);
    await tab.locator('input[name="password"]').fill("Password123");
    await tab.getByRole("button", { name: "Login", exact: true }).click();
    await expect(tab).toHaveURL(`/${role}`);
    await expect(tab.getByRole("button", { name: role === "staff" ? "User A Staff" : "User B Patient", exact: true })).toBeVisible();
  };
  await login(staffTab, "09123456789", "staff");
  await login(patientTab, "09987654321", "patient");

  const called = staffTab.waitForResponse(response => response.url().endsWith("/api/queue/call-next"));
  await staffTab.getByRole("button", { name: "Call next patient", exact: true }).click();
  const callResponse = await called;
  expect(callResponse.status()).toBe(200);
  expect(callResponse.request().headers().authorization).toBe(`Bearer ${staffToken}`);
  await expect(staffTab.getByRole("button", { name: "Patient present", exact: true })).toBeVisible();

  await patientTab.getByRole("region", { name: "Quick actions" }).getByRole("button", { name: /Get queue ticket/i }).click();
  await patientTab.getByRole("checkbox", { name: "Dental Check-up", exact: true }).check();
  const registered = patientTab.waitForResponse(response => response.url().endsWith("/api/queue") && response.request().method() === "POST");
  await patientTab.getByRole("button", { name: "Get Queue Ticket", exact: true }).click();
  const registrationResponse = await registered;
  expect(registrationResponse.status()).toBe(200);
  expect(registrationResponse.request().headers().authorization).toBe(`Bearer ${patientToken}`);
  await expect(patientTab.getByText("AQ02", { exact: true }).first()).toBeVisible();

  for (const [tab, role, token] of [[staffTab, "staff", staffToken], [patientTab, "patient", patientToken]]) {
    await tab.reload();
    await expect(tab).toHaveURL(`/${role}`);
    expect(await tab.evaluate(() => sessionStorage.getItem("ek_token"))).toBe(token);
    expect(await tab.evaluate(() => localStorage.getItem("ek_token"))).toBeNull();
    expect(await tab.evaluate(() => localStorage.getItem("ek_user"))).toBeNull();
  }

  await patientTab.getByRole("button", { name: "User B Patient", exact: true }).click();
  await patientTab.getByRole("button", { name: "Log Out", exact: true }).click();
  await patientTab.reload();
  await expect(patientTab).toHaveURL(/\/login$/);
  expect(await patientTab.evaluate(() => sessionStorage.getItem("ek_token"))).toBeNull();
  const refreshed = staffTab.waitForResponse(response => new URL(response.url()).pathname === "/api/queue");
  await staffTab.getByRole("button", { name: "Refresh", exact: true }).click();
  expect((await refreshed).request().headers().authorization).toBe(`Bearer ${staffToken}`);
  await staffTab.reload();
  await expect(staffTab.getByRole("button", { name: "User A Staff", exact: true })).toBeVisible();

  await login(patientTab, "09987654321", "patient");
  await staffTab.getByRole("button", { name: "User A Staff", exact: true }).click();
  await staffTab.getByRole("button", { name: "Log Out", exact: true }).click();
  const restored = patientTab.waitForResponse(response => response.url().endsWith("/api/queue/me"));
  await patientTab.reload();
  expect((await restored).request().headers().authorization).toBe(`Bearer ${patientToken}`);
  await expect(patientTab.getByRole("button", { name: "User B Patient", exact: true })).toBeVisible();
});
