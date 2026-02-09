import { mockCRM, mockBudgetExcel } from '../data/mockPrototypeData';
// We import exceljs dynamically when needed so the dev bundle doesn't always
// include it unless parseBudgetExcel is used.

export async function loadCRMRecord(): Promise<typeof mockCRM> {
  // immediate return of mock CRM record (no OCR in prototype)
  return mockCRM;
}

// parseBudgetExcel: fetch the xlsm from the dev server and parse the "budget" sheet
// Expected behaviour:
// - Look for a worksheet with name containing 'budget' (case-insensitive)
// - Treat the first row as headers (case-insensitive match for cost type, year1, year2, comments)
// - Return an object shaped like mockBudgetExcel
export async function parseBudgetExcel() {
  try {
    // dynamic import so exceljs is only pulled in when needed
    const ExcelJS = (await import('exceljs')) as any;
    const url = '/Sample files/Input/0702208200025_PSW2.6.xlsm';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch sample excel: ${res.status}`);
    const buf = await res.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    // in browser environment exceljs provides workbook.xlsx.load
    await workbook.xlsx.load(buf);

    // pick worksheet with 'budget' in name or first worksheet
    const sheet = workbook.worksheets.find((ws: any) => ws.name && ws.name.toLowerCase().includes('budget')) || workbook.worksheets[0];
    if (!sheet) throw new Error('No worksheet found in workbook');

    // read header row
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
      const v = (cell && (cell.text ?? cell.value)) || '';
      headers[colNumber - 1] = String(v).trim().toLowerCase();
    });

    // guess columns
    const idx = {
      costType: headers.findIndex((h) => /cost|item|type/.test(h)),
      year1: headers.findIndex((h) => /year.?1|yr.?1|y1/.test(h)),
      year2: headers.findIndex((h) => /year.?2|yr.?2|y2/.test(h)),
      comments: headers.findIndex((h) => /comment|notes/.test(h)),
    };

    // normalize missing indices: try common defaults
    const rows: any[] = [];
    sheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
      if (rowNumber === 1) return; // skip header
      const values = row.values as any[]; // exceljs uses 1-based array
      const costType = values[idx.costType + 1] ?? values[1];
      const y1 = values[idx.year1 + 1] ?? values[2];
      const y2 = values[idx.year2 + 1] ?? values[3];
      const comments = idx.comments >= 0 ? values[idx.comments + 1] : undefined;
      // ignore empty rows
      if (!costType || String(costType).trim() === '') return;
      rows.push({ costType: String(costType).trim(), year1: Number(y1) || 0, year2: Number(y2) || 0, comments: comments ? String(comments) : '' });
    });

    const totals = {
      year1: rows.reduce((s, r) => s + (Number(r.year1) || 0), 0),
      year2: rows.reduce((s, r) => s + (Number(r.year2) || 0), 0),
    };

    return {
      templateName: sheet.name || mockBudgetExcel.templateName,
      rows,
      totals,
    };
  } catch (err) {
    // on any failure, fall back to the mock data so the prototype remains functional
    // keep a small delay to preserve prior UX timing
    await new Promise((r) => setTimeout(r, 400));
    // eslint-disable-next-line no-console
    console.warn('parseBudgetExcel failed, falling back to mock', err);
    return mockBudgetExcel;
  }
}

export function fillBudgetWithHistorical(template: typeof mockBudgetExcel, historical: any) {
  // Merge historical rows into the existing template layout instead of
  // replacing it entirely. This preserves the current budget editor's
  // structure/ordering while applying historical values where costType
  // matches. Any historical rows not present in the template are appended.
  try {
    const copy: any = { ...template, rows: (template.rows || []).map((r: any) => ({ ...r })) };
    const histRows: any[] = (historical && historical.rows) || [];
    const histMap = new Map<string, any>();
    histRows.forEach((r: any) => {
      if (r && r.costType) histMap.set(String(r.costType).toLowerCase(), r);
    });

    const existingKeys = new Set<string>();
    copy.rows = copy.rows.map((r: any) => {
      const key = String(r.costType || '').toLowerCase();
      existingKeys.add(key);
      const h = histMap.get(key);
      if (h) {
        return {
          ...r,
          year1: h.year1 !== undefined ? h.year1 : r.year1,
          year2: h.year2 !== undefined ? h.year2 : r.year2,
          comments: h.comments !== undefined ? h.comments : r.comments,
        };
      }
      return r;
    });

    // append historical rows that weren't in the template
    histRows.forEach((r: any) => {
      const key = String(r.costType || '').toLowerCase();
      if (!existingKeys.has(key)) {
        copy.rows.push({ costType: r.costType, year1: r.year1 || 0, year2: r.year2 || 0, comments: r.comments || '' });
      }
    });

    copy.totals = {
      year1: copy.rows.reduce((s: number, rr: any) => s + (Number(rr.year1) || 0), 0),
      year2: copy.rows.reduce((s: number, rr: any) => s + (Number(rr.year2) || 0), 0),
    };
    return copy;
  } catch (e) {
    // fallback to original template if something goes wrong
    // eslint-disable-next-line no-console
    console.warn('fillBudgetWithHistorical merge failed, returning original template', e);
    return template;
  }
}

export function generateSAPPayload(crm: any, budget: any, hr: any) {
  // create a simplistic SAP import payload
  return {
    sapImportId: `SAP-${crm.projectId}`,
    project: {
      id: crm.projectId,
      name: crm.name,
      account: crm.account,
    },
    budget: budget.rows,
    totals: budget.totals,
  assignedResources: hr.employees.map((e: any) => ({ id: e.id, name: e.name, rate: e.billRate })),
  };
}

export function generateProfindaPayload(crm: any, hr: any) {
  return {
    profindaId: `PF-${crm.projectId}`,
    projectName: crm.name,
    skillsRequired: ['Consulting', 'Engineering'],
    resourcePool: hr.employees.map((e: any) => ({ id: e.id, name: e.name, title: e.role })),
  };
}
