import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockApp(page, { role = "staff", signedIn = true, patientPatch = {} } = {}) {
  if (signedIn) await page.addInitScript(({ role, token }) => {
    localStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role }));
    localStorage.setItem("ek_token", token);
  }, { role, token: createTestToken({ user_id: 8, role, credential_version: 1 }) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  const state = {
    recoveries: [], searches: [], logins: [], passwordChanges: [], recoveryError: "", searchError: false,
    patient: {
      patient_id: 42, user_id: 7, first_name: "Ana", last_name: "Test",
      date_of_birth: "1989-12-31T16:00:00.000Z", gender: "Female", barangay: "Abuanan", city: "Bago City",
      contact_number: "09987654321", archived_into_patient_id: null, visits: [],
      account: { phone: "09123456789", is_active: 1, credential_version: 2 }, ...patientPatch,
    },
  };
  await page.route("**/api/**", async route => {
    const req = route.request();
    const url = new URL(req.url());
    let body = { success: true, data: [] };
    let status = 200;
    if (url.pathname === "/api/auth/profile") body = { data: { user_id: 8, role, display_name: "Recovery Staff" } };
    else if (url.pathname === "/api/queue") body = [];
    else if (url.pathname === "/api/doctor") body = { data: [{ doctor_id: 1, is_available: 1 }] };
    else if (url.pathname === "/api/patients/search") {
      state.searches.push(Object.fromEntries(url.searchParams));
      if (state.searchError) { status = 500; body = { message: "Unable to search patient records." }; }
      else body = { data: url.searchParams.get("name") === "Nobody" ? [] : [{ ...state.patient, masked_contact: "•••••••6789" }] };
    } else if (url.pathname === "/api/patients/42") body = { data: state.patient };
    else if (url.pathname === "/api/patients/42/account-recovery") {
      state.recoveries.push(req.postDataJSON());
      if (state.recoveryError) { status = 409; body = { message: state.recoveryError }; }
      else {
        state.patient.account.credential_version++;
        status = 201;
        body = { success: true, data: { temp_password: "012345", registered_phone: state.patient.account.phone, expires_at: new Date(Date.now() + 30 * 60000).toISOString() } };
      }
    } else if (url.pathname === "/api/auth/login") {
      state.logins.push(req.postDataJSON());
      body = { success: true, token: createTestToken({ user_id: 7, role: "patient", purpose: "password_setup", credential_version: 3 }), user: { user_id: 7, role: "patient", must_change_password: true } };
    } else if (url.pathname === "/api/auth/change-password") {
      state.passwordChanges.push(req.postDataJSON());
      body = { success: true, token: createTestToken({ user_id: 7, role: "patient", credential_version: 4 }), user: { user_id: 7, role: "patient", must_change_password: false } };
    } else if (url.pathname === "/api/patients/me") body = { data: state.patient };
    else if (url.pathname === "/api/admin/patients") body = { patients: [{ ...state.patient, full_name: "Ana Test", is_active: 1 }] };
    else if (url.pathname === "/api/admin/overview") body = { stats: {}, recentPatients: [], recentActivity: [] };
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return state;
}

async function verify(page) {
  await page.getByRole("button", { name: "Start account recovery" }).click();
  const inputs = page.getByRole("group", { name: "Identity verification" }).getByRole("checkbox");
  for (const input of await inputs.all()) await input.check();
}

test("login explains in-person recovery without requesting account details", async ({ page }) => {
  const state = await mockApp(page, { signedIn: false });
  await page.goto("/login");
  const help = page.getByRole("button", { name: "Forgot password?" });
  await expect(help).toHaveAttribute("aria-expanded", "false");
  await help.click();
  await expect(page.getByRole("heading", { name: "Password Recovery Steps" })).toBeVisible();
  await expect(page.locator("#recovery-help")).toContainText("Visit the clinic reception.");
  await expect(page.locator("#recovery-help")).toContainText("Valid for 30 minutes and one login only.");
  expect(state.recoveries).toHaveLength(0);
  expect(state.searches).toHaveLength(0);
  await help.click();
  await expect(page.locator("#recovery-help")).toHaveCount(0);
});

test("staff searches, confirms all checks, cancels or issues once, and clears the password on close and navigation", async ({ page }) => {
  const state = await mockApp(page);
  await page.goto("/staff");
  await page.getByRole("button", { name: "Account recovery", exact: true }).click();
  await page.getByLabel("Patient name or mobile number").fill("6789");
  await page.getByRole("button", { name: "Search patients" }).click();
  await page.getByRole("link", { name: /Ana Test/ }).click();
  expect(state.searches).toEqual([{ phone: "6789" }]);
  await expect(page.getByText("Date of birth: 1/1/1990")).toBeVisible();
  await page.getByRole("button", { name: "Start account recovery" }).click();
  const checks = page.getByRole("group", { name: "Identity verification" }).getByRole("checkbox");
  await expect(checks).toHaveCount(6);
  const issue = page.getByRole("button", { name: "Issue temporary password" });
  await expect(issue).toBeDisabled();
  for (let i = 0; i < 5; i++) await checks.nth(i).check();
  await expect(issue).toBeDisabled();
  await checks.nth(5).check();
  await expect(issue).toBeEnabled();
  await expect(page.getByText("Registered login number: 09123456789", { exact: true })).toBeVisible();
  page.once("dialog", dialog => { expect(dialog.message()).toContain("all existing sessions will be invalidated"); dialog.dismiss(); });
  await issue.click();
  expect(state.recoveries).toHaveLength(0);
  page.once("dialog", dialog => dialog.accept());
  await issue.click();
  await expect(page.getByText("012345", { exact: true })).toBeVisible();
  expect(state.recoveries).toEqual([{ expected_credential_version: 2, verification: { patient_present: true, first_name: true, last_name: true, phone: true, address: true, date_of_birth: true } }]);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain("012345");
  await page.screenshot({ path: "test-results/account-recovery-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/account-recovery-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Hide temporary password" }).click();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Start account recovery" }).click();
  for (const check of await checks.all()) await expect(check).not.toBeChecked();
  for (const check of await checks.all()) await check.check();
  page.once("dialog", dialog => dialog.accept());
  await issue.click();
  await expect(page.getByText("012345", { exact: true })).toBeVisible();
  expect(state.recoveries[1].expected_credential_version).toBe(3);
  await page.getByRole("link", { name: "Staff dashboard" }).click();
  await expect(page).toHaveURL(/\/staff$/);
  await expect(page.getByRole("heading", { name: "Dental queue management", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "Start account recovery" })).toBeVisible();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
});

test("recovery clears errors and requires verification again after a stale account rejection", async ({ page }) => {
  const state = await mockApp(page);
  state.recoveryError = "This account has changed. Refresh the patient profile and verify identity again.";
  await page.goto("/staff/patients/42");
  await verify(page);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(page.getByRole("alert")).toContainText("Refresh the patient profile");
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeDisabled();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Close recovery" }).click();
  await page.getByRole("button", { name: "Start account recovery" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("temporary password disappears at its expiry", async ({ page }) => {
  await page.clock.install();
  await mockApp(page);
  await page.goto("/staff/patients/42");
  await verify(page);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(page.getByText("012345", { exact: true })).toBeVisible();
  await page.clock.fastForward(30 * 60000);
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeDisabled();
});

for (const [name, patientPatch] of [
  ["unlinked", { account: null, user_id: null }],
  ["inactive", { account: { phone: "09123456789", is_active: 0, credential_version: 2 } }],
  ["archived", { archived_into_patient_id: 43 }],
  ["incomplete", { date_of_birth: null }],
]) {
  test(`${name} patient cannot start recovery`, async ({ page }) => {
    await mockApp(page, { patientPatch });
    await page.goto("/staff/patients/42");
    await expect(page.getByRole("button", { name: "Start account recovery" })).toBeDisabled();
  });
}

test("search handles invalid inputs, empty results, and server errors", async ({ page }) => {
  const state = await mockApp(page);
  await page.goto("/staff");
  await page.getByRole("button", { name: "Account recovery", exact: true }).click();
  const input = page.getByLabel("Patient name or mobile number");
  const search = page.getByRole("button", { name: "Search patients" });
  await input.fill("12"); await search.click();
  await expect(page.getByRole("alert")).toContainText("four mobile number digits");
  expect(state.searches).toHaveLength(0);
  await input.fill("Nobody"); await search.click();
  await expect(page.getByText("No matching patient records.")).toBeVisible();
  state.searchError = true;
  await input.fill("Ana"); await search.click();
  await expect(page.getByRole("alert")).toContainText("Unable to search");
});

test("admins can open recovery from patient management and return to their dashboard", async ({ page }) => {
  await mockApp(page, { role: "admin" });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Patients", exact: true }).click();
  await page.getByRole("link", { name: "Recover account for Ana Test" }).first().click();
  await expect(page).toHaveURL(/\/staff\/patients\/42$/);
  await expect(page.getByRole("button", { name: "Start account recovery" })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Admin dashboard" })).toHaveAttribute("href", "/admin");
});

test("patient temporary login requires password setup and saves the replacement session", async ({ page }) => {
  const state = await mockApp(page, { signedIn: false });
  await page.goto("/login");
  await page.locator('input[name="phone"]').fill("09123456789");
  await page.locator('input[name="password"]').fill("012345");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/change-password$/);
  await expect(page.locator('input[name="oldPassword"]')).toHaveCount(0);
  await page.locator('input[name="newPassword"]').fill("PatientPassword2");
  await page.locator('input[name="confirmPassword"]').fill("PatientPassword2");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/patient$/);
  expect(state.logins).toEqual([{ phone: "09123456789", password: "012345" }]);
  expect(state.passwordChanges).toEqual([{ newPassword: "PatientPassword2" }]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ek_user")).must_change_password)).toBe(false);
});
