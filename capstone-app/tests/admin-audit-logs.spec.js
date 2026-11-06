import { selectAdminSection } from "./helpers/admin";
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

  await selectAdminSection(page, 'Audit Logs');
  await expect(page.getByRole('heading', { name: 'Audit Logs', exact: true })).toBeVisible();
}

test('deactivation identifies the actor and target, shows the reason, and keeps IDs in details', async ({ page }) => {
  await setup(page);
  await page.route('**/api/admin/audit-logs?**', route => route.fulfill({ json: {
    events: [{
      ...sample, id: 261, actor_user_id: 4, actor_name: 'Jeric Napoles Marcos Jr', action: 'account.deactivated',
      target_type: 'user', target_id: 37, target_name: 'Maria Santos', target_role: 'doctor',
      reason: 'Account no longer needed', created_at: '2026-11-05T23:51:29.000Z',
      details: JSON.stringify({ assigned_role: 'doctor', changes: { is_active: { from: 1, to: 0 } } }),
    }, {
      ...sample, id: 262, action: 'account.reactivated', target_type: 'user', target_id: 38,
      details: { assigned_role: 'doctor', changes: { is_active: { from: 0, to: 1 } } },
    }],
    pagination: { page: 1, total: 2, totalPages: 1 },
  } }));
  await openAudit(page);
  const events = page.getByRole('list', { name: 'Audit events' });
  const entry = events.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Account deactivated' }) });
  await expect(entry.getByText('Jeric Napoles Marcos Jr deactivated Maria Santos (Doctor).')).toBeVisible();
  await expect(entry.getByText('Reason: Account no longer needed')).toBeVisible();
  await expect(entry.getByText('Nov 6, 2026 · 7:51 AM')).toBeVisible();
  const references = entry.getByText('Event #261 · Actor #4 · Target user #37');
  await expect(references).toBeHidden();
  await entry.getByText('View details', { exact: true }).click();
  await expect(entry.getByText('Account status', { exact: true })).toBeVisible();
  await expect(entry.getByText('Active → Deactivated')).toBeVisible();
  await expect(references).toBeVisible();
  await expect(events.getByText('Test Admin reactivated the doctor account.')).toBeVisible();
});

test('only failed and completed SMS recoveries appear in the action filter', async ({ page }) => {
  await setup(page);
  await page.route('**/api/admin/audit-logs?**', route => route.fulfill({ json: {
    events: ['failed', 'completed'].map((action, index) => ({ ...sample, id: index + 1,
      action: `password.recovery_${action}`, actor_user_id: index ? 7 : null,
      actor_name: index ? 'Ana Test' : 'Unauthenticated visitor', actor_role: index ? 'patient' : null,
      outcome: index ? 'success' : 'failed',
      details: { patient_name: 'Ana Test', patient_id: 42, phone: '*******6789', recovery_id: 'sample-recovery-id', recovery_status: action },
    })), pagination: { page: 1, total: 2, totalPages: 1 },
  } }));
  await openAudit(page);
  const events = page.getByRole('list', { name: 'Audit events' });
  await expect(events).toContainText('Recovery failed');
  await expect(events).toContainText('Recovery completed — password changed');
  await expect(events.getByText('Ana Test reset their password via SMS.')).toBeVisible();
  await expect(events.getByText('An SMS password recovery attempt for Ana Test failed.')).toBeVisible();
  const actions = page.getByRole('combobox', { name: 'Action', exact: true });
  await expect(actions.locator('option')).toHaveText([
    'All actions', 'Account created', 'Account deactivated', 'Account reactivated',
    'Temporary password issued', 'Temporary password replaced', 'Recovery completed — password changed',
    'Recovery failed', 'Patient records merged', 'Duplicate warning overridden',
    'SMS threshold changed', 'Admin sign-in', 'Access denied',
  ]);
  await actions.selectOption('password.recovery_completed');
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
