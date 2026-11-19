import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const patient = {
  user_id: 7, role: "patient", phone: "09123456789", credential_version: 2,
  first_name: "Test", last_name: "Patient", barangay: "Abuanan", city: "Bago City",
};

async function seedSession(page, user) {
  const token = createTestToken(user);
  await page.addInitScript(({ token, user }) => {
    sessionStorage.setItem("ek_token", token);
    sessionStorage.setItem("ek_user", JSON.stringify(user));
  }, { token, user });
  return token;
}

async function profileScenario(page, otherAccount = false) {
  const token = await seedSession(page, patient);
  let profile = { ...patient, contact_number: patient.phone };
  const writes = [];
  let delayed;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/login") {
      const user = { ...patient, user_id: otherAccount ? 9 : patient.user_id };
      return route.fulfill({ json: { token: createTestToken({ ...user, exp: Math.floor(Date.now() / 1000) + 7200 }), user } });
    }
    if (path === "/api/test-session-response") {
      delayed = route;
      return;
    }
    if (path === "/api/patients/me" && route.request().method() === "PUT") {
      writes.push(route.request().postDataJSON());
      if (writes.length === 1) {
        return route.fulfill({ status: 401, json: { code: "SESSION_EXPIRED", message: "Session expired." } });
      }
      profile = { ...profile, ...writes.at(-1) };
    }
    return route.fulfill({ json: { data: profile } });
  });
  await page.goto("/patient/profile");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("First name", { exact: true }).fill("Private draft");
  return { token, writes, getDelayed: () => delayed };
}

test("same-account sign-in restores the draft, ignores stale errors and never retries a write", async ({ page }) => {
  const { writes, getDelayed } = await profileScenario(page);
  await page.evaluate(async () => {
    const { default: api } = await import("/src/services/api.js");
    window.addEventListener("ekalusugan-session-interrupted", () => window.dispatchEvent(new Event("focus")), { once: true });
    void api.get("/test-session-response").catch(() => {});
  });
  await expect.poll(() => Boolean(getDelayed())).toBe(true);
  await page.getByRole("button", { name: "Save changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Your session expired" });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("First name", { exact: true })).toBeHidden();
  await dialog.getByLabel("Password", { exact: true }).fill("SyntheticPassword1");
  await dialog.getByRole("button", { name: "Sign in again" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Private draft");
  await getDelayed().fulfill({ status: 401, json: { code: "SESSION_REVOKED", message: "Old session." } });
  await expect(page.getByRole("button", { name: "Save changes" })).toBeEnabled();
  expect(writes).toEqual([{ first_name: "Private draft" }]);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(2);
});

test("a different account cannot inherit a draft after expiry", async ({ page }) => {
  const { writes } = await profileScenario(page, true);
  await page.getByRole("button", { name: "Save changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Your session expired" });
  await dialog.getByLabel("Password", { exact: true }).fill("SyntheticPassword1");
  await dialog.getByRole("button", { name: "Sign in again" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("First name", { exact: true })).toHaveCount(0);
  expect(writes).toHaveLength(1);
  expect(await page.evaluate(() => sessionStorage.getItem("ek_token"))).toBeNull();
});

test("a dirty profile warns before closing or reloading the form", async ({ page }) => {
  await profileScenario(page);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const discard = page.getByRole("dialog", { name: "Discard unsaved changes?" });
  await expect(discard.getByRole("button", { name: "Keep editing" })).toBeFocused();
  await discard.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Private draft");
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("beforeunload");
    await dialog.accept();
  });
  await page.reload();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue(patient.first_name);
  await page.getByLabel("First name", { exact: true }).fill("Discard me");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await discard.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
});

test("admin issues a workforce password and sees a refreshed deactivation impact", async ({ page }) => {
  await seedSession(page, { user_id: 8, role: "admin", credential_version: 1 });
  const member = { user_id: 9, role: "doctor", first_name: "Maria", last_name: "Santos", is_active: 1, phone: "09123456789", credential_version: 3 };
  let impactReads = 0;
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/admin/staff") return route.fulfill({ json: { staff: [member] } });
    if (path === "/api/admin/staff/9/account-recovery") {
      expect(route.request().postDataJSON()).toEqual({ expected_credential_version: 3, staff_password: "SyntheticAdmin1", identity_confirmed: true });
      return route.fulfill({ status: 201, json: { data: { temp_password: "102938", registered_phone: member.phone, expires_at: new Date(Date.now() + 1800000).toISOString() } } });
    }
    if (path === "/api/admin/accounts/9/deactivation-impact") {
      impactReads++;
      if (impactReads === 1) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      return route.fulfill({ json: { data: { appointments: [{ appointment_id: 101, date: "2026-12-01", time: "09:00:00", status: "confirmed" }], tickets: [], review_shared_queue: true } } });
    }
    if (path === "/api/admin/staff/9/deactivate") member.is_active = 0;
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto("/admin/accounts/staff");
  await page.getByRole("button", { name: "Issue temporary password for Maria Santos" }).click();
  const recovery = page.getByRole("dialog", { name: "Workforce account recovery" });
  await recovery.getByLabel("Your password", { exact: true }).fill("SyntheticAdmin1");
  await expect(recovery.getByRole("button", { name: "Issue temporary password" })).toBeDisabled();
  await recovery.getByRole("checkbox").check();
  await recovery.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(recovery.getByText("102938", { exact: true })).toBeVisible();
  await recovery.getByRole("button", { name: "Close recovery" }).click();
  await page.getByRole("button", { name: "Deactivate", exact: true }).click();
  const impact = page.getByRole("dialog", { name: "Deactivate account" });
  await expect(impact).toContainText("Affected visits could not be loaded");
  await impact.getByLabel("Reason for deactivation").selectOption("Duplicate account");
  await impact.getByRole("button", { name: "Deactivate", exact: true }).click();
  const done = page.getByRole("dialog", { name: "Account deactivated" });
  await expect(done.getByText(/Booking #101/)).toBeVisible();
  await expect(done).toContainText("Review unassigned patients in the shared dental queue");
  expect(member.is_active).toBe(0);
  expect(impactReads).toBe(2);
});
