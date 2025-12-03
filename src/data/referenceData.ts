import type { Role, Industry, Location, BudgetTemplate } from '../types';

export const roles: Role[] = [
  { id: 'T001', code: 'T001', name: 'Partner', standardRate: 830, laborCost: 368, isIndia: false, isActive: true },
  { id: 'T002', code: 'T002', name: 'Senior Partner', standardRate: 895, laborCost: 386, isIndia: false, isActive: true },
  { id: 'T035', code: 'T035', name: 'Managing Dir', standardRate: 725, laborCost: 345, isIndia: false, isActive: true },
  { id: 'T006', code: 'T006', name: 'Director', standardRate: 680, laborCost: 238, isIndia: false, isActive: true },
  { id: 'T005', code: 'T005', name: 'Senior Manager', standardRate: 660, laborCost: 150, isIndia: false, isActive: true },
  { id: 'T004', code: 'T004', name: 'Manager', standardRate: 580, laborCost: 109, isIndia: false, isActive: true },
  { id: 'T003', code: 'T003', name: 'Senior', standardRate: 430, laborCost: 73, isIndia: false, isActive: true },
  { id: 'T007', code: 'T007', name: 'Staff', standardRate: 300, laborCost: 51, isIndia: false, isActive: true },
  { id: 'T034', code: 'T034', name: 'Intern', standardRate: 200, laborCost: 36, isIndia: false, isActive: true },
  { id: 'T023', code: 'T023', name: 'India-Director', standardRate: 680, laborCost: 81, isIndia: true, isActive: true },
  { id: 'T022', code: 'T022', name: 'India-Senior Manager', standardRate: 660, laborCost: 41, isIndia: true, isActive: true },
  { id: 'T021', code: 'T021', name: 'India-Manager', standardRate: 580, laborCost: 30, isIndia: true, isActive: true },
  { id: 'T020', code: 'T020', name: 'India-Senior', standardRate: 430, laborCost: 20, isIndia: true, isActive: true },
  { id: 'T019', code: 'T019', name: 'India-Staff', standardRate: 300, laborCost: 13, isIndia: true, isActive: true },
];

export const industries: Industry[] = [
  { id: '1', name: 'Affordable Housing' },
  { id: '2', name: 'Cannabis' },
  { id: '3', name: 'Commercial Real Estate' },
  { id: '4', name: 'Construction' },
  { id: '5', name: 'Family Offices (Services)' },
  { id: '6', name: 'Financial Services' },
  { id: '7', name: 'Financial Sponsors' },
  { id: '8', name: 'Government' },
  { id: '9', name: 'Government Contracting' },
  { id: '10', name: 'HealthCare' },
  { id: '11', name: 'Hospitality' },
  { id: '12', name: 'Life Sciences' },
  { id: '13', name: 'Manufacturing & Distribution' },
  { id: '14', name: 'Not For Profit & Education' },
  { id: '15', name: 'Private Client Services' },
  { id: '16', name: 'Private Equity' },
  { id: '17', name: 'Professional Services' },
  { id: '18', name: 'Renewable Energy' },
  { id: '19', name: 'Retail & Consumer Products' },
  { id: '20', name: 'Technology' },
];

export const locations: Location[] = [
  { id: '1', name: 'Atlanta' },
  { id: '2', name: 'Austin' },
  { id: '3', name: 'Baltimore' },
  { id: '4', name: 'Bethesda' },
  { id: '5', name: 'Boca Raton' },
  { id: '6', name: 'Boston' },
  { id: '7', name: 'Charlotte' },
  { id: '8', name: 'Chennai' },
  { id: '9', name: 'Chicago' },
  { id: '10', name: 'Dallas' },
  { id: '11', name: 'Denver' },
  { id: '12', name: 'Hartford' },
  { id: '13', name: 'Houston' },
  { id: '14', name: 'Los Angeles' },
  { id: '15', name: 'Miami' },
  { id: '16', name: 'New York' },
  { id: '17', name: 'Parsippany' },
  { id: '18', name: 'Philippines' },
  { id: '19', name: 'San Francisco' },
  { id: '20', name: 'Tampa' },
  { id: '21', name: 'Tysons Corner' },
  { id: '22', name: 'Washington DC' },
];

export const budgetTemplates: BudgetTemplate[] = [
  {
    id: 'assur-standard',
    name: 'ASSUR-Standard',
    category: 'Assurance',
    workPackages: [
      {
        id: 'wp-1',
        extensionId: '1.1',
        name: 'Preliminary Engagement Activities',
        displayOrder: 1,
        workItems: [
          { id: 'wi-1-1', code: 'P567', name: 'Entity Info and Background', displayOrder: 1 },
          { id: 'wi-1-2', code: 'P314', name: 'Client/Engmt Acceptance & Continuance Form', displayOrder: 2 },
          { id: 'wi-1-3', code: 'P315', name: 'Comm-PredAuditor Prior to Acceptance', displayOrder: 3 },
          { id: 'wi-1-4', code: 'P318', name: 'Audit Budget & GM projection', displayOrder: 4 },
          { id: 'wi-1-5', code: 'P319', name: 'Audit Engagement Letter', displayOrder: 5 },
        ],
      },
      {
        id: 'wp-2',
        extensionId: '1.2',
        name: 'Planning',
        displayOrder: 2,
        workItems: [
          { id: 'wi-2-1', code: 'P400', name: 'Risk Assessment', displayOrder: 1 },
          { id: 'wi-2-2', code: 'P401', name: 'Materiality Determination', displayOrder: 2 },
          { id: 'wi-2-3', code: 'P402', name: 'Audit Strategy', displayOrder: 3 },
          { id: 'wi-2-4', code: 'P403', name: 'Audit Plan Documentation', displayOrder: 4 },
        ],
      },
      {
        id: 'wp-3',
        extensionId: '1.3',
        name: 'Internal Controls',
        displayOrder: 3,
        workItems: [
          { id: 'wi-3-1', code: 'P500', name: 'Understand Entity Controls', displayOrder: 1 },
          { id: 'wi-3-2', code: 'P501', name: 'Test of Controls', displayOrder: 2 },
          { id: 'wi-3-3', code: 'P502', name: 'IT General Controls', displayOrder: 3 },
        ],
      },
      {
        id: 'wp-4',
        extensionId: '1.4',
        name: 'Substantive Testing',
        displayOrder: 4,
        workItems: [
          { id: 'wi-4-1', code: 'P600', name: 'Cash and Equivalents', displayOrder: 1 },
          { id: 'wi-4-2', code: 'P601', name: 'Accounts Receivable', displayOrder: 2 },
          { id: 'wi-4-3', code: 'P602', name: 'Inventory', displayOrder: 3 },
          { id: 'wi-4-4', code: 'P603', name: 'Fixed Assets', displayOrder: 4 },
          { id: 'wi-4-5', code: 'P604', name: 'Accounts Payable', displayOrder: 5 },
          { id: 'wi-4-6', code: 'P605', name: 'Revenue Testing', displayOrder: 6 },
        ],
      },
      {
        id: 'wp-5',
        extensionId: '1.5',
        name: 'Completion',
        displayOrder: 5,
        workItems: [
          { id: 'wi-5-1', code: 'P700', name: 'Subsequent Events', displayOrder: 1 },
          { id: 'wi-5-2', code: 'P701', name: 'Management Representations', displayOrder: 2 },
          { id: 'wi-5-3', code: 'P702', name: 'Final Analytics', displayOrder: 3 },
          { id: 'wi-5-4', code: 'P703', name: 'Audit Report Preparation', displayOrder: 4 },
        ],
      },
    ],
  },
  {
    id: 'tax-compliance',
    name: 'Tax Compliance',
    category: 'Tax',
    workPackages: [
      {
        id: 'tax-wp-1',
        extensionId: '1.1',
        name: 'Scheduling/Engagement Planning',
        displayOrder: 1,
        workItems: [
          { id: 'tax-wi-1-1', code: 'T100', name: 'Client Intake', displayOrder: 1 },
          { id: 'tax-wi-1-2', code: 'T101', name: 'Prior Year Review', displayOrder: 2 },
        ],
      },
      {
        id: 'tax-wp-2',
        extensionId: '1.2',
        name: 'Extensions',
        displayOrder: 2,
        workItems: [
          { id: 'tax-wi-2-1', code: 'T200', name: 'Prepare Extensions', displayOrder: 1 },
        ],
      },
      {
        id: 'tax-wp-3',
        extensionId: '1.3',
        name: 'Estimates/Tax Planning',
        displayOrder: 3,
        workItems: [
          { id: 'tax-wi-3-1', code: 'T300', name: 'Quarterly Estimates', displayOrder: 1 },
          { id: 'tax-wi-3-2', code: 'T301', name: 'Tax Projections', displayOrder: 2 },
        ],
      },
      {
        id: 'tax-wp-4',
        extensionId: '1.4',
        name: 'Preparation',
        displayOrder: 4,
        workItems: [
          { id: 'tax-wi-4-1', code: 'T400', name: 'Federal Return', displayOrder: 1 },
          { id: 'tax-wi-4-2', code: 'T401', name: 'State Returns', displayOrder: 2 },
          { id: 'tax-wi-4-3', code: 'T402', name: 'Local Returns', displayOrder: 3 },
        ],
      },
      {
        id: 'tax-wp-5',
        extensionId: '1.5',
        name: 'Review',
        displayOrder: 5,
        workItems: [
          { id: 'tax-wi-5-1', code: 'T500', name: 'Manager Review', displayOrder: 1 },
          { id: 'tax-wi-5-2', code: 'T501', name: 'Partner Review', displayOrder: 2 },
        ],
      },
    ],
  },
  {
    id: 'gcs-standard',
    name: 'GCS-Standard',
    category: 'GCS (Advisory)',
    workPackages: [
      {
        id: 'gcs-wp-1',
        extensionId: '1.1',
        name: 'Project Management & Administration',
        displayOrder: 1,
        workItems: [],
      },
      {
        id: 'gcs-wp-2',
        extensionId: '1.2',
        name: 'Project Planning/Define',
        displayOrder: 2,
        workItems: [],
      },
      {
        id: 'gcs-wp-3',
        extensionId: '1.3',
        name: 'Discovery/Assess/Onboard',
        displayOrder: 3,
        workItems: [],
      },
      {
        id: 'gcs-wp-4',
        extensionId: '1.4',
        name: 'Project Execution: Design/Delivery',
        displayOrder: 4,
        workItems: [],
      },
      {
        id: 'gcs-wp-5',
        extensionId: '1.5',
        name: 'Post-Delivery Support',
        displayOrder: 5,
        workItems: [],
      },
      {
        id: 'gcs-wp-6',
        extensionId: '1.6',
        name: 'Travel',
        displayOrder: 6,
        workItems: [],
      },
    ],
  },
  {
    id: 'v360-tas',
    name: 'V360-TAS',
    category: 'V360 (Valuation)',
    workPackages: [
      {
        id: 'v360-wp-1',
        extensionId: '1.1',
        name: 'Due Diligence Procedures',
        displayOrder: 1,
        workItems: [
          { id: 'v360-wi-1-1', code: 'P781', name: 'Reading audit/review work papers', displayOrder: 1 },
          { id: 'v360-wi-1-2', code: 'P782', name: 'All other due diligence procedures', displayOrder: 2 },
          { id: 'v360-wi-1-3', code: 'P783', name: "India team's time", displayOrder: 3 },
        ],
      },
      {
        id: 'v360-wp-2',
        extensionId: '1.2',
        name: 'Tax Due Diligence',
        displayOrder: 2,
        workItems: [
          { id: 'v360-wi-2-1', code: 'P786', name: 'Tax due diligence', displayOrder: 1 },
        ],
      },
      {
        id: 'v360-wp-3',
        extensionId: '1.3',
        name: 'Financial Due Diligence',
        displayOrder: 3,
        workItems: [
          { id: 'v360-wi-3-1', code: 'P790', name: 'Quality of earnings', displayOrder: 1 },
          { id: 'v360-wi-3-2', code: 'P791', name: 'Working capital analysis', displayOrder: 2 },
        ],
      },
    ],
  },
];

// Sample SAP project data for lookup
export const sapProjects = [
  { projectId: '0001251396026', clientId: 'C10045', clientName: 'Acme Corporation', yearEnd: '12/31/2024', deliveryOrg: 'Assurance' },
  { projectId: '0002491434026', clientId: 'C10102', clientName: 'TechStart Inc', yearEnd: '06/30/2024', deliveryOrg: 'Tax' },
  { projectId: '0017850123025', clientId: 'C20033', clientName: 'Global Manufacturing LLC', yearEnd: '12/31/2024', deliveryOrg: 'Assurance' },
  { projectId: '0018621413025', clientId: 'C30055', clientName: 'HealthFirst Partners', yearEnd: '09/30/2024', deliveryOrg: 'GCS' },
  { projectId: '0019234567890', clientId: 'C40088', clientName: 'Renewable Energy Corp', yearEnd: '12/31/2024', deliveryOrg: 'V360' },
];

export const resourceManagers = [
  { id: 'rm-1', name: 'Sandy Stanfield', email: 'sstanfield@cr.com' },
  { id: 'rm-2', name: 'John Mitchell', email: 'jmitchell@cr.com' },
  { id: 'rm-3', name: 'Maria Garcia', email: 'mgarcia@cr.com' },
  { id: 'rm-4', name: 'David Chen', email: 'dchen@cr.com' },
];

export const deliveryServiceOrgs = [
  'Assurance',
  'Tax',
  'GCS',
  'V360',
  'Consulting',
  'Government',
];

export const templateCategories = [
  { id: 'assurance', name: 'Assurance', count: 20 },
  { id: 'tax', name: 'Tax', count: 10 },
  { id: 'gcs', name: 'GCS (Advisory)', count: 20 },
  { id: 'v360', name: 'V360 (Valuation)', count: 15 },
  { id: 'ah', name: 'Affordable Housing', count: 10 },
  { id: 'other', name: 'Other', count: 10 },
];

// Helper functions
export function getRoleById(id: string): Role | undefined {
  return roles.find(r => r.id === id);
}

export function getIndustryById(id: string): Industry | undefined {
  return industries.find(i => i.id === id);
}

export function getLocationById(id: string): Location | undefined {
  return locations.find(l => l.id === id);
}

export function getTemplateById(id: string): BudgetTemplate | undefined {
  return budgetTemplates.find(t => t.id === id);
}

export function lookupSapProject(projectId: string) {
  return sapProjects.find(p => p.projectId === projectId);
}

export const GROSS_MARGIN_TARGET = 0.385; // 38.5%
export const ADMIN_FEE_PERCENT = 0.10; // 10%
export const FIXED_FEE_REALIZATION_RATE = 0.40; // 40%
