import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockPatient(page) {
  await page.addInitScript((token) => {
    localStorage.setItem("ek_user", JSON.stringify({ user_id: 11, role: "patient" }));
    localStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 11, role: "patient" }));
  const state = { queue: { id: 1, queue_number: "AQ11", category: "dental", status: "waiting", type: "regular", services: ["CONSULTATION"] } };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body = { data: [] };
    if (path === "/api/auth/profile") body = { data: { user_id: 11, role: "patient", display_name: "Queue Patient" } };
    else if (path === "/api/queue/me") body = state.queue;
    else if (path === "/api/queue/status") body = {};
    else if (path === "/api/doctor") body = { data: [{ doctor_id: 1, is_available: 1 }] };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.clock.install();
  return state;
}

for (const [type, ticket] of [["regular", "AQ11"], ["priority", "AP11"]]) {
  test(`patient displays the assigned ${ticket} ticket`, async ({ page }) => {
    const state = await mockPatient(page);
    Object.assign(state.queue, { type, queue_number: ticket });
    await page.goto("/patient");
    await expect(page.getByText(ticket, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Get queue number/ })).toBeDisabled();
  });
}

test("patient clears a staff-cancelled ticket on the next poll", async ({ page }) => {
  const state = await mockPatient(page);
  await page.goto("/patient");
  const joinQueue = page.getByRole("button", { name: /Get queue number/ });
  await expect(joinQueue).toBeDisabled();
  state.queue = null;
  await page.clock.fastForward(15_000);
  await expect(joinQueue).toBeEnabled();
  await expect(page.getByText("Your Queue Number", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(joinQueue).toBeEnabled();
});

for (const status of ["", "cancelled", "done"]) {
  test(`a ${JSON.stringify(status)} ticket does not keep the patient in the active queue`, async ({ page }) => {
    const state = await mockPatient(page);
    state.queue.status = status;
    await page.goto("/patient");
    await expect(page.getByRole("heading", { name: /Your Health, Schedule/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Get queue number/ })).toBeEnabled();
    await expect(page.getByText("Your Queue Number", { exact: true })).toHaveCount(0);
  });
}

for (const status of ['called', 'missed']) {
  test(`${status} tickets stay active and show actionable instructions`, async ({ page }) => {
    const state = await mockPatient(page);
    Object.assign(state.queue, { status, grace_expires_at: '2026-10-10T09:10:00+08:00' });
    await page.goto('/patient');
    await expect(page.getByRole('button', { name: /Get queue number/ })).toBeDisabled();
    if (status === 'missed') await expect(page.getByRole('status')).toContainText('You missed your call. Report to staff before 9:10 AM to keep this ticket.');
    else await expect(page.getByRole('status')).toContainText('Please report to staff now');
  });
}

test('expired no-show explains closure and permits requesting a new ticket', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue.status = 'no_show';
  state.queue.status_reason = 'No-show — did not return within 10 minutes';
  await page.goto('/patient');
  await expect(page.getByRole('button', { name: /Get queue number/ })).toBeEnabled();
  await expect(page.getByRole('status')).toContainText('This ticket ended as a no-show.');
  await expect(page.getByRole('status')).toContainText('did not return within 10 minutes');
});
