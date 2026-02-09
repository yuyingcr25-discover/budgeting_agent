// Types for Budgeting Agent

export type PathType = 'fast' | 'full';
export type ResourceLevel = 'Partner' | 'Senior Manager' | 'Manager' | 'Senior' | 'Staff' | 'Associate';

export interface BudgetingAgentProject {
  id: string;
  name: string;
  engagementLength: number; // in weeks
  pathType: PathType | null;
  createdAt: string;
  
  // Fast Path specific
  needsResourceAssignment?: boolean;
  resourceLevel?: ResourceLevel;
  totalHours?: number;
  
  // Full Path specific
  resourcesByLevel?: ResourceAllocation[];
  weeklyAllocations?: WeeklyAllocation[];
}

export interface ResourceAllocation {
  level: ResourceLevel;
  count: number;
  hoursPerWeek: number;
  totalHours: number;
}

export interface WeeklyAllocation {
  weekNumber: number;
  weekStartDate: string;
  allocations: {
    level: ResourceLevel;
    hours: number;
  }[];
}

export interface FastPathFormData {
  projectName: string;
  engagementLength: number;
  needsResourceAssignment: boolean;
  resourceLevel: ResourceLevel;
  totalHours: number;
}

export interface FullPathFormData {
  projectName: string;
  engagementLength: number;
  startDate: string;
  resourcesByLevel: ResourceAllocation[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: BudgetSuggestion[];
}

export interface BudgetSuggestion {
  field: string;
  value: any;
  reason: string;
}

export interface BudgetLineItem {
  resourceLevel: ResourceLevel;
  count: number;
  hoursPerWeek: number;
  hours: number;
  rate: number;
  laborCost: number;
  revenue: number;
  cost: number;
  grossMargin: number;
  grossMarginPercent: number;
}

export interface BudgetEstimate {
  projectName: string;
  engagementLength: number;
  lineItems: BudgetLineItem[];
  totalHours: number;
  totalRevenue: number;
  totalCost: number;
  totalGrossMargin: number;
  grossMarginPercent: number;
}
