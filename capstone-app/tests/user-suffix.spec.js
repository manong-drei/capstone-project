import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockUsers(page, role = "admin") {
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.addInitScript(({ token, role }) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role, display_name: "Test User" }));
    sessionStorage.setItem("ek_token", token);
  }, { token: createTestToken({ user_id: 8, role }), role });
  const state = {
    writes: [],
    staff: [
      { user_id: 9, first_name: "Mario", middle_name: "Cruz", last_name: "Santos", suffix: "Jr.", email: "mario@example.com", phone: "09123456789", role: "doctor", license_number: "PRC-123", is_active: true },
      { user_id: 10, first_name: "Juan", middle_name: "Reyes", last_name: "Dela Cruz", suffix: "III", email: "juan@example.com", phone: "09123456780", role: "staff", position: "Clerk", is_active: true },
    ],
    patients: [
      { user_id: 21, patient_id: 21, first_name: "Juan Pedro", middle_name: " santos ", last_name: "Dela Cruz", suffix: "Jr.", full_name: "Juan Pedro Santos Dela Cruz Jr.", contact_number: "09123456788", barangay: "Poblacion", is_active: true },
      { user_id: 22, first_name: "Ana", middle_name: null, last_name: "Reyes", suffix: null, full_name: "Ana Reyes", phone: "09987654321", barangay: "Abuanan", is_active: true },
    ],
  };
  const patient = { patient_id: 20, first_name: "Returning", middle_name: "Cruz", last_name: "Patient", suffix: "Sr.", date_of_birth: "1960-01-01", gender: "Male", barangay: "Abuanan", contact_number: "09123456789", masked_contact: "*******6789", visits: [] };
  await page.route("**/api/**", route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") {
      const data = request.postDataJSON();
      state.writes.push({ path, data });
      if (request.method() === "PUT" && path.startsWith("/api/admin/staff/")) {
        Object.assign(state.staff.find(member => member.user_id === Number(path.split("/").at(-1))), data);
      }
      return route.fulfill({ json: path === "/api/queue/walkin"
        ? { queue: { queue_number: "Q03", sms_initial_position: 2, sms_alert_state: "suppressed" } }
        : { success: true } });
    }
    const responses = {
      "/api/auth/profile": { data: { user_id: 8, role, display_name: "Test User" } },
      "/api/admin/overview": {},
      "/api/doctor": { data: [] },
      "/api/appointments": { data: [] },
      "/api/admin/staff": { staff: state.staff },
      "/api/admin/patients": { patients: state.patients },
      "/api/queue": [],
      "/api/patients/search": { data: [patient] },
      "/api/patients/20": { data: patient },
    };
    return route.fulfill({ json: responses[path] ?? { data: [] } });
  });
  return state;
}

async function openAccounts(page, width) {
  await page.goto("/admin");
  if (width <= 900) await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#ad-sidebar").getByRole("button", { name: "Accounts", exact: true }).click();
  if (width <= 900) await expect(page.locator("#ad-sidebar")).not.toBeInViewport();
}

// Older account fields use visual labels without htmlFor associations.
function accountField(page, name) {
  return page.locator("label").filter({ hasText: new RegExp(`^${name}$`) }).locator("..").locator("input, select");
}

for (const width of [1440, 375]) {
  test(`patient creation saves and resets optional name fields at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await mockUsers(page);
    await openAccounts(page, width);
    await page.getByRole("button", { name: "Patients", exact: true }).click();
    await page.getByRole("button", { name: "Add Patient", exact: true }).click();
    const middle = page.getByLabel("Middle Name (optional)", { exact: true });
    const suffix = page.getByLabel("Suffix (optional)", { exact: true });
    await expect(middle).toBeVisible();
    await expect(suffix).toBeVisible();
    await expect(middle).toHaveAttribute("maxlength", "100");
    await expect(suffix).toHaveAttribute("maxlength", "20");
    await page.getByPlaceholder("Juan", { exact: true }).fill("Pedro");
    await middle.fill("Reyes");
    await page.getByPlaceholder("Dela Cruz", { exact: true }).fill("Santos");
    await suffix.fill("Jr.");
    await page.getByPlaceholder("09XX XXX XXXX").fill("09123456789");
    await accountField(page, "Date of Birth").fill("1990-01-01");
    await accountField(page, "Gender").selectOption("Male");
    await accountField(page, "Address / Barangay").selectOption("Abuanan");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`patient-name-fields-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Create Account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "New Patient Account", exact: true })).toHaveCount(0);
    expect(state.writes).toContainEqual({ path: "/api/admin/patients", data: expect.objectContaining({ first_name: "Pedro", middle_name: "Reyes", last_name: "Santos", suffix: "Jr." }) });
    await page.getByRole("button", { name: "Add Patient", exact: true }).click();
    await expect(middle).toHaveValue("");
    await expect(suffix).toHaveValue("");
  });

  test(`staff creation accepts empty optional name fields at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await mockUsers(page);
    await openAccounts(page, width);
    await expect(page.getByText("mario@example.com", { exact: true }).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: "Add Staff", exact: true }).click();
    await accountField(page, "Role").selectOption("staff");
    await expect(page.getByLabel("Middle Name (optional)", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Suffix (optional)", { exact: true })).toBeVisible();
    await page.getByPlaceholder("Juan", { exact: true }).fill("Ana");
    await page.getByPlaceholder("Dela Cruz", { exact: true }).fill("Reyes");
    await page.getByPlaceholder("09XX XXX XXXX").fill("09123456789");
    await page.getByPlaceholder("doctor@bago.gov.ph").fill("ana@example.com");
    await page.getByPlaceholder("Temporary password").fill("Password123!");
    await page.getByPlaceholder("e.g. Nurse, Clerk").fill("Clerk");
    await page.getByRole("button", { name: "Create Account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "New Staff Account", exact: true })).toHaveCount(0);
    expect(state.writes).toContainEqual({ path: "/api/admin/staff", data: expect.objectContaining({ role: "staff", middle_name: "", suffix: "" }) });
  });

  test(`returning walk-in patient prefills and submits optional names at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await mockUsers(page, "staff");
    await page.goto("/staff");
    await page.getByLabel("Find an existing patient").fill("Returning");
    await page.getByRole("button", { name: /Returning Cruz Patient Sr\. · 1960-01-01/ }).click();
    const form = page.getByRole("form", { name: "Dental walk-in registration" });
    const middle = form.getByLabel("Middle name (optional)", { exact: true });
    const suffix = form.getByLabel("Suffix (optional)", { exact: true });
    await expect(middle).toBeVisible();
    await expect(middle).toHaveValue("Cruz");
    await expect(suffix).toBeVisible();
    await expect(suffix).toHaveValue("Sr.");
    await form.getByRole("checkbox", { name: "Dental Check-up", exact: true }).check();
    await form.getByRole("button", { name: "Register and assign dental queue" }).click();
    await expect(form.getByRole("status")).toContainText("queue number Q03");
    expect(state.writes).toContainEqual({ path: "/api/queue/walkin", data: expect.objectContaining({ patient_id: 20, middle_name: "Cruz", suffix: "Sr." }) });
    await expect(middle).toHaveValue("");
    await expect(suffix).toHaveValue("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const [role, id, email, middleName, suffixValue] of [
  ["doctor", 9, "mario@example.com", "Cruz", "Jr."],
  ["staff", 10, "juan@example.com", "Reyes", "III"],
]) {
  test(`${role} editing prefills, changes, and clears optional name fields`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const state = await mockUsers(page);
    await openAccounts(page, 1440);
    const row = page.locator(".sm-table-row").filter({ hasText: email });
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    const middle = page.getByLabel("Middle Name (optional)", { exact: true });
    const suffix = page.getByLabel("Suffix (optional)", { exact: true });
    await expect(middle).toHaveValue(middleName);
    await expect(suffix).toHaveValue(suffixValue);
    await middle.fill("Garcia");
    await suffix.fill("IV");
    await page.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(row).toBeVisible();
    await expect(row.locator(":scope > span").nth(2)).toHaveText("G.");
    await expect(row.locator(":scope > span").nth(3)).toHaveText("IV");
    expect(state.writes.at(-1)).toMatchObject({ path: `/api/admin/staff/${id}`, data: { middle_name: "Garcia", suffix: "IV" } });
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(middle).toHaveValue("Garcia");
    await expect(suffix).toHaveValue("IV");
    await middle.clear();
    await suffix.clear();
    await page.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Edit Staff Account", exact: true })).toHaveCount(0);
    expect(state.writes.at(-1)).toMatchObject({ path: `/api/admin/staff/${id}`, data: { middle_name: "", suffix: "" } });
    await expect(row.locator(":scope > span").nth(2)).toHaveText("—");
    await expect(row.locator(":scope > span").nth(3)).toHaveText("—");
  });
}

for (const width of [1440, 1024, 375]) {
  test(`account lists separate name fields and show phone numbers at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockUsers(page);
    await openAccounts(page, width);
    const labels = ["Last name", "First name", "Middle initial", "Suffix"];
    if (width > 900) {
      await expect(page.locator(".sm-table-head > span")).toHaveText([...labels, "Phone number", "Email", "Role", "Status", "Actions"]);
      await expect(page.locator(".sm-table-row").first().locator(":scope > span")).toHaveText(["Santos", "Mario", "C.", "Jr.", "09123456789", "mario@example.com", "doctor", "Active"]);
    } else {
      const card = page.locator(".sm-cards-mobile > div").first();
      await expect(card.locator("dt")).toHaveText(labels);
      await expect(card.locator("dd")).toHaveText(["Santos", "Mario", "C.", "Jr."]);
      await expect(card.getByText("Phone number: 09123456789", { exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`staff-display-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Patients", exact: true }).click();
    if (width > 900) {
      await expect(page.locator(".pm-table-head > span")).toHaveText([...labels, "Phone number", "Barangay", "Status", "Actions"]);
      const rows = page.locator(".pm-table-row");
      await expect(rows.first().locator(":scope > span")).toHaveText(["Dela Cruz", "Juan Pedro", "S.", "Jr.", "09123456788", "Poblacion", "Active"]);
      await expect(rows.nth(1).locator(":scope > span")).toHaveText(["Reyes", "Ana", "—", "—", "09987654321", "Abuanan", "Active"]);
    } else {
      const cards = page.locator(".pm-cards-mobile > div");
      await expect(cards.first().locator("dt")).toHaveText(labels);
      await expect(cards.first().locator("dd")).toHaveText(["Dela Cruz", "Juan Pedro", "S.", "Jr."]);
      await expect(cards.first().getByText("Phone number: 09123456788", { exact: true })).toBeVisible();
      await expect(cards.nth(1).locator("dd")).toHaveText(["Reyes", "Ana", "—", "—"]);
      await expect(cards.nth(1).getByText("Phone number: 09987654321", { exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`patient-display-${width}.png`), fullPage: true });
    await page.getByPlaceholder("Search by name, phone number, or barangay...").fill("09987654321");
    await expect(page.getByText("Showing 1–1 of 1", { exact: true })).toBeVisible();
  });
}
