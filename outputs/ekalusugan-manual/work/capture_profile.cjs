const { open, snap, BASE } = require('./capture.cjs');

const b = (page, name) => page.getByRole('button', { name, exact: true });

(async () => {
  const { browser, page } = await open('staff');
  try {
    await page.route('**/api/auth/profile', route => route.fulfill({
      status: 200,
      json: { success: true, data: { role: 'staff', display_name: 'Sample Staff', first_name: 'Sample', last_name: 'Staff', phone: '09XXXXXXXXX' } }
    }));
    let patients = [];
    for (const term of ['ma', 'an', 'jo', 'al']) {
      const result = await page.evaluate(async search => {
        const response = await fetch('/api/patients/search?name=' + encodeURIComponent(search), {
          headers: { Authorization: 'Bearer ' + sessionStorage.getItem('ek_token') }
        });
        return response.json();
      }, term);
      patients = result.data || [];
      if (patients.length) break;
    }
    const realId = patients[0]?.patient_id;
    const profileId = realId || 900001;
    if (!realId) {
      await page.route('**/api/patients/900001', route => route.fulfill({
        status: 200,
        json: { success: true, data: {
          patient_id: 900001, user_id: 900001, first_name: 'Sample', last_name: 'User',
          date_of_birth: '1990-01-01', gender: 'Other', contact_number: '09XXXXXXXXX',
          barangay: 'Sample barangay', city: 'Bago City', account: null,
          visits: [
            { id: 900001, queue_number: 'A-001', created_at: '2026-10-18T01:00:00+08:00', category: 'dental', status: 'waiting' },
            { id: 900002, queue_number: 'A-002', created_at: '2026-10-17T01:00:00+08:00', category: 'dental', status: 'done' }
          ]
        } }
      }));
    }
    await page.goto(BASE + '/staff/patients/' + profileId, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Patient profile', exact: true }).waitFor();
    await page.setViewportSize({ width: 1160, height: 600 });
    await snap(page, 'staff_profile', [
      { selector: page.getByRole('link', { name: /Staff dashboard/ }), text: 'Staff dashboard returns to dental queue management.' },
      { selector: page.locator('main > section').first(), text: 'Patient identity verify the record number and details before acting.' },
      { selector: '#account-recovery-title', text: 'Account recovery is available only for an eligible active patient login.' },
      { selector: page.getByRole('heading', { name: /^Queue history/ }), text: 'Queue history lists recorded visits, dates, categories, statuses and reasons.' }
    ], { scenario: !realId, anonymized: true, source: realId ? 'Anonymized live GET response in the current local application.' : 'Browser-only demonstration GET response; current application interface.' });

    const verificationId = 900101;
    await page.route('**/api/patients/' + verificationId, route => route.fulfill({
      status: 200,
      json: { success: true, data: {
        patient_id: verificationId, user_id: verificationId, first_name: 'Sample', last_name: 'User',
        date_of_birth: '1990-01-01', gender: 'Other', contact_number: '09XXXXXXXXX',
        barangay: 'Sample barangay', city: 'Bago City', archived_into_patient_id: null,
        account: { is_active: true, phone: '09XXXXXXXXX', credential_version: 1 }, visits: []
      } }
    }));
    await page.goto(BASE + '/staff/patients/' + verificationId, { waitUntil: 'networkidle' });
    await b(page, 'Start account recovery').click();
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await page.setViewportSize({ width: 1160, height: 850 });
    await snap(page, 'staff_recovery_verify', [
      { selector: page.locator('main > section').first(), text: 'Selected patient details compare these against what the patient provides.' },
      { selector: page.getByRole('group', { name: 'Identity verification' }), text: 'Verify physical presence and every identity item before checking each box.' },
      { selector: b(page, 'Issue temporary password'), text: 'Issue temporary password stays disabled until all six checks are complete; issuance replaces old access.' },
      { selector: b(page, 'Close recovery'), text: 'Close recovery stops without issuing a password.' }
    ], { scenario: true, anonymized: true, source: 'Browser-only complete demonstration patient GET response; current application recovery form. Only two verification boxes selected; no password issued and no backend save request made.' });

    await page.route('**/api/patients/900201', route => route.fulfill({
      status: 200,
      json: { success: true, data: {
        patient_id: 900201, user_id: null, first_name: 'Sample', last_name: 'User',
        date_of_birth: '1990-01-01', gender: 'Other', contact_number: '09XXXXXXXXX',
        barangay: 'Sample barangay', city: 'Bago City', archived_into_patient_id: null,
        account: null, visits: []
      } }
    }));
    await page.route('**/api/patients/search?name=Sample', route => route.fulfill({
      status: 200,
      json: { success: true, data: [
        { patient_id: 900101, first_name: 'Sample', last_name: 'User', date_of_birth: '1990-01-01', masked_contact: '09XXXXXXXXX' }
      ] }
    }));
    await page.goto(BASE + '/staff/patients/900201', { waitUntil: 'networkidle' });
    await page.locator('#merge-search').fill('Sample');
    await page.locator('input[name="merge-target"]').waitFor();
    await page.locator('input[name="merge-target"]').check();
    await page.setViewportSize({ width: 1160, height: 850 });
    await snap(page, 'staff_merge', [
      { selector: page.locator('main > section').first(), text: 'Source walk-in record verify that this is the duplicate whose visits should move.' },
      { selector: '#merge-search', text: 'Find the correct patient searches the destination by name or mobile number.' },
      { selector: 'input[name="merge-target"]', text: 'Destination patient compare the record carefully before selecting it.' },
      { selector: b(page, 'Merge into selected patient'), text: 'Merge moves every queue visit and archives the source after confirmation.' }
    ], { scenario: true, anonymized: true, source: 'Browser-only demonstration patient and search GET responses; current application merge interface. Destination selected for illustration, but no merge submitted.' });
    console.log('Patient profile and recovery verification captures complete. No records were changed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
