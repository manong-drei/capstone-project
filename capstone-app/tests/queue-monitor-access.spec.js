import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

test("staff opens the monitor with its own session and keeps access after refresh", async ({ page, context }) => {
  const user = { user_id: 8, role: "staff", display_name: "Monitor Staff" };
  const token = createTestToken(user);
  const queueRequests = [];
  let ticket = "Q01";
  await context.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body = { data: [] };
    if (path === "/api/auth/login") body = { success: true, user, token };
    else if (path === "/api/auth/profile") body = { data: user };
    else if (path === "/api/queue") {
      if (request.headers().authorization !== `Bearer ${token}`) {
        return route.fulfill({ status: 401, json: { message: "Please log in." } });
      }
      queueRequests.push(request);
      body = [{ id: 1, category: "dental", queue_number: ticket, status: "serving", type: "regular" }];
    }
    await route.fulfill({ json: body });
  });
  // Log in through the UI so the monitor must inherit the session from the link.
  await page.goto("/login");
  await page.locator('input[name="phone"]').fill("09123456789");
  await page.locator('input[name="password"]').fill("Password123");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByRole("button", { name: "Monitor Staff Staff", exact: true })).toBeVisible();

  const opened = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Open dental monitor (new tab)", exact: true }).click();
  const monitor = await opened;
  await expect(monitor.getByRole("heading", { name: "Dental Check-up Queue", exact: true })).toBeVisible();
  await expect(monitor).toHaveURL(/\/general-queue-monitor$/);
  await expect(monitor.getByText("Q01", { exact: true })).toBeVisible();
  expect(await monitor.evaluate(() => sessionStorage.getItem("ek_token"))).toBe(token);
  expect(await monitor.evaluate(() => window.opener)).toBeNull();
  expect(await monitor.evaluate(() => localStorage.getItem("ek_token"))).toBeNull();
  expect(queueRequests.some(request => request.frame().page() === monitor)).toBe(true);
  await expect(page).toHaveURL(/\/staff$/);

  await monitor.clock.install();
  await monitor.reload();
  await expect(monitor.getByText("Q01", { exact: true })).toBeVisible();
  ticket = "Q02";
  await monitor.clock.fastForward(10_000);
  await expect(monitor.getByText("Q02", { exact: true })).toBeVisible();
  // Each tab retains its own storage after the initial session copy.
  await monitor.evaluate(() => sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "staff", display_name: "Monitor Tab" })));
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("ek_user")).display_name)).toBe("Monitor Staff");
});

test("the monitor still requires a login", async ({ page }) => {
  await page.goto("/general-queue-monitor");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Dental Check-up Queue", exact: true })).toHaveCount(0);
});

test("a patient session cannot open the staff monitor", async ({ page }) => {
  await page.addInitScript(token => {
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 11, role: "patient" }));
  const queueRequests = [];
  await page.route("**/api/queue?**", route => {
    queueRequests.push(route.request());
    return route.fulfill({ json: [] });
  });
  await page.goto("/general-queue-monitor");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Dental Check-up Queue", exact: true })).toHaveCount(0);
  expect(queueRequests).toHaveLength(0);
});
