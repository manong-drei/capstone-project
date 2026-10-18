const { open, snap, BASE } = require('./capture.cjs');
const b = (page, name) => page.getByRole('button', { name, exact: true });

async function crop(page, locator, padding = 30) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await locator.boundingBox();
  if (!box) throw new Error('The crop target is not visible.');
  const bounds = await page.evaluate(() => ({ width: innerWidth, height: document.documentElement.scrollHeight }));
  const x = Math.max(0, Math.floor(box.x - padding));
  const y = Math.max(0, Math.floor(box.y - padding));
  return { x, y, width: Math.min(bounds.width - x, Math.ceil(box.width + padding * 2)), height: Math.min(bounds.height - y, Math.ceil(box.height + padding * 2)) };
}

async function publicCards() {
  const { browser, page } = await open(null, { viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 1.4 });
  try {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    const card = page.locator('form').locator('..');
    await snap(page, 'public_login', [
      { selector: 'input[name="phone"]', text: 'Phone Number enter your registered login phone' },
      { selector: 'input[name="password"]', text: 'Password enter your password' },
      { selector: page.locator('input[name="password"]').locator('..').getByRole('button'), text: 'Eye icon shows or hides the password', dx: 25 },
      { selector: b(page, 'Forgot password?'), text: 'Forgot password opens reception recovery instructions', dx: -32, dy: 0 },
      { selector: b(page, 'Login'), text: 'Login opens the dashboard assigned to your role' },
      { selector: b(page, 'terms and conditions'), text: 'Terms and privacy links open the policy dialog', dy: -28 }
    ], { clip: await crop(page, card, 34), cropped: true });
    await b(page, 'Forgot password?').click();
    await snap(page, 'public_recovery', [
      { selector: '#recovery-help', text: 'Reception recovery steps verify your identity in person' },
      { selector: b(page, 'Forgot password?'), text: 'Forgot password expands or collapses these instructions', dx: -32, dy: 0 }
    ], { clip: await crop(page, b(page, 'Forgot password?').locator('..'), 34), cropped: true });
  } finally { await browser.close(); }
}

async function patientCards() {
  const { browser, page } = await open('patient', { viewport: { width: 920, height: 1300 }, deviceScaleFactor: 1.2 });
  try {
    await page.getByRole('button', { name: /^Get queue ticket/ }).click();
    await page.getByRole('checkbox').first().check();
    await snap(page, 'patient_ticket', [
      { selector: 'dialog fieldset', text: 'Dental services choose one or two services', dy: -30 },
      { selector: 'dialog [role="status"]', text: 'Selection counter shows the two service limit', dx: -34 },
      { selector: b(page, 'Get Queue Ticket'), text: 'Get Queue Ticket submits the request' },
      { selector: b(page, 'Close queue ticket'), text: 'Close returns to the dashboard' }
    ], { clip: await crop(page, page.locator('dialog[open]'), 30), cropped: true });
    await b(page, 'Close queue ticket').click();

    let state = 'waiting';
    const example = () => ({
      id: 99991, queue_number: 'AQ07', status: state, category: 'dental', type: 'regular',
      full_name: 'Sample Patient', services: ['CONSULTATION'], sms_alert_state: 'suppressed',
      sms_initial_position: 3, grace_expires_at: new Date(Date.now() + 8 * 60000).toISOString()
    });
    await page.route('**/api/queue/me', route => route.fulfill({ json: example() }));
    await page.reload({ waitUntil: 'networkidle' });
    const ticket = page.getByText('Your Queue Number', { exact: true }).locator('..').locator('..');
    await snap(page, 'patient_active', [
      { selector: page.getByText('Your Queue Number', { exact: true }), text: 'Your Queue Number identify yourself to staff using this ticket' },
      { selector: page.getByText('Waiting', { exact: true }), text: 'Waiting read this status and follow the instructions above', dx: -48 },
      { selector: b(page, 'Cancel Queue'), text: 'Cancel Queue opens the required cancellation reason' }
    ], { scenario: true, clip: await crop(page, ticket, 22), cropped: true });

    await b(page, 'Cancel Queue').click();
    await page.getByRole('radio').first().check();
    await snap(page, 'patient_cancel', [
      { selector: page.getByRole('radio').first(), text: 'Reason select the reason that applies' },
      { selector: b(page, 'Continue'), text: 'Continue confirms cancellation with the selected reason' },
      { selector: b(page, 'Cancel'), text: 'Cancel closes the dialog and keeps your ticket' }
    ], { scenario: true, clip: await crop(page, page.getByRole('dialog'), 34), cropped: true });
    await b(page, 'Cancel').click();

    state = 'missed';
    await page.reload({ waitUntil: 'networkidle' });
    await snap(page, 'patient_missed', [
      { selector: page.getByRole('status').first(), text: 'Return deadline report to staff before the displayed time' },
      { selector: page.getByText('Missed call', { exact: true }), text: 'Missed call staff must confirm your return', dx: -48 }
    ], { scenario: true, clip: await crop(page, ticket, 22), cropped: true });

    await page.route('**/api/appointments/me', route => route.fulfill({ json: { success: true, appointments: [
      { appointment_id: 900101, doctor_first_name: 'Sample', doctor_last_name: 'Dentist', appointment_date: '2026-10-18T09:00:00+08:00', appointment_time: '09:00', queue_services: ['Dental Check-up'], reason: 'Same-day queue registration', status: 'confirmed' },
      { appointment_id: 900102, doctor_first_name: 'Sample', doctor_last_name: 'Dentist', appointment_date: '2026-10-10T10:30:00+08:00', appointment_time: '10:30', queue_services: ['Oral Prophylaxis'], reason: 'Same-day queue registration', status: 'completed' }
    ] } }));
    await page.getByRole('button', { name: /^Appointment history/ }).first().click();
    await page.locator('.pd-tab-pad').getByText('Oral Prophylaxis', { exact: true }).waitFor();
    await snap(page, 'patient_history', [
      { selector: page.getByRole('heading', { name: 'Appointment History', exact: true }), text: 'Appointment history lists your recorded appointments' },
      { selector: page.getByRole('button', { name: /back/i }).first(), text: 'Back returns to the patient dashboard' }
    ], { scenario: true, source: 'Browser-only demonstration appointment GET response in the current application. No appointments were created or changed.', clip: await crop(page, page.locator('.pd-tab-pad > div'), 30), cropped: true });

    await page.goto(BASE + '/change-password', { waitUntil: 'networkidle' });
    await snap(page, 'password_change', [
      { selector: 'input[name="oldPassword"]', text: 'Current Password enter the password you currently use' },
      { selector: 'input[name="newPassword"]', text: 'New Password use at least eight characters including a number' },
      { selector: 'input[name="confirmPassword"]', text: 'Confirm New Password enter the same new password again' },
      { selector: b(page, 'Update Password'), text: 'Update Password saves the new password' }
    ], { clip: await crop(page, page.locator('form').locator('..'), 34), cropped: true });
  } finally { await browser.close(); }
}

(async () => {
  const target = process.argv[2];
  if (!target || target === 'public') await publicCards();
  if (!target || target === 'patient') await patientCards();
})().catch(error => { console.error(error); process.exit(1); });
