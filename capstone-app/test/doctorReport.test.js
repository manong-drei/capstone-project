import assert from "node:assert/strict";
import test from "node:test";
import { AGE_GROUPS, BARANGAYS, createDoctorReport, emptyReport, normalizeReportBarangay, sumReports, summarizeCompletedVisits } from "../src/components/dashboards/doctor/doctorReport.js";

function readWorkbook(bytes) {
  const view = new DataView(bytes.buffer);
  const decoder = new TextDecoder();
  let cursor = 0;
  const entries = new Map();
  while (view.getUint32(cursor, true) === 0x04034b50) {
    const size = view.getUint32(cursor + 18, true);
    const nameLength = view.getUint16(cursor + 26, true);
    const name = decoder.decode(bytes.subarray(cursor + 30, cursor + 30 + nameLength));
    const start = cursor + 30 + nameLength;
    entries.set(name, decoder.decode(bytes.subarray(start, start + size)));
    cursor = start + size;
  }
  return entries;
}

test("monthly Excel uses all 24 barangays and adds daily counts without filling blanks", () => {
  const day1 = emptyReport();
  const day2 = emptyReport();
  day1[0][0] = 3;
  day2[0][0] = 2;
  day1[0][1] = 0;
  day2[23][11] = 4;
  day2[23][23] = 7;
  const monthly = sumReports([day1, day2]);
  assert.equal(BARANGAYS.length, 24);
  assert.equal(monthly[0][0], 5);
  assert.equal(monthly[0][1], 0);
  assert.equal(monthly[0][2], null);
  assert.equal(monthly[23][23], 7);

  const entries = readWorkbook(createDoctorReport("2026-10", "Dr. Test", monthly));
  const sheet = entries.get("xl/worksheets/sheet1.xml");
  const sheet2 = entries.get("xl/worksheets/sheet2.xml");
  assert.ok(sheet);
  assert.ok(sheet2);
  assert.equal(entries.has("xl/worksheets/sheet3.xml"), false);
  assert.match(sheet, /MONTHLY DENTAL SERVICE REPORT/);
  assert.match(sheet, /<c r="A2"[^>]*>.*?Month/);
  assert.match(sheet, /<c r="B2"[^>]*>.*?2026-10/);
  assert.match(entries.get("xl/workbook.xml"), /\$A\$1:\$R\$29/);
  assert.match(entries.get("xl/workbook.xml"), /\$A\$1:\$S\$29/);
  assert.match(sheet, /fitToWidth="1" fitToHeight="1"/);
  assert.match(sheet, /<c r="A5"[^>]*>.*?Abuanan/);
  assert.match(sheet, /<c r="A28"[^>]*>.*?Taloc/);
  assert.match(sheet, /<c r="B5" s="3"><v>5<\/v><\/c>/);
  assert.match(sheet, /<c r="C5" s="3"><v>0<\/v><\/c>/);
  assert.match(sheet, /<c r="E5" s="3"\/>/);
  assert.match(sheet, /<c r="Q28" s="3"><v>4<\/v><\/c>/);
  assert.match(sheet, /<c r="D5" s="2"><f>IF\(COUNTA\(B5:C5\)/);
  assert.match(sheet2, /5\. Children 1–4 years old/);
  assert.match(sheet2, /10\. Senior citizens 60 years old/);
  assert.match(sheet2, /<c r="R28" s="3"><v>7<\/v><\/c>/);
});

test("completed visit totals preserve other and unknown demographics and flag each incomplete visit once", () => {
  const rows = [
    { barangay: "barangay abuanan, Bago City", age_group: AGE_GROUPS[5], sex: "Male", count: 3 },
    { barangay: " TALOC ", age_group: AGE_GROUPS[6], sex: "Female", count: "2" },
    { barangay: "Abuanan", age_group: AGE_GROUPS[2], sex: "Other", count: 4 },
    { barangay: "Barangay Elsewhere, Bago City", age_group: "Unknown", sex: "Unknown", count: 5 },
    { barangay: "Abuanan", age_group: "Unknown", sex: "Female", count: 1 },
    { barangay: "Abuanan", age_group: AGE_GROUPS[0], sex: "", count: 2 },
    { barangay: "Abuanan", age_group: AGE_GROUPS[0], sex: "Male", count: -1 },
  ];
  assert.equal(normalizeReportBarangay(rows[0].barangay), "Abuanan");
  assert.equal(normalizeReportBarangay(rows[1].barangay), "Taloc");
  assert.equal(normalizeReportBarangay(rows[3].barangay), "Barangay Elsewhere, Bago City");
  assert.equal(normalizeReportBarangay("  "), "Unknown");
  assert.deepEqual(summarizeCompletedVisits(rows), { completed: 17, male: 3, female: 3, other: 4, unknown: 7, missing: 8 });
  assert.deepEqual(summarizeCompletedVisits([]), { completed: 0, male: 0, female: 0, other: 0, unknown: 0, missing: 0 });
});

test("period exports include both clinical pages with the selected period and inclusive end date", () => {
  for (const [period, from, until, expected] of [
    ["today", "2026-10-12", "2026-10-13", "2026-10-12"],
    ["weekly", "2026-12-28", "2027-01-04", "2026-12-28 – 2027-01-03"],
    ["monthly", "2028-02-01", "2028-03-01", "2028-02-01 – 2028-02-29"],
  ]) {
    const entries = readWorkbook(createDoctorReport("unused", "Dr. Test", emptyReport(), { period, from, until }));
    const title = { today: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY" }[period];
    for (const sheet of ["xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]) {
      assert.ok(entries.get(sheet).includes(`${title} DENTAL SERVICE REPORT`));
      assert.ok(entries.get(sheet).includes(expected));
      assert.match(entries.get(sheet), /<c r="A2"[^>]*>.*?Period/);
    }
    assert.match(entries.get("xl/workbook.xml"), /\$A\$1:\$R\$29/);
    assert.match(entries.get("xl/workbook.xml"), /\$A\$1:\$S\$29/);
  }
});

test("automatic export retains all demographic rows separately without filling clinical outcomes", () => {
  const demographics = [
    { barangay: "Barangay Abuanan, Bago City", age_group: AGE_GROUPS[5], sex: "Male", count: 2 },
    { barangay: "Unknown", age_group: "Unknown", sex: "Unknown", count: 3 },
    { barangay: "Elsewhere", age_group: AGE_GROUPS[6], sex: "Other", count: 1 },
  ];
  const entries = readWorkbook(createDoctorReport("2026-10", "Dr. Test & Co", emptyReport(), { period: "monthly", from: "2026-10-01", until: "2026-11-01", completed_demographics: demographics }));
  const completed = entries.get("xl/worksheets/sheet3.xml");
  assert.match(entries.get("xl/workbook.xml"), /sheet name="Completed visits" sheetId="3" r:id="rId4"/);
  assert.match(entries.get("xl/_rels/workbook.xml.rels"), /Id="rId4"[^>]*Target="worksheets\/sheet3.xml"/);
  assert.match(entries.get("[Content_Types].xml"), /PartName="\/xl\/worksheets\/sheet3.xml"/);
  assert.match(entries.get("xl/worksheets/sheet1.xml"), /<c r="B5" s="3"\/>/);
  assert.match(completed, /Automatic counts; clinical outcomes are entered separately/);
  assert.match(completed, /Dr. Test &amp; Co/);
  assert.match(completed, /<c r="B6" s="2"><v>6<\/v>/);
  assert.match(completed, /<c r="B11" s="2"><v>4<\/v>/);
  assert.match(completed, /<c r="A15"[^>]*>.*?Abuanan/);
  assert.match(completed, /<c r="D15" s="2"><v>2<\/v>/);
  assert.match(completed, /<c r="A16"[^>]*>.*?Unknown/);
  assert.match(completed, /<c r="D16" s="2"><v>3<\/v>/);
  assert.match(completed, /<c r="A17"[^>]*>.*?Elsewhere/);
  assert.match(completed, /<c r="C17"[^>]*>.*?Other/);
  assert.match(completed, /<c r="D17" s="2"><v>1<\/v>/);
});
