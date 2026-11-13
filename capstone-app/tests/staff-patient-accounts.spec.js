import { test, expect } from '@playwright/test';
import { createTestToken } from './helpers/auth';

for (const width of [390, 1440]) {
  test(`staff creates and reads accounts without management controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const user = { user_id: 8, role: 'staff', display_name: 'Test Staff' };
    await page.addInitScript(({ user, token }) => {
      sessionStorage.setItem('ek_user', JSON.stringify(user));
      sessionStorage.setItem('ek_token', token);
    }, { user, token: createTestToken(user) });
    const patients = [{ user_id: 20, patient_id: 30, first_name: 'Existing', last_name: 'Patient', full_name: 'Existing Patient', is_active: 1, must_change_password: 1 }];
    patients.push({ user_id: 22, patient_id: 32, first_name: "Inactive", last_name: "Patient", full_name: "Inactive Patient", is_active: 0 });
    let created;
    let version = 2;
    const recoveries = [];
    await page.route('**/api/**', async route => {
      const req = route.request();
      const url = new URL(req.url());
      let body = {};
      if (url.pathname === '/api/auth/profile') body = { data: user };
      else if (url.pathname === '/api/queue') body = [];
      else if (url.pathname === '/api/doctor') body = { data: [] };
      else if (url.pathname === '/api/patients/30') body = { data: {
        ...patients[0], date_of_birth: '1990-01-01', gender: 'Female', barangay: 'Poblacion', city: 'Bago City',
        contact_number: '09123456789', account: { is_active: 1, phone: '09123456789', credential_version: version },
      } };
      else if (url.pathname === '/api/patients/30/account-recovery') {
        const data = req.postDataJSON();
        recoveries.push(data);
        if (data.staff_password !== 'StaffPassword1') {
          await route.fulfill({ status: 403, json: { message: 'Your password is incorrect.' } });
          return;
        }
        version++;
        body = { data: { temp_password: '012345', registered_phone: '09123456789', expires_at: new Date(Date.now() + 1800000).toISOString() } };
      }
      else if (url.pathname === '/api/admin/patients') {
        if (req.method() === 'POST') {
          created = req.postDataJSON();
          patients.push({ ...created, user_id: 21, patient_id: 31, full_name: `${created.first_name} ${created.last_name}`, is_active: 1 });
          body = { success: true, sms_status: 'queued' };
        } else body = { patients, pagination: { total: patients.length, page: 1 } };
      } else throw new Error(`Unexpected request: ${req.method()} ${url.pathname}`);
      await route.fulfill({ json: body });
    });
    await page.goto('/staff');
    await page.getByRole('link', { name: 'Patient accounts', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Patient Accounts', exact: true })).toBeVisible();
    await expect(page.getByText('Existing', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /deactivate|reactivate|replacement password/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /recover account/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Account recovery', exact: true })).toHaveCount(0);
    const recovery = page.getByRole('button', { name: 'Recover account for Existing Patient', exact: true }).filter({ visible: true });
    const inactive = page.getByRole('button', { name: 'Recover account for Inactive Patient', exact: true }).filter({ visible: true });
    await expect(inactive).toBeDisabled();
    await expect(page.getByText('Inactive accounts cannot be recovered. Contact an admin.', { exact: true }).filter({ visible: true })).toBeVisible();
    await recovery.click();
    const modal = page.getByRole('dialog', { name: 'Account recovery', exact: true });
    await expect(modal).toContainText('Existing Patient');
    await expect(modal).toContainText('Poblacion, Bago City');
    const password = modal.getByLabel('Your password', { exact: true });
    const issue = modal.getByRole('button', { name: 'Issue temporary password' });
    await expect(issue).toBeDisabled();
    await password.fill('WrongPassword1');
    await issue.click();
    await expect(modal.getByRole('alert')).toContainText('Your password is incorrect.');
    await expect(password).toHaveValue('');
    await password.fill('StaffPassword1');
    await issue.click();
    await expect(modal.getByText('012345', { exact: true })).toBeVisible();
    expect(recoveries.at(-1)).toEqual({ staff_password: 'StaffPassword1', confirmed_phone: '09123456789', expected_credential_version: 2 });
    await modal.getByRole('button', { name: 'Close recovery' }).click();
    await expect(recovery).toBeFocused();
    await recovery.click();
    await expect(password).toHaveValue('');
    await expect(modal.getByText('012345', { exact: true })).toHaveCount(0);
    await password.fill('StaffPassword1');
    await issue.click();
    await expect(modal.getByText('012345', { exact: true })).toBeVisible();
    expect(recoveries.at(-1).expected_credential_version).toBe(3);
    await modal.getByRole('button', { name: 'Close recovery' }).click();
    await page.goto('/staff/account-recovery');
    await expect(page).toHaveURL(/\/staff\/accounts\/patients$/);
    await page.getByRole('button', { name: 'Add Patient', exact: true }).click();
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await expect(page.getByText('Please complete all required fields.')).toBeVisible();
    expect(created).toBeUndefined();
    await page.getByPlaceholder('Juan', { exact: true }).fill('Ana');
    await page.getByPlaceholder('Dela Cruz', { exact: true }).fill('Santos');
    await page.getByPlaceholder('09XX XXX XXXX').fill('09123456789');
    await page.locator('input[type=date]').fill('1990-01-01');
    await page.locator('select').nth(0).selectOption('Female');
    await page.locator('select').nth(1).selectOption('Poblacion');
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await expect(page.getByText('Ana', { exact: true }).filter({ visible: true })).toBeVisible();
    expect(created).toMatchObject({ first_name: 'Ana', last_name: 'Santos', phone: '09123456789' });
    await expect(page.getByRole('button', { name: /deactivate|reactivate|replacement password/i })).toHaveCount(0);
  });
}
