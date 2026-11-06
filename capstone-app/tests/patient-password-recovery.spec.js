import { test, expect } from '@playwright/test';

async function setup(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  const state = { sends: [], verifications: [], resets: [], requestError: '', verifyError: '', resetError: '' };
  await page.route('**/api/auth/password-recovery/**', async route => {
    const action = new URL(route.request().url()).pathname.split('/').at(-1);
    const data = route.request().postDataJSON();
    const error = state[`${action}Error`];
    if (action === 'request') state.sends.push(data);
    else if (action === 'verify') state.verifications.push(data);
    else state.resets.push(data);
    await route.fulfill({ status: error ? 400 : 200, json: error ? { success: false, message: error }
      : action === 'request' ? { success: true, recovery_id: `recovery-${state.sends.length}`, expires_in: 300, resend_after: 60 }
        : action === 'verify' ? { success: true, reset_token: 'private-reset-token', expires_in: 300 }
          : { success: true, message: 'Password changed successfully.' } });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  return state;
}

for (const width of [1440, 375]) {
  test(`patient verifies SMS and changes password without logging in at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await setup(page);
    const dialog = page.getByRole('dialog', { name: 'Recover your account' });
    await dialog.getByLabel('Registered mobile number').fill('09123456789');
    await dialog.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(dialog.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
    await expect(dialog).toContainText('three attempts');
    await dialog.getByLabel('Four-digit code').fill('0007');
    await dialog.getByRole('button', { name: 'Verify code' }).click();
    await expect(dialog.getByLabel('New password', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))).not.toContain('private-reset-token');
    await dialog.getByLabel('New password', { exact: true }).fill('NewPassword2');
    await dialog.getByLabel('Confirm new password').fill('OtherPassword2');
    await dialog.getByRole('button', { name: 'Save new password' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Passwords do not match.');
    expect(state.resets).toHaveLength(0);
    await dialog.getByLabel('Confirm new password').fill('NewPassword2');
    await page.screenshot({ path: testInfo.outputPath(`recovery-password-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await dialog.getByRole('button', { name: 'Save new password' }).click();
    await expect(page.getByRole('heading', { name: 'Password changed' })).toBeVisible();
    expect(state.sends).toEqual([{ phone: '09123456789' }]);
    expect(state.verifications).toEqual([{ recovery_id: 'recovery-1', otp: '0007' }]);
    expect(state.resets).toEqual([{ recovery_id: 'recovery-1', reset_token: 'private-reset-token', newPassword: 'NewPassword2' }]);
    expect(await page.evaluate(() => sessionStorage.getItem('ek_token'))).toBeNull();
    await page.getByRole('button', { name: 'Back to login' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test('unknown numbers get the generic prompt and resend uses the latest challenge', async ({ page }) => {
  await page.clock.install();
  const state = await setup(page);
  await page.getByLabel('Registered mobile number').fill('09999999999');
  await page.getByRole('button', { name: 'Send code', exact: true }).click();
  await expect(page.getByText('If this number is eligible, a code will be sent by SMS.')).toBeVisible();
  await page.getByRole('button', { name: 'Use another number' }).click();
  await page.getByLabel('Registered mobile number').fill('09123456789');
  await page.getByRole('button', { name: 'Send code', exact: true }).click();
  await page.getByLabel('Four-digit code').fill('1234');
  state.verifyError = 'Invalid or expired code. Request a new code if needed.';
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByRole('alert')).toHaveText(state.verifyError);
  await page.clock.fastForward(59000);
  await expect(page.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
  await page.clock.fastForward(1000);
  await page.getByRole('button', { name: 'Resend code', exact: true }).click();
  await expect(page.getByLabel('Four-digit code')).toHaveValue('');
  await expect(page.getByRole('alert')).toHaveCount(0);
  state.verifyError = '';
  await page.getByLabel('Four-digit code').fill('0007');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByLabel('New password', { exact: true })).toBeVisible();
  expect(state.verifications.at(-1).recovery_id).toBe('recovery-3');
  await page.clock.fastForward(300000);
  await expect(page.getByRole('button', { name: 'Save new password' })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('recovery session expired');
  await page.getByRole('button', { name: 'Start again' }).click();
  await expect(page.getByLabel('Registered mobile number')).toBeVisible();
});

test('code expiry, provider errors and closing the dialog clear credentials and restore login focus', async ({ page }) => {
  await page.clock.install();
  const state = await setup(page);
  state.requestError = 'Account recovery is unavailable. Please try again or visit clinic reception.';
  await page.getByLabel('Registered mobile number').fill('09123456789');
  await page.getByRole('button', { name: 'Send code', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('clinic reception');
  state.requestError = '';
  await page.getByRole('button', { name: 'Send code', exact: true }).click();
  await page.clock.fastForward(300000);
  await expect(page.getByRole('button', { name: 'Verify code' })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('code expired');
  await page.getByRole('button', { name: 'Resend code', exact: true }).click();
  await page.getByLabel('Four-digit code').fill('0007');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByLabel('New password', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeFocused();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByLabel('Registered mobile number')).toHaveValue('');
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))).not.toContain('private-reset-token');
});
