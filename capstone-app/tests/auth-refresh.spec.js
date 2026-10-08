import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockSession(page, claims, cachedUser) {
  const token = createTestToken({ user_id: 8, role: "staff", ...claims });
  await page.addInitScript(({ token, cachedUser }) => {
    if (!localStorage.getItem("auth-test-initialized")) {
      localStorage.setItem("ek_token", token);
      if (cachedUser !== undefined) localStorage.setItem("ek_user", cachedUser);
      localStorage.setItem("auth-test-initialized", "true");
    }
  }, { token, cachedUser });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body = { data: [] };
    if (path === "/api/auth/profile") body = { data: { user_id: 8, role: claims.role || "staff", display_name: "Refresh Test" } };
    else if (path === "/api/queue") body = [];
    else if (path === "/api/queue/status") body = {};
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return token;
}

test("a fresh /dashboard load waits for the saved session", async ({ page }) => {
  const token = await mockSession(page, {}, JSON.stringify({ user_id: 8, role: "staff" }));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/staff$/);
  await expect(page.getByRole("heading", { name: "Dental queue", exact: true })).toBeVisible();
  for (let refresh = 0; refresh < 3; refresh++) {
    await page.reload();
    await expect(page.getByRole("heading", { name: "Dental queue", exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/staff$/);
    expect(await page.evaluate(() => localStorage.getItem("ek_token"))).toBe(token);
  }
});

for (const cachedUser of [undefined, "{broken-json", JSON.stringify({ user_id: 8 }), JSON.stringify({ user_id: 8, role: "patient" }), JSON.stringify({ user_id: 99, role: "admin", display_name: "Another Account" })]) {
  test(`refresh restores the token's role with incomplete cache: ${cachedUser ?? "missing"}`, async ({ page }) => {
    const token = await mockSession(page, {}, cachedUser);
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/staff$/);
    await expect(page.getByRole("heading", { name: "Dental queue", exact: true })).toBeVisible();
    await expect(page.getByText("Another Account")).toHaveCount(0);
    await page.reload();
    await expect(page).toHaveURL(/\/staff$/);
    await expect(page.getByRole("heading", { name: "Dental queue", exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("ek_token"))).toBe(token);
  });
}

for (const [label, claims] of [
  ["expired", { exp: 1 }], ["missing expiry", { exp: null }],
  ["unknown role", { role: "unknown" }], ["missing account", { user_id: null }],
]) {
  test(`${label} token returns to login, not the homepage`, async ({ page }) => {
    await mockSession(page, claims, JSON.stringify({ user_id: 8, role: "staff" }));
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome!" })).toBeVisible();
  });
}

test("a malformed token returns to login", async ({ page }) => {
  await mockSession(page, {}, JSON.stringify({ user_id: 8, role: "staff" }));
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Dental queue", exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.setItem("ek_token", "broken-token"));
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});

for (const [role, marker] of [["patient", /Your Health, Schedule/], ["doctor", /Your Health, Schedule/], ["admin", /Good (Morning|Afternoon|Evening)/]]) {
  test(`${role} refresh preserves its protected URL`, async ({ page }) => {
    const token = await mockSession(page, { role }, JSON.stringify({ user_id: 8, role }));
    await page.goto(`/${role}?tab=home#saved`);
    await expect(page.getByRole("heading", { name: marker })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: marker })).toBeVisible();
    await expect(page).toHaveURL(`/${role}?tab=home#saved`);
    expect(await page.evaluate(() => localStorage.getItem("ek_token"))).toBe(token);
  });
}

test("login persists a session and logout prevents restoration", async ({ page }) => {
  const token = await mockSession(page, {}, JSON.stringify({ user_id: 8, role: "staff" }));
  await page.route("**/api/auth/login", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ phone: "09123456789", password: "Password123" });
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({
      success: true, token, user: { user_id: 8, role: "staff", must_change_password: false },
    }) });
  });
  await page.goto("/login");
  await page.evaluate(() => { localStorage.removeItem("ek_user"); localStorage.removeItem("ek_token"); });
  await page.locator('input[name="phone"]').fill("09123456789");
  await page.locator('input[name="password"]').fill("Password123");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dental queue", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dental queue", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Refresh Test Staff" }).click();
  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("ek_token"))).toBeNull();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome!" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

for (const [role, marker] of [["patient", /Your Health, Schedule/], ["doctor", /Your Health, Schedule/], ["staff", "Dental queue"], ["admin", /Good (Morning|Afternoon|Evening)/]]) {
  test(`${role} phone/password login survives idle time and refresh`, async ({ page }) => {
    const token = await mockSession(page, { role }, undefined);
    await page.route("**/api/auth/login", async (route) => {
      expect(route.request().postDataJSON()).toEqual({ phone: "09123456789", password: "Password123" });
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        success: true, token, user: { user_id: 8, role, must_change_password: false },
      }) });
    });
    await page.clock.install();
    await page.goto("/login");
    await page.evaluate(() => { localStorage.removeItem("ek_user"); localStorage.removeItem("ek_token"); });
    await page.locator('input[name="phone"]').fill("09123456789");
    await page.locator('input[name="password"]').fill("Password123");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(`/${role}`);
    await expect(page.getByRole("heading", { name: marker, exact: role === "staff" })).toBeVisible();
    await page.clock.fastForward(35_000);
    await page.reload();
    await expect(page).toHaveURL(`/${role}`);
    await expect(page.getByRole("heading", { name: marker, exact: role === "staff" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("ek_token"))).toBe(token);
    for (const path of ["/", `/dashboard/${role}`, role === "admin" ? "/patient" : "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(`/${role}`);
      await expect(page.getByRole("heading", { name: marker, exact: role === "staff" })).toBeVisible();
    }
  });
}

test("password setup remains required after refresh even with a stale cache flag", async ({ page }) => {
  await mockSession(page, { role: "patient", purpose: "password_setup" }, JSON.stringify({ user_id: 8, role: "patient", must_change_password: false }));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/change-password$/);
  await expect(page.getByRole("heading", { name: "Change Your Password" })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/change-password$/);
  await expect(page.locator('input[name="oldPassword"]')).toHaveCount(0);
});
