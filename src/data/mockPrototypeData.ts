// Mock data derived from Sample files (CRM screenshots and Budget.xlsx)
export const mockCRM = {
  projectId: '0702208200025',
  name: 'Contoso Migration Project',
  account: 'Contoso Ltd',
  owner: 'Alice Johnson',
  region: 'US East',
  description: 'CRM lead exported from MS Dynamics. Screenshots show contact and account metadata.',
  contacts: [
    { name: 'Bob Chang', role: 'Engagement Lead', email: 'bob.chang@contoso.com' },
  ],
};

export const mockBudgetExcel = {
  templateName: 'Standard Budget v2',
  rows: [
    { costType: 'Project Name', year1: 0, year2: 0, comments: 'Contoso Migration Project' },
    { costType: 'Project Code', year1: 0, year2: 0, comments: '0702208200025' },
    { costType: 'Salaries', year1: 120000, year2: 125000, comments: '' },
    { costType: 'Contractors', year1: 30000, year2: 20000, comments: '' },
    { costType: 'Travel', year1: 8000, year2: 5000, comments: '' },
  ],
  totals: { year1: 158000, year2: 150000 },
};

export const mockHR = {
  employees: [
    { id: 'E100', name: 'Alice Johnson', role: 'Engagement Manager', billRate: 200 },
    { id: 'E101', name: 'Bob Chang', role: 'Senior Engineer', billRate: 150 },
    { id: 'E102', name: 'Carol Peters', role: 'Consultant', billRate: 120 },
  ],
};

// A small historical sample that aligns with the budget template — used to auto-fill
export const historicalSamples = [
  {
    sampleId: 'hist-2023-std',
    templateName: 'Standard Budget v2',
    rows: [
      { costType: 'Salaries', year1: 110000, year2: 115000 },
      { costType: 'Contractors', year1: 25000, year2: 22000 },
      { costType: 'Travel', year1: 7000, year2: 6000 },
    ],
  },
  {
    sampleId: 'hist-2022-budget',
    templateName: 'Budget',
    rows: [
      { costType: 'Salaries', year1: 125000, year2: 130000, comments: 'Includes bonus pool' },
      { costType: 'Contractors', year1: 40000, year2: 30000, comments: 'Higher contractor usage' },
      { costType: 'Travel', year1: 5000, year2: 4000, comments: '' },
      { costType: 'Software', year1: 12000, year2: 8000, comments: 'Licenses and tools' },
    ],
  },
  {
    sampleId: 'hist-psw-legacy',
    templateName: 'PSW2.6',
    rows: [
      { costType: 'Salaries', year1: 100000, year2: 105000 },
      { costType: 'Contractors', year1: 20000, year2: 15000 },
      { costType: 'Hardware', year1: 15000, year2: 5000 },
    ],
  },
];

export default { mockCRM, mockBudgetExcel, mockHR, historicalSamples };
