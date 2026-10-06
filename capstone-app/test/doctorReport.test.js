import assert from "node:assert/strict";
import test from "node:test";
import { BARANGAYS, createDoctorReport, emptyReport, sumReports } from "../src/components/dashboards/doctor/doctorReport.js";

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

  const bytes = createDoctorReport("2026-10", "Dr. Test", monthly);
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
  const sheet = entries.get("xl/worksheets/sheet1.xml");
  const sheet2 = entries.get("xl/worksheets/sheet2.xml");
  assert.ok(sheet);
  assert.ok(sheet2);
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
