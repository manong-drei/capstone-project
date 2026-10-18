import { test, expect } from '@playwright/test';
import { createTestToken } from './helpers/auth';

const roles = [
  { role: 'patient', name: 'Patient', task: /queue ticket/i },
  { role: 'doctor', name: 'Doctor', task: /consultation/i },
  { role: 'staff', name: 'Staff', task: /walk-in/i },
  { role: 'admin', name: 'Administrator', task: /accounts/i },
];

async function mockDashboard(page, role) {
  const user = { user_id: 8, role, display_name: 'Manual Reader' };
  const writes = [];
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem('ek_user', JSON.stringify(user));
    sessionStorage.setItem('ek_token', token);
  }, { user, token: createTestToken(user) });
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/api/**', route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push({ path, method: request.method() });
    const responses = {
      '/api/auth/profile': { data: user },
      '/api/queue': [],
      '/api/queue/me': null,
      '/api/queue/status': {},
      '/api/doctor': { data: [{ doctor_id: 1, first_name: 'Maria', last_name: 'Santos', is_available: 1 }] },
      '/api/doctor/daily-settings': { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 },
      '/api/admin/overview': { totalPatients: 0, totalDoctors: 1, totalAppointments: 0, completedQueues: 0 },
      '/api/admin/staff': { staff: [] },
      '/api/admin/patients': { patients: [] },
      '/api/admin/sms-settings': { data: { threshold: 5 } },
      '/api/admin/sms-jobs': { jobs: [] },
    };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(Object.hasOwn(responses, path) ? responses[path] : { data: [] }) });
  });
  return writes;
}

async function helpButton(page, role, mobile) {
  if (mobile && ['patient', 'doctor'].includes(role)) {
    await page.getByRole('button', { name: 'Toggle menu', exact: true }).click();
  }
  return page.getByRole('button', { name: 'Help', exact: true }).filter({ visible: true });
}

for (const { role, name, task } of roles) {
  for (const mobile of [false, true]) {
    test(`${name} Help provides a readable, linked manual on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }, testInfo) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
      const writes = await mockDashboard(page, role);
      await page.goto(`/${role}`);
      const help = await helpButton(page, role, mobile);
      const returnFocus = mobile && ['patient', 'doctor'].includes(role)
        ? page.getByRole('button', { name: 'Toggle menu', exact: true })
        : help;
      await expect(help).toBeVisible();
      const dashboardUrl = page.url();
      await help.click();

      const manual = page.getByRole('dialog', { name: `${name} user manual`, exact: true });
      await expect(manual).toBeVisible();
      if (mobile) await expect(manual.getByText(`${name} manual`, { exact: true })).toBeInViewport();
      await expect(manual.getByRole('heading', { name: `${name} user manual`, exact: true })).toBeVisible();
      await expect(manual).toContainText(task);
      const contents = manual.getByRole('navigation', { name: 'Manual contents', exact: true });
      for (const topic of ['Introduction', 'Queue guide', 'Troubleshooting', 'FAQs', 'Conclusion']) {
        await expect(contents.getByRole('link', { name: topic, exact: true })).toBeVisible();
      }
      expect(await contents.getByRole('link').count()).toBeGreaterThan(5);
      expect(await manual.getByRole('img').count()).toBeGreaterThan(0);
      for (const graphic of await manual.getByRole('img').all()) await expect(graphic).toHaveAccessibleName(/.+/);
      expect(await manual.getByRole('table').count()).toBeGreaterThan(0);
      expect(await manual.getByRole('columnheader').count()).toBeGreaterThan(0);

      const textProblems = await manual.evaluate(element => [...element.querySelectorAll('p, li, a, button, td, th, caption, dt, dd, summary, figcaption')]
        .filter(node => node.textContent.trim() && node.getClientRects().length && Number.parseFloat(getComputedStyle(node).fontSize) < 16)
        .map(node => ({ text: node.textContent.trim().slice(0, 80), fontSize: getComputedStyle(node).fontSize })));
      expect(textProblems).toEqual([]);
      const overflow = await manual.evaluate(element => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        dialog: element.scrollWidth - element.clientWidth,
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }));
      expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);
      expect(overflow.dialog).toBeLessThanOrEqual(1);
      expect(overflow.left).toBeGreaterThanOrEqual(0);
      expect(overflow.right).toBeLessThanOrEqual(overflow.viewport);
      await page.screenshot({ path: testInfo.outputPath(`${role}-manual-${mobile ? 'mobile' : 'desktop'}.png`), animations: 'disabled' });

      const conclusion = contents.getByRole('link', { name: 'Conclusion', exact: true });
      const sectionId = await conclusion.getAttribute('href');
      expect(sectionId).toMatch(/^#[\w-]+$/);
      const section = manual.locator(sectionId);
      await expect(section).not.toBeInViewport();
      await conclusion.click();
      await expect(section).toBeInViewport();
      await expect(manual.getByRole('heading', { name: 'Conclusion', exact: true })).toBeInViewport();
      if (mobile) {
        const shortcut = manual.getByRole('link', { name: 'Table of contents', exact: true });
        await expect(shortcut).toBeInViewport();
        await shortcut.click();
        await expect(contents.getByRole('heading', { name: 'Table of contents', exact: true })).toBeInViewport();
      }

      await contents.getByRole('link', { name: 'Screen guide', exact: true }).click();
      const screenshot = manual.locator('img').first();
      await expect(screenshot).toBeInViewport();
      await expect.poll(() => screenshot.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);

      await manual.getByRole('button', { name: 'Close manual', exact: true }).click();
      await expect(manual).not.toBeVisible();
      await expect(returnFocus).toBeFocused();
      expect(page.url()).toBe(dashboardUrl);

      await (await helpButton(page, role, mobile)).click();
      await expect(manual).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(manual).not.toBeVisible();
      await expect(returnFocus).toBeFocused();
      expect(page.url()).toBe(dashboardUrl);
      expect(writes).toEqual([]);
    });
  }
}

test('keyboard cannot reach dashboard controls while the manual is open', async ({ page }) => {
  await mockDashboard(page, 'patient');
  await page.goto('/patient');
  const help = await helpButton(page, 'patient', false);
  await help.click();
  const manual = page.getByRole('dialog', { name: 'Patient user manual', exact: true });
  await expect(manual).toBeVisible();
  const controlCount = await manual.evaluate(element => {
    const controls = [...element.querySelectorAll('button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')]
      .filter(node => !node.disabled && node.getClientRects().length);
    controls[0].focus();
    return controls.length;
  });
  expect(controlCount).toBeGreaterThan(5);
  await help.evaluate(element => element.focus());
  expect(await manual.evaluate(element => element.contains(document.activeElement))).toBe(true);
  for (const key of ['Shift+Tab', 'Tab']) {
    for (let index = 0; index < controlCount + 2; index++) {
      await page.keyboard.press(key);
      // Native dialogs allow moving into browser chrome, represented by body.
      expect(await manual.evaluate(element => element.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
  await expect(manual).not.toBeVisible();
  await expect(help).toBeFocused();
});

test('staff keeps an unfinished walk-in registration when closing Help', async ({ page }) => {
  const writes = await mockDashboard(page, 'staff');
  await page.goto('/staff');
  const name = page.getByLabel('Full name', { exact: true });
  const contact = page.getByLabel('Confirmed mobile number', { exact: true });
  await name.fill('Ana Santos');
  await contact.fill('9123456789');
  await page.getByRole('checkbox', { name: 'Dental Check-up', exact: true }).check();
  const help = await helpButton(page, 'staff', false);
  await help.click();
  const manual = page.getByRole('dialog', { name: 'Staff user manual', exact: true });
  await expect(manual).toBeVisible();
  await manual.getByRole('button', { name: 'Close manual', exact: true }).click();
  await expect(name).toHaveValue('Ana Santos');
  await expect(contact).toHaveValue('9123456789');
  await expect(page.getByRole('checkbox', { name: 'Dental Check-up', exact: true })).toBeChecked();
  expect(writes).toEqual([]);
});

test('administrator can open Help from an open mobile menu and resume scrolling after closing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockDashboard(page, 'admin');
  await page.goto('/admin');
  const previousOverflow = await page.evaluate(() => document.body.style.overflow);
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Close menu', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  const manual = page.getByRole('dialog', { name: 'Administrator user manual', exact: true });
  await expect(manual).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(manual).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeVisible();
  await expect(page.locator('#ad-sidebar')).not.toHaveClass(/ad-sidebar-open/);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(previousOverflow);
});
