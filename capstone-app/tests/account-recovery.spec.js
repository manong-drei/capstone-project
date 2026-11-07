import { selectAdminSection } from "./helpers/admin";
import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockApp(page, { role = "staff", signedIn = true, patientPatch = {} } = {}) {
  if (signedIn) await page.addInitScript(({ role, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role }));
    sessionStorage.setItem("ek_token", token);
  }, { role, token: createTestToken({ user_id: 8, role, credential_version: 1 }) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  const state = {
    recoveries: [], passwordChecks: [], searches: [], logins: [], passwordChanges: [], recoveryError: "", searchError: false,
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
    else if (url.pathname === "/api/patients/42/account-recovery/verify-password") {
      state.passwordChecks.push(req.postDataJSON());
      if (req.postDataJSON().staff_password !== "StaffPassword1") { status = 403; body = { message: "Your password is incorrect." }; }
    }
    else if (url.pathname === "/api/patients/42/account-recovery") {
      state.recoveries.push(req.postDataJSON());
      if (req.postDataJSON().staff_password !== "StaffPassword1") { status = 403; body = { message: "Your password is incorrect." }; }
      else if (state.recoveryError) { status = 409; body = { message: state.recoveryError }; }
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
    else if (url.pathname === "/api/admin/patients") body = { patients: [{ ...state.patient, full_name: "Ana Test", is_active: 1 }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    else if (url.pathname === "/api/admin/overview") body = { stats: {}, recentPatients: [], recentActivity: [] };
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return state;
}

async function openRecovery(page) {
  await page.getByRole("button", { name: "Start account recovery" }).click();
  await page.getByLabel("Your password", { exact: true }).fill("StaffPassword1");
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeEnabled();
}

test("login offers SMS recovery and explains the in-person fallback", async ({ page }) => {
  const state = await mockApp(page, { signedIn: false });
  await page.goto("/login");
  const help = page.getByRole("button", { name: "Forgot password?" });
  await expect(help).toHaveAttribute("aria-expanded", "false");
  await help.click();
  await expect(page.getByRole("heading", { name: "Recover your account" })).toBeVisible();
  await expect(page.getByLabel("Registered mobile number")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Recover your account" })).toContainText("Visit clinic reception for identity verification");
  expect(state.recoveries).toHaveLength(0);
  expect(state.searches).toHaveLength(0);
  await page.getByRole('button', { name: 'Close password recovery' }).click();
  await expect(page.getByRole("dialog", { name: "Recover your account" })).toHaveCount(0);
});

test("staff submits their password in the recovery modal, denies a wrong password, and clears secrets on close and navigation", async ({ page }) => {
  const state = await mockApp(page);
  await page.goto("/staff");
  await page.getByRole("button", { name: "Account recovery", exact: true }).click();
  await page.getByLabel("Patient name or mobile number").fill("6789");
  await page.getByRole("button", { name: "Search patients" }).click();
  await page.getByRole("link", { name: /Ana Test/ }).click();
  expect(state.searches).toEqual([{ phone: "6789" }]);
  await expect(page.getByRole("region", { name: "Ana Test" })).toContainText("Jan 1, 1990");
  await page.getByRole("button", { name: "Start account recovery" }).click();
  const modal = page.getByRole("dialog", { name: "Account recovery", exact: true });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("checkbox")).toHaveCount(0);
  await expect(modal.getByRole("region", { name: "Personal information" })).toContainText("Ana Test");
  await expect(modal).toContainText("Jan 1, 1990");
  await expect(modal).toContainText("Female");
  await expect(modal).toContainText("09987654321");
  await expect(modal).toContainText("Abuanan, Bago City");
  await expect(modal).not.toContainText("09123456789");
  await expect(modal.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
  const password = modal.getByLabel("Your password", { exact: true });
  await expect(password).toBeFocused();
  const issue = page.getByRole("button", { name: "Issue temporary password" });
  await expect(issue).toBeDisabled();
  await password.fill("WrongPassword1");
  await expect(issue).toBeEnabled();
  await expect(modal.getByRole("alert")).toHaveCount(0);
  expect(state.recoveries).toHaveLength(0);
  await issue.click();
  await expect(modal.getByRole("alert")).toContainText("Your password is incorrect");
  await expect(issue).toBeDisabled();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  expect(state.patient.account.credential_version).toBe(2);
  await password.fill("StaffPassword1");
  await expect(issue).toBeEnabled();
  await password.fill("StaffPassword1x");
  await expect(issue).toBeEnabled();
  await password.fill("StaffPassword1");
  await expect(issue).toBeEnabled();
  expect(state.passwordChecks).toHaveLength(0);
  await page.screenshot({ path: "test-results/account-recovery-modal-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/account-recovery-modal-mobile.png", fullPage: true });
  expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const close = modal.getByRole("button", { name: "Close recovery", exact: true });
  await expect(close).toHaveText("");
  await close.click();
  expect(state.recoveries).toHaveLength(1);
  await expect(page.getByRole("button", { name: "Start account recovery" })).toBeFocused();
  await openRecovery(page);
  await issue.click();
  await expect(page.getByText("012345", { exact: true })).toBeVisible();
  expect(state.recoveries).toEqual([
    { expected_credential_version: 2, confirmed_phone: "09123456789", staff_password: "WrongPassword1" },
    { expected_credential_version: 2, confirmed_phone: "09123456789", staff_password: "StaffPassword1" },
  ]);
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(storage).not.toContain("012345");
  expect(storage).not.toContain("StaffPassword1");
  await page.screenshot({ path: "test-results/account-recovery-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/account-recovery-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await close.click();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Start account recovery" }).click();
  await expect(password).toHaveValue("");
  await expect(issue).toBeDisabled();
  await password.fill("StaffPassword1");
  await expect(issue).toBeEnabled();
  await issue.click();
  await expect(page.getByText("012345", { exact: true })).toBeVisible();
  expect(state.recoveries.at(-1).expected_credential_version).toBe(3);
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Back to staff dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/staff$/);
  await expect(page.getByRole("heading", { name: "Dental queue management", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "Start account recovery" })).toBeVisible();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
});

test("recovery clears errors and requires the staff password again after a stale account rejection", async ({ page }) => {
  const state = await mockApp(page);
  state.recoveryError = "This account has changed. Refresh the patient profile and verify identity again.";
  await page.goto("/staff/patients/42");
  await openRecovery(page);
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
  await openRecovery(page);
  await page.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(page.getByText("012345", { exact: true })).toBeVisible();
  await page.clock.fastForward(30 * 60000);
  await expect(page.getByText("012345", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeDisabled();
});

test("typing and clearing a password sends no verification request, and reopening clears the password visibility", async ({ page }) => {
  await page.clock.install();
  const state = await mockApp(page);
  await page.goto("/staff/patients/42");
  await page.getByRole("button", { name: "Start account recovery" }).click();
  const password = page.getByLabel("Your password", { exact: true });
  await password.fill("WrongPassword1");
  await page.clock.fastForward(1000);
  expect(state.passwordChecks).toHaveLength(0);
  expect(state.recoveries).toHaveLength(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeEnabled();
  await page.getByRole("button", { name: "Show staff password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await password.fill("");
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeDisabled();
  await expect(page.getByText("Password confirmed", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Start account recovery" }).click();
  await expect(password).toHaveValue("");
  await expect(password).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeDisabled();
});

test("recovery errors allow retry, and pending issuance prevents duplicate requests and closing", async ({ page }) => {
  const state = await mockApp(page);
  await page.route("**/patients/42/account-recovery", route => route.fulfill({ status: 503, json: { message: "Unable to recover this account. Please try again." } }));
  await page.goto("/staff/patients/42");
  await page.getByRole("button", { name: "Start account recovery" }).click();
  await page.getByLabel("Your password", { exact: true }).fill("StaffPassword1");
  await page.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to recover");
  await expect(page.getByRole("button", { name: "Issue temporary password" })).toBeDisabled();
  await page.unroute("**/patients/42/account-recovery");
  await page.getByRole("button", { name: "Close recovery", exact: true }).click();
  await openRecovery(page);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route("**/patients/42/account-recovery", async route => { await pending; await route.fallback(); });
  await page.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(page.getByRole("button", { name: "Issuing…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Close recovery", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Your password", { exact: true })).toBeDisabled();
  await page.locator("#account-recovery-panel form").evaluate(form => form.requestSubmit());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Account recovery", exact: true })).toBeVisible();
  release();
  await expect(page.getByText("012345", { exact: true })).toBeVisible();
  expect(state.recoveries).toHaveLength(1);
});

test("recovery remains usable on narrow phones, tablets, desktops, and short landscape screens", async ({ page }) => {
  await mockApp(page);
  await page.goto("/staff/patients/42");
  await openRecovery(page);
  const modal = page.getByRole("dialog", { name: "Account recovery", exact: true });
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 640, height: 800 }, { width: 768, height: 1024 },
    { width: 1024, height: 768 }, { width: 1440, height: 900 },
    { width: 1920, height: 1080 }, { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const bounds = await modal.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const personal = await modal.getByRole("region", { name: "Personal information" }).boundingBox();
    const form = await modal.locator("form").boundingBox();
    if (viewport.width < 640) expect(form.y).toBeGreaterThan(personal.y + personal.height - 1);
    else expect(form.x).toBeGreaterThan(personal.x + personal.width - 1);
    await modal.getByRole("button", { name: "Issue temporary password" }).scrollIntoViewIfNeeded();
    await expect(modal.getByRole("button", { name: "Issue temporary password" })).toBeInViewport();
    await expect(modal.getByRole("button", { name: "Close recovery", exact: true })).toBeInViewport();
  }
});

test("long patient details and recovery error and success states fit a small phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await mockApp(page, { patientPatch: { first_name: "Alexandria".repeat(8), barangay: "LongBarangayName".repeat(10), gender: null } });
  await page.goto("/staff/patients/42");
  await openRecovery(page);
  const modal = page.getByRole("dialog", { name: "Account recovery", exact: true });
  await expect(modal).toContainText("Not recorded");
  expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await modal.getByLabel("Your password", { exact: true }).fill("WrongPassword1");
  await modal.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(modal.getByRole("alert")).toContainText("Your password is incorrect");
  expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await modal.getByLabel("Your password", { exact: true }).fill("StaffPassword1");
  await modal.getByRole("button", { name: "Issue temporary password" }).click();
  await expect(modal.getByText("012345", { exact: true })).toBeVisible();
  expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(modal.getByRole("button", { name: "Close recovery", exact: true })).toBeInViewport();
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
  await selectAdminSection(page, "Accounts");
  await page.getByRole("button", { name: "Patients", exact: true }).click();
  await page.getByRole("link", { name: "Recover account for Ana Test" }).first().click();
  await expect(page).toHaveURL(/\/admin\/patients\/42$/);
  await expect(page.getByRole("button", { name: "Start account recovery" })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Back to admin dashboard", exact: true })).toHaveAttribute("href", "/admin");
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
  const terms = page.getByRole("dialog", { name: "Terms, Privacy & Consent" });
  await expect(terms).toBeVisible();
  expect(state.passwordChanges).toEqual([]);
  await terms.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(/\/change-password$/);
  await page.getByRole("button", { name: "Update Password" }).click();
  const policy = terms.locator('[tabindex="0"]');
  await expect(policy).toBeFocused();
  await policy.press("End");
  await terms.getByRole("checkbox").check();
  await terms.getByRole("button", { name: "Accept & Continue" }).click();
  await expect(page).toHaveURL(/\/patient$/);
  expect(state.logins).toEqual([{ phone: "09123456789", password: "012345" }]);
  expect(state.passwordChanges).toEqual([{ newPassword: "PatientPassword2" }]);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("ek_user")).must_change_password)).toBe(false);
});
