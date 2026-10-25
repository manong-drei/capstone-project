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
  await monitor.clock.fastForward(1_000);
  await expect(monitor.getByText("Q02", { exact: true })).toBeVisible();
  // Each tab retains its own storage after the initial session copy.
  await monitor.evaluate(() => sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "staff", display_name: "Monitor Tab" })));
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("ek_user")).display_name)).toBe("Monitor Staff");
});

test("staff calls and recalls reach the monitor immediately without waiting for polling", async ({ page, context }) => {
  const user = { user_id: 8, role: "staff", display_name: "Monitor Staff" };
  const token = createTestToken(user);
  const queues = [1, 2].map(id => ({ id, category: "dental", queue_number: `Q0${id}`, status: "waiting", type: "regular" }));
  let failCall = true;
  let monitorPolls = 0;
  await context.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
    window.announcements = [];
    window.queueSignals = [];
    const messages = new BroadcastChannel("ek_queue_updates");
    messages.onmessage = event => window.queueSignals.push(event.data);
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: Object.assign(new EventTarget(), {
      getVoices: () => [{ name: "Microsoft Zira Desktop", lang: "en-US" }],
      speak: utterance => window.announcements.push(utterance.text), cancel() {},
    }) });
  }, { user, token });
  await context.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await context.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body = { data: [] };
    if (path === "/api/auth/profile") body = { data: user };
    else if (path === "/api/queue") {
      if (request.frame().page() !== page) monitorPolls++;
      expect(request.headers().authorization).toBe(`Bearer ${token}`);
      body = queues;
    } else if (path === "/api/queue/call-next") {
      if (failCall) return route.fulfill({ status: 503, json: { message: "Call failed." } });
      body = queues.find(queue => queue.status === "waiting");
      Object.assign(body, { status: "called", call_count: 1, last_called_at: new Date().toISOString() });
    } else if (path === "/api/queue/1/recall") {
      body = queues[0];
      Object.assign(body, { call_count: 2, last_called_at: new Date(Date.now() + 15_000).toISOString() });
    } else if (/\/api\/queue\/\d+\/status$/.test(path)) {
      body = queues.find(queue => queue.id === Number(path.split("/")[3]));
      body.status = request.postDataJSON().status;
    }
    await route.fulfill({ json: body });
  });
  await page.clock.install();
  await page.goto("/staff");
  const monitor = await context.newPage();
  await monitor.goto("/general-queue-monitor");
  await expect(monitor.getByRole("heading", { name: "Dental Check-up Queue", exact: true })).toBeVisible();
  await monitor.getByRole("button", { name: "Enable announcements" }).click();
  await monitor.clock.pauseAt(new Date(Date.now() + 1_000));
  const current = monitor.getByRole("region", { name: "Current ticket", exact: true });
  await expect(current).toContainText("No patient being served");
  const call = page.getByRole("button", { name: "Call next patient", exact: true });
  const initialPolls = monitorPolls;
  await call.click();
  await expect(page.getByRole("alert")).toContainText("Call failed.");
  expect(monitorPolls).toBe(initialPolls);
  expect(await monitor.evaluate(() => window.queueSignals)).toEqual([]);
  failCall = false;
  await call.click();
  await expect(current.getByText("Q01", { exact: true })).toBeVisible();
  await expect.poll(() => monitor.evaluate(() => window.announcements.length)).toBe(2);
  const afterCall = monitorPolls;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  expect(monitorPolls).toBe(afterCall);
  await page.clock.fastForward(15_000);
  await page.getByRole("button", { name: "Call again", exact: true }).click();
  await expect.poll(() => monitor.evaluate(() => window.announcements.length)).toBe(4);
  await page.getByRole("button", { name: "Patient present", exact: true }).click();
  await call.click();
  await expect(current.getByText("Q02", { exact: true })).toBeVisible();
  await expect.poll(() => monitor.evaluate(() => window.announcements.length)).toBe(6);
  expect(await monitor.evaluate(() => window.queueSignals.every(message => message === "changed"))).toBe(true);
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
