export const AGE_GROUPS = [
  "0–11 months",
  "1–4 years",
  "5–9 years",
  "10–14 years",
  "15–19 years",
  "20–59 years",
  "60+ years",
];

// Names and order follow the Bago City health office form.
export const BARANGAYS = [
  "Abuanan", "Alianza", "Atipuluan", "Bacong", "Bagroy", "Balingasag",
  "Binubuhan", "Busay", "Calumangan", "Caridad", "Dulao", "Ilijan",
  "Lag-asan", "Ma-ao", "Don Jorge Araneta", "Mailum", "Malingin",
  "Napoles", "Pacol", "Poblacion", "Sagasa", "Sampinit", "Tabunan", "Taloc",
];

export const REPORT_GROUPS = [
  "Orally fit children 12–59 months after oral examination or rehabilitation",
  "Clients 5 years old and above examined",
  "New cases of DMFT, 5 years old and above",
  "Infants 0–11 months old who received BOHC",
  "Children 1–4 years old who received BOHC",
  "Children 5–9 years old who received BOHC",
  "Adolescents 10–14 years old who received BOHC",
  "Adults 15–19 years old who received BOHC",
  "Adults 20–59 years old who received BOHC",
  "Senior citizens 60 years old and above who received BOHC",
];
export const PREGNANT_AGES = ["10–14", "15–19", "20–24", "25 and above"];
export const groupOffset = (index) => index < 4 ? index * 2 : 12 + (index - 4) * 2;
export const emptyReport = () => BARANGAYS.map(() => Array(24).fill(null));

export function sumReports(reports) {
  const result = emptyReport();
  for (const report of reports) {
    if (!Array.isArray(report)) continue;
    report.forEach((values, row) => values?.forEach((value, column) => {
      if (row < result.length && column < 24 && value !== null && value !== undefined)
        result[row][column] = (result[row][column] ?? 0) + value;
    }));
  }
  return result;
}

const xml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );
const textCell = (ref, value, style = 0) =>
  `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
const formulaCell = (ref, formula) =>
  `<c r="${ref}" s="2"><f>${formula}</f></c>`;
const inputCell = (ref) => `<c r="${ref}" s="3"/>`;
const editableCell = (ref, value) =>
  value === null || value === undefined
    ? inputCell(ref)
    : `<c r="${ref}" s="3"><v>${value}</v></c>`;
const row = (index, cells, height) => `<row r="${index}"${height ? ` ht="${height}" customHeight="1"` : ""}>${cells.join("")}</row>`;

// ZIP stored entries keep the Excel export dependency-free.
function zip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const directory = [];
  let offset = 0;
  const crcTable = Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++)
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value >>> 0;
  });
  const u16 = (view, at, value) => view.setUint16(at, value, true);
  const u32 = (view, at, value) => view.setUint32(at, value, true);

  for (const [name, content] of Object.entries(files)) {
    const path = encoder.encode(name);
    const data = encoder.encode(content);
    let crc = 0xffffffff;
    for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    crc = (crc ^ 0xffffffff) >>> 0;
    const local = new Uint8Array(30 + path.length + data.length);
    const localView = new DataView(local.buffer);
    u32(localView, 0, 0x04034b50);
    u16(localView, 4, 20);
    u32(localView, 14, crc);
    u32(localView, 18, data.length);
    u32(localView, 22, data.length);
    u16(localView, 26, path.length);
    local.set(path, 30);
    local.set(data, 30 + path.length);
    chunks.push(local);

    const central = new Uint8Array(46 + path.length);
    const centralView = new DataView(central.buffer);
    u32(centralView, 0, 0x02014b50);
    u16(centralView, 4, 20);
    u16(centralView, 6, 20);
    u32(centralView, 16, crc);
    u32(centralView, 20, data.length);
    u32(centralView, 24, data.length);
    u16(centralView, 28, path.length);
    u32(centralView, 42, offset);
    central.set(path, 46);
    directory.push(central);
    offset += local.length;
  }

  const directoryLength = directory.reduce(
    (sum, entry) => sum + entry.length,
    0,
  );
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  u32(endView, 0, 0x06054b50);
  u16(endView, 8, directory.length);
  u16(endView, 10, directory.length);
  u32(endView, 12, directoryLength);
  u32(endView, 16, offset);
  const result = new Uint8Array(offset + directoryLength + end.length);
  let cursor = 0;
  for (const chunk of [...chunks, ...directory, end]) {
    result.set(chunk, cursor);
    cursor += chunk.length;
  }
  return result;
}

export function createDoctorReport(month, doctorName, data) {
  const columns = "ABCDEFGHIJKLMNOPQR";
  const groups = ["B:D", "E:G", "H:J", "K:M", "N:R"];
  const rows = [
    row(1, [textCell("A1", "MONTHLY DENTAL SERVICE REPORT", 1)]),
    row(2, [textCell("A2", "Month"), textCell("B2", month), textCell("H2", "Doctor"), textCell("I2", doctorName)]),
    row(3, [textCell("A3", "Barangay", 1), ...REPORT_GROUPS.slice(0, 4).map((label, i) => textCell(`${groups[i][0]}3`, `${i + 1}. ${label}`, 1)), textCell("N3", "Pregnant women who received BOHC", 1)], 54),
    row(4, [textCell("A4", ""), ...[...Array(4)].flatMap((_, i) => ["M", "F", "Total"].map((label, j) => textCell(`${columns[1 + i * 3 + j]}4`, label, 1))), ...[...PREGNANT_AGES, "Total"].map((label, i) => textCell(`${columns[13 + i]}4`, label, 1))], 26),
    ...BARANGAYS.map((barangay, index) => {
      const line = index + 5;
      const values = data?.[index] || [];
      const cells = [textCell(`A${line}`, barangay)];
      for (let group = 0; group < 4; group++) {
        const left = columns[1 + group * 3];
        const right = columns[2 + group * 3];
        cells.push(editableCell(`${left}${line}`, values[group * 2]));
        cells.push(editableCell(`${right}${line}`, values[group * 2 + 1]));
        cells.push(formulaCell(`${columns[3 + group * 3]}${line}`, `IF(COUNTA(${left}${line}:${right}${line})=0,"",SUM(${left}${line}:${right}${line}))`));
      }
      for (let i = 0; i < 4; i++) cells.push(editableCell(`${columns[13 + i]}${line}`, values[8 + i]));
      cells.push(formulaCell(`R${line}`, `IF(COUNTA(N${line}:Q${line})=0,"",SUM(N${line}:Q${line}))`));
      return row(line, cells);
    }),
    row(29, [textCell("A29", "TOTAL", 1), ...columns.slice(1).split("").map((column) => formulaCell(`${column}29`, `IF(COUNT(${column}5:${column}28)=0,"",SUM(${column}5:${column}28))`))]),
  ];

  const columns2 = "ABCDEFGHIJKLMNOPQRS";
  const rows2 = [
    row(1, [textCell("A1", "MONTHLY DENTAL SERVICE REPORT · PAGE 2", 1)]),
    row(2, [textCell("A2", "Month"), textCell("B2", month), textCell("H2", "Doctor"), textCell("I2", doctorName)]),
    row(3, [textCell("A3", "Barangay", 1), ...REPORT_GROUPS.slice(4).map((label, i) => textCell(`${columns2[1 + i * 3]}3`, `${i + 5}. ${label}`, 1))], 54),
    row(4, [textCell("A4", ""), ...REPORT_GROUPS.slice(4).flatMap((_, i) => ["M", "F", "Total"].map((label, j) => textCell(`${columns2[1 + i * 3 + j]}4`, label, 1)))], 26),
    ...BARANGAYS.map((barangay, index) => {
      const line = index + 5;
      const values = data?.[index] || [];
      const cells = [textCell(`A${line}`, barangay)];
      for (let group = 0; group < 6; group++) {
        const left = columns2[1 + group * 3];
        const right = columns2[2 + group * 3];
        cells.push(editableCell(`${left}${line}`, values[12 + group * 2]));
        cells.push(editableCell(`${right}${line}`, values[13 + group * 2]));
        cells.push(formulaCell(`${columns2[3 + group * 3]}${line}`, `IF(COUNTA(${left}${line}:${right}${line})=0,"",SUM(${left}${line}:${right}${line}))`));
      }
      return row(line, cells);
    }),
    row(29, [textCell("A29", "TOTAL", 1), ...columns2.slice(1).split("").map((column) => formulaCell(`${column}29`, `IF(COUNT(${column}5:${column}28)=0,"",SUM(${column}5:${column}28))`))]),
  ];
  const makeSheet = (sheetRows, lastColumn, merged) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="21" customWidth="1"/><col min="2" max="${lastColumn === "R" ? 18 : 19}" width="9" customWidth="1"/></cols><sheetData>${sheetRows.join("")}</sheetData><mergeCells count="${merged.length + 1}"><mergeCell ref="A1:${lastColumn}1"/>${merged.map((range) => `<mergeCell ref="${range}"/>`).join("")}</mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.2" right="0.2" top="0.3" bottom="0.3" header="0.1" footer="0.1"/><pageSetup orientation="landscape" paperSize="8" fitToWidth="1" fitToHeight="1"/></worksheet>`;
  const sheet = makeSheet(rows, "R", groups.map((range) => `${range.replace(":", "3:")}3`));
  const sheet2 = makeSheet(rows2, "S", REPORT_GROUPS.slice(4).map((_, i) => `${columns2[1 + i * 3]}3:${columns2[3 + i * 3]}3`));

  return zip({
    "[Content_Types].xml":
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    "_rels/.rels":
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml":
      '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="Report page 1" sheetId="1" r:id="rId1"/><sheet name="Report page 2" sheetId="2" r:id="rId2"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">\'Report page 1\'!$A$1:$R$29</definedName><definedName name="_xlnm.Print_Area" localSheetId="1">\'Report page 2\'!$A$1:$S$29</definedName></definedNames><calcPr fullCalcOnLoad="1"/></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "xl/styles.xml":
      '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="8"/><name val="Arial"/></font><font><b/><sz val="8"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="1" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="1" borderId="1" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="1" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="0" fillId="1" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    "xl/worksheets/sheet1.xml": sheet,
    "xl/worksheets/sheet2.xml": sheet2,
  });
}
