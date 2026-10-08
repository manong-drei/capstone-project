import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockPatient(page) {
  await page.addInitScript((token) => {
    localStorage.setItem("ek_user", JSON.stringify({ user_id: 11, role: "patient" }));
    localStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 11, role: "patient" }));
  const state = { queue: { id: 1, queue_number: "Q-011", category: "dental", status: "waiting", type: "regular", services: ["CONSULTATION"] } };
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

for (const status of ["no_show", "", "cancelled", "done"]) {
  test(`a ${JSON.stringify(status)} ticket does not keep the patient in the active queue`, async ({ page }) => {
    const state = await mockPatient(page);
    state.queue.status = status;
    await page.goto("/patient");
    await expect(page.getByRole("heading", { name: /Your Health, Schedule/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Get queue number/ })).toBeEnabled();
    await expect(page.getByText("Your Queue Number", { exact: true })).toHaveCount(0);
  });
}
