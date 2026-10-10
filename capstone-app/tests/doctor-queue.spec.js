import { test, expect } from '@playwright/test';
import { createTestToken } from './helpers/auth';

test('doctor calls first and opens treatment only after confirming presence', async ({ page }) => {
  await page.addInitScript(token => {
    localStorage.setItem('ek_user', JSON.stringify({ user_id: 4, role: 'doctor' }));
    localStorage.setItem('ek_token', token);
  }, createTestToken({ user_id: 4, role: 'doctor' }));
  const queue = { id: 1, queue_number: 'AQ01', status: 'waiting', category: 'dental', type: 'regular', services: ['CONSULTATION'], full_name: 'Test Patient' };
  const changes = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body = {};
    if (path === '/api/auth/profile') body = { data: { user_id: 4, role: 'doctor' } };
    else if (path === '/api/doctor/daily-settings') body = { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 };
    else if (path === '/api/queue') body = [queue];
    else if (path === '/api/queue/call-next') {
      Object.assign(queue, { status: 'called', call_count: 1, last_called_at: new Date().toISOString() });
      body = queue;
    } else if (path === '/api/queue/1/status') {
      changes.push(route.request().postDataJSON().status);
      queue.status = 'serving'; body = queue;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('/doctor');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Called — awaiting patient', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Consultation Notes' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start consultation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Consultation Notes' })).toBeVisible();
  expect(changes).toEqual(['serving']);
});
