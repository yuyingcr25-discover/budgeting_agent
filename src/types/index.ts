// Core data types for PSW application

export type ContractType = 'Fixed Fee' | 'Time & Materials';
export type ProjectStatus = 'Draft' | 'Submitted' | 'Approved' | 'Uploaded';
export type ResourceRequestType = 'Named' | 'Unnamed' | 'Generic';

export interface Role {
  id: string;
  code: string;
  name: string;
  standardRate: number;
  laborCost: number;
  isIndia: boolean;
  isActive: boolean;
}

export interface Industry {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface WorkItem {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
}

export interface WorkPackage {
  id: string;
  extensionId: string;
  name: string;
  displayOrder: number;
  workItems: WorkItem[];
}

export interface BudgetTemplate {
  id: string;
  name: string;
  category: string;
  workPackages: WorkPackage[];
}

export interface BudgetLine {
  id: string;
  workPackageId: string;
  workItemId: string | null;
  roleId: string;
  hours: number;
  rateOverride: number | null;
  isSubcontractor: boolean;
}

export interface Subcontractor {
  id: string;
  name: string;
  hours: number;
  roleId: string;
  costPerHour: number;
  billRatePerHour: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  isBillable: boolean;
}

export interface ResourceDemand {
  id: string;
  requestType: ResourceRequestType;
  employeeEmail: string | null;
  employeeName: string | null;
  employeeId: string | null;
  roleId: string;
  serviceDepartment: string;
  locationId: string;
  weeklyHours: Record<number, number>; // week number -> hours
}

export interface Project {
  id: string;
  sapProjectId: string;
  clientId: string;
  clientName: string;
  yearEnd: string;
  industryId: string;
  deliveryServiceOrg: string;
  resourceManagerId: string;
  resourceManagerName: string;
  contractType: ContractType;
  totalProjectFee: number;
  timeEntryStartDate: string | null;
  budgetTemplateId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;

  // Budget data
  budgetLines: BudgetLine[];

  // Gross margin data
  subcontractors: Subcontractor[];
  expenses: Expense[];
  feeAdjustment: number;
  adminFeePercent: number;

  // Demand data
  demandStartDate: string | null;
  resourceDemands: ResourceDemand[];
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Calculated metrics
export interface BudgetMetrics {
  totalHours: number;
  totalHoursByCR: number;
  totalHoursBySub: number;
  estimatedBillings: number;
  laborCost: number;
  hoursByRole: Record<string, number>;
  hoursByWorkPackage: Record<string, number>;
}

export interface GrossMarginMetrics {
  laborFees: number;
  adminFee: number;
  expenseRevenue: number;
  resaleRevenue: number;
  feeAdjustment: number;
  totalRevenue: number;

  staffCost: number;
  subcontractorCost: number;
  expenseCost: number;
  resaleCost: number;
  totalCost: number;

  grossMargin: number;
  grossMarginPercent: number;
  meetsTarget: boolean;
}

export interface DemandMetrics {
  totalDemandHours: number;
  demandByRole: Record<string, number>;
  demandByWeek: Record<number, number>;
  variance: number;
}
