import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

for (const [operation, key] of [
  ["delete", "ek_token"], ["delete", "ek_user"],
  ["empty", "ek_token"], ["empty", "ek_user"], ["clear", null], ["logout", null],
]) {
  test(`${operation} ${key ?? "session storage"} clears all stored user identifiers`, async ({ page, context }) => {
    const user = { user_id: 8, role: "staff", display_name: "Storage Test" };
    const token = createTestToken(user);
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let body = { data: [] };
      if (path === "/api/auth/login") body = { success: true, user, token };
      else if (path === "/api/auth/profile") body = { data: user };
      else if (path === "/api/queue") body = [];
      await route.fulfill({ json: body });
    });
    await page.goto("/login");
    await page.locator('input[name="phone"]').fill("09123456789");
    await page.locator('input[name="password"]').fill("Password123");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.getByRole("button", { name: "Storage Test Staff", exact: true })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("user"))).toBeNull();
    await page.evaluate(() => sessionStorage.setItem("user", "2128"));

    if (operation === "logout") {
      await page.getByRole("button", { name: "Storage Test Staff", exact: true }).click();
      await page.getByRole("button", { name: "Log Out", exact: true }).click();
    } else if (operation === "delete") {
      const devtools = await context.newCDPSession(page);
      await devtools.send("DOMStorage.removeDOMStorageItem", {
        storageId: { securityOrigin: new URL(page.url()).origin, isLocalStorage: false }, key,
      });
    } else {
      await page.evaluate(({ operation, key }) => {
        if (operation === "clear") sessionStorage.clear();
        else sessionStorage.setItem(key, "");
      }, { operation, key });
    }

    await expect(page).toHaveURL(operation === "logout" ? "/login" : "/");
    await expect(page.getByRole("heading", { name: operation === "logout" ? "Welcome!" : /less waiting/i })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("ek_token"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("ek_user"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("user"))).toBeNull();
    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("opening the app removes a leftover legacy user ID", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("user", "2128"));
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome!" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("user"))).toBeNull();
});
