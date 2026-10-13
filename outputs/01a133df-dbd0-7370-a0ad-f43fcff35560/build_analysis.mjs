import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const bundledRequire = createRequire('C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.artifact-resolver.cjs');
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(bundledRequire.resolve('@oai/artifact-tool')).href);
const outputDir = 'C:/Users/ACER/Desktop/Capstone/outputs/01a133df-dbd0-7370-a0ad-f43fcff35560';
const outputPath = outputDir + '/eKalusugan_Function_Point_Analysis.xlsx';
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const sheet = workbook.worksheets.getItem('Function Point Analysis');
const originalScope = JSON.stringify(sheet.getRange('A5:G52').values);
const originalScopeFormulas = JSON.stringify(sheet.getRange('A5:G52').formulas);

const screens = [
  'Public Landing Page',
  'Login Page',
  'First-Login Password Change Page',
  'Patient Dashboard',
  'Staff Dashboard',
  'Doctor Dashboard',
  'Admin Dashboard',
  'Patient Registration and Account Management',
  'Staff and Doctor Account Management Forms',
  'Walk-In Patient Registration Form',
  'Patient Profile and Visit History Page',
  'Patient Queue Request and Status Screens',
  'Appointment Schedule and History Screens',
  'General Queue Monitor and Announcements',
  'Consultation and Prescription Entry Form',
  'Doctor Availability and Daily Limit Controls',
  'Dental Report Entry and Doctor Analytics',
  'Admin Statistics and BOHC Forecast Screens',
  'SMS Notifications and Settings Screen',
  'Patient Search, Account Recovery and Merge',
  'Clinic Location Map',
];
const interfaces = [
  ['Database / Server Management', 1],
  ['Web Application / Backend API Communication', 1],
  ['SMS Gateway Integration', 2],
  ['BOHC Historical / Forecast CSV Data Exchange', 1],
  ['Clinic Location Map Integration', 1],
];

// Replace the earlier total with the two continuation sections and a new total.
sheet.getRange('A53:G83').clear({ applyTo: 'all' });
sheet.getRange('A53:G83').format = {
  font: { name: 'Times New Roman', size: 11, color: '#000000', bold: false },
  verticalAlignment: 'center', fill: '#FFFFFF', rowHeight: 25,
  borders: { preset: 'all', style: 'thin', color: '#333333' },
};
sheet.getRange('A53:A83').format.horizontalAlignment = 'left';
sheet.getRange('B53:G83').format.horizontalAlignment = 'center';
sheet.getRange('B53:G83').setNumberFormat('0');
sheet.getRange('A3').values = [['Estimated man-days across six project phases']];

const addedGroups = [
  { title: 'SCREEN LAYOUT:\n(Screen Forms/Pages)', header: 53, start: 54, end: 74, subtotal: 75,
    subtotalLabel: 'Screen Layout Subtotal', values: screens.map(name => [name, 1, 1, 1, 1, 1, 1]) },
  { title: 'INTERFACING AND DATA\nCOMMUNICATION:', header: 76, start: 77, end: 81, subtotal: 82,
    subtotalLabel: 'Interfacing and Data Communication Subtotal', values: interfaces.map(([name, dev]) => [name, 1, 1, dev, 1, 1, 1]) },
];
for (const group of addedGroups) {
  sheet.mergeCells('A' + group.header + ':G' + group.header);
  sheet.getRange('A' + group.header).values = [[group.title]];
  sheet.getRange('A' + group.header + ':G' + group.header).format = {
    fill: '#EEEEEE', font: { name: 'Times New Roman', size: 11, bold: true },
    horizontalAlignment: 'left', verticalAlignment: 'center', wrapText: true, rowHeight: 40,
    borders: { preset: 'outside', style: 'thin', color: '#333333' },
  };
  sheet.getRange('A' + group.start + ':G' + group.end).values = group.values;
  sheet.getRange('A' + group.subtotal).values = [[group.subtotalLabel]];
  sheet.getRange('B' + group.subtotal + ':G' + group.subtotal).formulas = [[...'BCDEFG'].map(col => '=SUM(' + col + group.start + ':' + col + group.end + ')')];
  sheet.getRange('A' + group.subtotal + ':G' + group.subtotal).format.font = { name: 'Times New Roman', size: 11, bold: true };
  sheet.getRange('A' + group.subtotal + ':G' + group.subtotal).format.fill = '#F7F7F7';
  sheet.dataValidations.add({ range: 'B' + group.start + ':G' + group.end, rule: { type: 'whole', operator: 'between', formula1: 1, formula2: 2 } });
}
sheet.getRange('B83:G83').formulas = [[...'BCDEFG'].map(col => '=SUM(' + col + '22,' + col + '33,' + col + '52,' + col + '75,' + col + '82)')];
sheet.getRange('A83').formulas = [['="TOTAL MAN-DAY"&CHAR(10)&SUM(B83:G83)&" DAYS"']];
sheet.getRange('A83:G83').format = {
  fill: '#DDDDDD', font: { name: 'Times New Roman', size: 11, bold: true },
  verticalAlignment: 'center', wrapText: true, rowHeight: 42,
};

// The second PNG clarifies the unit, so update only the affected assumptions.
sheet.getRange('I6').values = [['All values are proposed man-day estimates. Following the continuation PNG, 1 = one person-day and 2 = two person-days. Numeric estimates are editable.']];
sheet.getRange('I9').values = [['The six phase columns follow the reference. Person-days measure combined work effort, not elapsed calendar days. Phase role labels identify responsibility and do not multiply the numeric estimates.']];
sheet.getRange('I12').values = [['Totals add inputs, outputs, data stores, screen layouts and interface estimates, following the supplied template. This is a phase-effort estimate; its total is not a formal IFPUG function point count.']];
sheet.getRange('I27').values = [['Layout: two user-supplied FUNCTION POINT ANALYSIS PNGs. Feature scope: E-KALUSUGAN local project, reviewed 13 October 2026. All estimates are proposed, with no measured effort data supplied.']];
function note(first, last, text, bold = false) {
  const address = 'I' + first + ':N' + last;
  sheet.mergeCells(address);
  sheet.getRange('I' + first).values = [[text]];
  sheet.getRange(address).format = {
    font: { name: 'Arial', size: 10, bold, color: '#333333' },
    wrapText: true, verticalAlignment: 'center',
  };
}
note(43, 43, 'CONTINUATION SOURCES', true);
note(44, 46, 'Screen scope: App.jsx, PatientDashboard.jsx, StaffDashboard.jsx, DoctorDashboard.jsx, AdminDashboard.jsx, StaffPatientProfile.jsx and their dashboard forms and tabs.');
note(47, 49, 'Interface scope: db.js (database), api.js (web API), sms.js (SMS gateway), adminAnalyticsController.js (CSV data), and PatientHomeTab.jsx (clinic location map).');
note(50, 52, "The reference total of 187 man-days belongs to the original example. The E-KALUSUGAN total is calculated from this workbook's scope and proposed estimates.");

workbook.recalculate();
if (JSON.stringify(sheet.getRange('A5:G52').values) !== originalScope || JSON.stringify(sheet.getRange('A5:G52').formulas) !== originalScopeFormulas) {
  throw new Error('Original scope or formulas changed unexpectedly.');
}
const priorTotals = [22, 33, 52].reduce((result, row) => {
  const values = sheet.getRange('B' + row + ':G' + row).values[0];
  return result.map((value, index) => value + values[index]);
}, Array(6).fill(0));
const extraTotals = addedGroups.flatMap(group => group.values).reduce((result, row) => result.map((value, index) => value + row[index + 1]), Array(6).fill(0));
const expected = priorTotals.map((value, index) => value + extraTotals[index]);
const expectedTotal = expected.reduce((sum, value) => sum + value, 0);
if (JSON.stringify(sheet.getRange('B83:G83').values[0]) !== JSON.stringify(expected)) throw new Error('Phase total mismatch.');
if (sheet.getRange('A83').values[0][0] !== 'TOTAL MAN-DAY\n' + expectedTotal + ' DAYS') throw new Error('Man-day label mismatch.');

// Verify the new rows feed both phase totals and the grand total.
sheet.getRange('D54').values = [[2]];
workbook.recalculate();
if (sheet.getRange('D83').values[0][0] !== expected[2] + 1 || sheet.getRange('A83').values[0][0] !== 'TOTAL MAN-DAY\n' + (expectedTotal + 1) + ' DAYS') {
  throw new Error('New estimate did not flow through totals.');
}
sheet.getRange('D54').values = [[1]];
workbook.recalculate();
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 20 }, maxChars: 1200 });
const totalInspection = await workbook.inspect({ kind: 'table', range: "'Function Point Analysis'!A82:G83", include: 'values,formulas', tableMaxRows: 2, tableMaxCols: 7, maxChars: 1600 });
console.log(JSON.stringify({ screenRows: screens.length, interfaceRows: interfaces.length, phaseTotals: expected, totalManDays: expectedTotal, totals: totalInspection.ndjson, errors: errors.ndjson, originalScopePreserved: true }));
for (const [range, name] of [['A50:G83', 'continuation_preview.png'], ['I5:N52', 'notes_preview.png']]) {
  const preview = await workbook.render({ sheetName: sheet.name, range, scale: 1.5, format: 'png' });
  await fs.writeFile(outputDir + '/' + name, new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(workbook)).save(outputPath);
console.log('Updated eKalusugan_Function_Point_Analysis.xlsx');
