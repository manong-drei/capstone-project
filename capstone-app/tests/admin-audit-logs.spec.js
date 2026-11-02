import { test, expect } from '@playwright/test';
import { createTestToken } from './helpers/auth';

test.use({ timezoneId: 'UTC' });

const sample = {
  id: 21, actor_user_id: 8, actor_name: 'Test Admin', actor_role: 'admin', is_development: 0,
  action: 'sms.threshold_changed', target_type: 'sms_settings', target_id: 1, outcome: 'success',
  reason: null, ip_address: '127.0.0.1', created_at: '2026-10-28T16:30:00.000Z',
  details: { changes: { threshold: { from: 5, to: 7 } } },
};

async function setup(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.addInitScript(token => {
    sessionStorage.setItem('ek_user', JSON.stringify({ user_id: 8, role: 'admin' }));
    sessionStorage.setItem('ek_token', token);
  }, createTestToken({ user_id: 8, role: 'admin' }));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const data = {
      '/api/auth/profile': { data: { role: 'admin', user_id: 8, display_name: 'Test Admin' } },
      '/api/admin/overview': {}, '/api/doctor': { data: [] }, '/api/queue': [],
      '/api/appointments': { data: [], summary: {}, pagination: { page: 1, total: 0, totalPages: 1 } },
    };
    return route.fulfill({ json: data[path] || {} });
  });
}

async function openAudit(page, width = 1440) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/admin');
  if (width < 1024) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Audit Logs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Audit Logs', exact: true })).toBeVisible();
}

test('patient recovery requests and completed password changes identify the patient without exposing codes', async ({ page }) => {
  await setup(page);
  await page.route('**/api/admin/audit-logs?**', route => route.fulfill({ json: {
    events: ['requested', 'completed'].map((action, index) => ({ ...sample, id: index + 1,
      action: `password.recovery_${action}`, actor_user_id: index ? 7 : null,
      actor_name: index ? 'Ana Test' : 'Unauthenticated visitor', actor_role: index ? 'patient' : null,
      details: { patient_name: 'Ana Test', patient_id: 42, phone: '*******6789', recovery_id: 'sample-recovery-id', recovery_status: index ? 'completed' : 'pending' },
    })), pagination: { page: 1, total: 2, totalPages: 1 },
  } }));
  await openAudit(page);
  const events = page.getByRole('list', { name: 'Audit events' });
  await expect(events).toContainText('Recovery requested');
  await expect(events).toContainText('Recovery completed — password changed');
  await expect(events.getByText('Patient: Ana Test · *******6789', { exact: true })).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Action', exact: true }).selectOption('password.recovery_completed');
});

for (const width of [1440, 375]) {
  test(`audit history filters, details and pagination work at ${width}px`, async ({ page }, testInfo) => {
    await setup(page);
    const requests = [];
    await page.route('**/api/admin/audit-logs?**', route => {
      expect(route.request().method()).toBe('GET');
      const params = new URL(route.request().url()).searchParams;
      requests.push(Object.fromEntries(params));
      const current = Number(params.get('page'));
      const filtered = params.get('action') === 'access.denied';
      return route.fulfill({ json: {
        events: filtered ? [{ ...sample, id: 3, action: 'access.denied', outcome: 'denied', is_development: 1, details: { http_status: 403 } }]
          : [{ ...sample, id: current === 1 ? 21 : 1 }],
        pagination: { page: current, limit: 20, total: filtered ? 1 : 21, totalPages: filtered ? 1 : 2 },
      } });
    });
    await openAudit(page, width);
    const list = page.getByRole('list', { name: 'Audit events' });
    await expect(list).toContainText('SMS threshold changed');
    await expect(list).toContainText('Oct 29, 2026');
    await list.getByText('View details', { exact: true }).click();
    await expect(list).toContainText('5 → 7');
    await expect(list).toContainText('127.0.0.1');
    await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
    await page.getByLabel('From date', { exact: true }).fill('2026-10-29');
    await page.getByLabel('To date', { exact: true }).fill('2026-10-29');
    await page.getByLabel('Admin name or ID', { exact: true }).fill('Test Admin');
    await page.getByRole('combobox', { name: 'Action', exact: true }).selectOption('access.denied');
    await page.getByRole('combobox', { name: 'Outcome', exact: true }).selectOption('denied');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(list).toContainText('Access denied');
    await expect(list).toContainText('Development session');
    await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible();
    expect(requests.at(-1)).toMatchObject({ dateFrom: '2026-10-29', dateTo: '2026-10-29', actor: 'Test Admin', action: 'access.denied', outcome: 'denied', page: '1' });
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(list).toContainText('SMS threshold changed');
    expect(requests.at(-1).action).toBe('');
    await page.getByRole('button', { name: 'Refresh audit logs' }).click();
    await expect(list).toContainText('SMS threshold changed');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`audit-logs-${width}.png`), animations: 'disabled', fullPage: true });
  });
}

test('audit history distinguishes loading, failure and empty results and recovers on retry', async ({ page }) => {
  await setup(page);
  let mode = 'failure'; let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/admin/audit-logs?**', async route => {
    if (mode === 'failure') { await pending; return route.fulfill({ status: 503, json: { message: 'Audit history unavailable.' } }); }
    return route.fulfill({ json: { events: mode === 'empty' ? [] : [sample], pagination: { page: 1, total: mode === 'empty' ? 0 : 1, totalPages: 1 } } });
  });
  await openAudit(page);
  await expect(page.getByRole('status')).toHaveText('Loading audit logs…');
  await expect(page.getByText('No audit logs match these filters.')).toHaveCount(0);
  release();
  await expect(page.getByRole('alert')).toContainText('Audit history unavailable.');
  mode = 'empty'; await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('No audit logs match these filters.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  mode = 'success'; await page.getByRole('button', { name: 'Refresh audit logs' }).click();
  await expect(page.getByRole('list', { name: 'Audit events' })).toContainText('SMS threshold changed');
});
