import { create } from 'zustand';
import type {
  Project,
  BudgetLine,
  Subcontractor,
  Expense,
  ResourceDemand,
  BudgetMetrics,
  GrossMarginMetrics,
  DemandMetrics,
  ValidationResult,
  ValidationError
} from '../types';
import {
  getRoleById,
  GROSS_MARGIN_TARGET,
  ADMIN_FEE_PERCENT
} from '../data/referenceData';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createEmptyProject(): Project {
  return {
    id: generateId(),
    sapProjectId: '',
    clientId: '',
    clientName: '',
    yearEnd: '',
    industryId: '',
    deliveryServiceOrg: '',
    resourceManagerId: '',
    resourceManagerName: '',
    contractType: 'Time & Materials',
    totalProjectFee: 0,
    timeEntryStartDate: null,
    budgetTemplateId: '',
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    budgetLines: [],
    subcontractors: [],
    expenses: [],
    feeAdjustment: 0,
    adminFeePercent: ADMIN_FEE_PERCENT,
    demandStartDate: null,
    resourceDemands: [],
  };
}

interface ProjectStore {
  currentProject: Project;
  savedProjects: Project[];
  currentStep: number;

  // Project actions
  setCurrentProject: (project: Partial<Project>) => void;
  resetProject: () => void;
  saveProject: () => void;
  loadProject: (id: string) => void;

  // Step navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Budget actions
  setBudgetLine: (workPackageId: string, workItemId: string | null, roleId: string, hours: number) => void;
  getBudgetHours: (workPackageId: string, workItemId: string | null, roleId: string) => number;

  // Subcontractor actions
  addSubcontractor: (sub: Omit<Subcontractor, 'id'>) => void;
  updateSubcontractor: (id: string, sub: Partial<Subcontractor>) => void;
  removeSubcontractor: (id: string) => void;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  // Demand actions
  addResourceDemand: (demand: Omit<ResourceDemand, 'id'>) => void;
  updateResourceDemand: (id: string, demand: Partial<ResourceDemand>) => void;
  removeResourceDemand: (id: string) => void;
  setDemandWeeklyHours: (demandId: string, week: number, hours: number) => void;

  // Calculated metrics
  getBudgetMetrics: () => BudgetMetrics;
  getGrossMarginMetrics: () => GrossMarginMetrics;
  getDemandMetrics: () => DemandMetrics;

  // Validation
  validateProject: () => ValidationResult;
  validateStep: (step: number) => ValidationResult;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProject: createEmptyProject(),
  savedProjects: [],
  currentStep: 1,

  setCurrentProject: (project) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      ...project,
      updatedAt: new Date().toISOString(),
    }
  })),

  resetProject: () => set({
    currentProject: createEmptyProject(),
    currentStep: 1,
  }),

  saveProject: () => set((state) => {
    const existingIndex = state.savedProjects.findIndex(
      p => p.id === state.currentProject.id
    );

    const updatedProjects = existingIndex >= 0
      ? state.savedProjects.map((p, i) =>
          i === existingIndex ? state.currentProject : p
        )
      : [...state.savedProjects, state.currentProject];

    return { savedProjects: updatedProjects };
  }),

  loadProject: (id) => set((state) => {
    const project = state.savedProjects.find(p => p.id === id);
    if (project) {
      return { currentProject: project, currentStep: 1 };
    }
    return {};
  }),

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  setBudgetLine: (workPackageId, workItemId, roleId, hours) => set((state) => {
    const existingIndex = state.currentProject.budgetLines.findIndex(
      bl => bl.workPackageId === workPackageId &&
            bl.workItemId === workItemId &&
            bl.roleId === roleId
    );

    let updatedLines: BudgetLine[];

    if (hours === 0 && existingIndex >= 0) {
      updatedLines = state.currentProject.budgetLines.filter((_, i) => i !== existingIndex);
    } else if (existingIndex >= 0) {
      updatedLines = state.currentProject.budgetLines.map((bl, i) =>
        i === existingIndex ? { ...bl, hours } : bl
      );
    } else if (hours > 0) {
      updatedLines = [
        ...state.currentProject.budgetLines,
        {
          id: generateId(),
          workPackageId,
          workItemId,
          roleId,
          hours,
          rateOverride: null,
          isSubcontractor: false,
        }
      ];
    } else {
      updatedLines = state.currentProject.budgetLines;
    }

    return {
      currentProject: {
        ...state.currentProject,
        budgetLines: updatedLines,
        updatedAt: new Date().toISOString(),
      }
    };
  }),

  getBudgetHours: (workPackageId, workItemId, roleId) => {
    const line = get().currentProject.budgetLines.find(
      bl => bl.workPackageId === workPackageId &&
            bl.workItemId === workItemId &&
            bl.roleId === roleId
    );
    return line?.hours || 0;
  },

  addSubcontractor: (sub) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      subcontractors: [
        ...state.currentProject.subcontractors,
        { ...sub, id: generateId() }
      ],
      updatedAt: new Date().toISOString(),
    }
  })),

  updateSubcontractor: (id, sub) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      subcontractors: state.currentProject.subcontractors.map(s =>
        s.id === id ? { ...s, ...sub } : s
      ),
      updatedAt: new Date().toISOString(),
    }
  })),

  removeSubcontractor: (id) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      subcontractors: state.currentProject.subcontractors.filter(s => s.id !== id),
      updatedAt: new Date().toISOString(),
    }
  })),

  addExpense: (expense) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      expenses: [
        ...state.currentProject.expenses,
        { ...expense, id: generateId() }
      ],
      updatedAt: new Date().toISOString(),
    }
  })),

  updateExpense: (id, expense) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      expenses: state.currentProject.expenses.map(e =>
        e.id === id ? { ...e, ...expense } : e
      ),
      updatedAt: new Date().toISOString(),
    }
  })),

  removeExpense: (id) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      expenses: state.currentProject.expenses.filter(e => e.id !== id),
      updatedAt: new Date().toISOString(),
    }
  })),

  addResourceDemand: (demand) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      resourceDemands: [
        ...state.currentProject.resourceDemands,
        { ...demand, id: generateId() }
      ],
      updatedAt: new Date().toISOString(),
    }
  })),

  updateResourceDemand: (id, demand) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      resourceDemands: state.currentProject.resourceDemands.map(d =>
        d.id === id ? { ...d, ...demand } : d
      ),
      updatedAt: new Date().toISOString(),
    }
  })),

  removeResourceDemand: (id) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      resourceDemands: state.currentProject.resourceDemands.filter(d => d.id !== id),
      updatedAt: new Date().toISOString(),
    }
  })),

  setDemandWeeklyHours: (demandId, week, hours) => set((state) => ({
    currentProject: {
      ...state.currentProject,
      resourceDemands: state.currentProject.resourceDemands.map(d => {
        if (d.id !== demandId) return d;
        const weeklyHours = { ...d.weeklyHours };
        if (hours === 0) {
          delete weeklyHours[week];
        } else {
          weeklyHours[week] = hours;
        }
        return { ...d, weeklyHours };
      }),
      updatedAt: new Date().toISOString(),
    }
  })),

  getBudgetMetrics: () => {
    const { currentProject } = get();
    const hoursByRole: Record<string, number> = {};
    const hoursByWorkPackage: Record<string, number> = {};

    let totalHours = 0;
    let totalHoursByCR = 0;
    let totalHoursBySub = 0;
    let estimatedBillings = 0;
    let laborCost = 0;

    for (const line of currentProject.budgetLines) {
      const role = getRoleById(line.roleId);
      if (!role) continue;

      totalHours += line.hours;

      if (line.isSubcontractor) {
        totalHoursBySub += line.hours;
      } else {
        totalHoursByCR += line.hours;
      }

      const rate = line.rateOverride ?? role.standardRate;
      estimatedBillings += line.hours * rate;
      laborCost += line.hours * role.laborCost;

      hoursByRole[line.roleId] = (hoursByRole[line.roleId] || 0) + line.hours;
      hoursByWorkPackage[line.workPackageId] = (hoursByWorkPackage[line.workPackageId] || 0) + line.hours;
    }

    return {
      totalHours,
      totalHoursByCR,
      totalHoursBySub,
      estimatedBillings,
      laborCost,
      hoursByRole,
      hoursByWorkPackage,
    };
  },

  getGrossMarginMetrics: () => {
    const { currentProject } = get();
    const budgetMetrics = get().getBudgetMetrics();

    const laborFees = budgetMetrics.estimatedBillings;
    const adminFee = laborFees * currentProject.adminFeePercent;
    const expenseRevenue = currentProject.expenses
      .filter(e => e.isBillable)
      .reduce((sum, e) => sum + e.amount, 0);
    const resaleRevenue = 0; // Could add resale items
    const feeAdjustment = currentProject.feeAdjustment;

    const totalRevenue = laborFees + adminFee + expenseRevenue + resaleRevenue + feeAdjustment;

    const staffCost = budgetMetrics.laborCost;
    const subcontractorCost = currentProject.subcontractors
      .reduce((sum, s) => sum + (s.hours * s.costPerHour), 0);
    const expenseCost = currentProject.expenses
      .reduce((sum, e) => sum + e.amount, 0);
    const resaleCost = 0;

    const totalCost = staffCost + subcontractorCost + expenseCost + resaleCost;

    const grossMargin = totalRevenue - totalCost;
    const grossMarginPercent = totalRevenue > 0 ? grossMargin / totalRevenue : 0;
    const meetsTarget = grossMarginPercent >= GROSS_MARGIN_TARGET;

    return {
      laborFees,
      adminFee,
      expenseRevenue,
      resaleRevenue,
      feeAdjustment,
      totalRevenue,
      staffCost,
      subcontractorCost,
      expenseCost,
      resaleCost,
      totalCost,
      grossMargin,
      grossMarginPercent,
      meetsTarget,
    };
  },

  getDemandMetrics: () => {
    const { currentProject } = get();
    const budgetMetrics = get().getBudgetMetrics();

    const demandByRole: Record<string, number> = {};
    const demandByWeek: Record<number, number> = {};
    let totalDemandHours = 0;

    for (const demand of currentProject.resourceDemands) {
      for (const [week, hours] of Object.entries(demand.weeklyHours)) {
        totalDemandHours += hours;
        demandByRole[demand.roleId] = (demandByRole[demand.roleId] || 0) + hours;
        demandByWeek[parseInt(week)] = (demandByWeek[parseInt(week)] || 0) + hours;
      }
    }

    // Exclude partner hours from variance calculation
    const budgetHoursExcludingPartners = Object.entries(budgetMetrics.hoursByRole)
      .filter(([roleId]) => {
        const role = getRoleById(roleId);
        return role && !role.name.toLowerCase().includes('partner');
      })
      .reduce((sum, [, hours]) => sum + hours, 0);

    const variance = budgetHoursExcludingPartners - totalDemandHours;

    return {
      totalDemandHours,
      demandByRole,
      demandByWeek,
      variance,
    };
  },

  validateProject: () => {
    const errors: ValidationError[] = [];

    for (let step = 1; step <= 5; step++) {
      const stepValidation = get().validateStep(step);
      errors.push(...stepValidation.errors);
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
    };
  },

  validateStep: (step) => {
    const { currentProject } = get();
    const errors: ValidationError[] = [];

    switch (step) {
      case 1: // Project Setup
        if (!currentProject.sapProjectId) {
          errors.push({ field: 'sapProjectId', message: 'Project # is required', severity: 'error' });
        }
        if (!currentProject.industryId) {
          errors.push({ field: 'industryId', message: 'Industry is required', severity: 'error' });
        }
        if (!currentProject.budgetTemplateId) {
          errors.push({ field: 'budgetTemplateId', message: 'Budget template is required', severity: 'error' });
        }
        if (currentProject.contractType === 'Fixed Fee' && currentProject.totalProjectFee <= 0) {
          errors.push({ field: 'totalProjectFee', message: 'Total Project Fee is required for Fixed Fee contracts', severity: 'error' });
        }
        break;

      case 2: // Budget
        const budgetMetrics = get().getBudgetMetrics();
        if (budgetMetrics.totalHours === 0) {
          errors.push({ field: 'budget', message: 'Budget must have at least one hour entry', severity: 'error' });
        }
        break;

      case 3: // Gross Margin
        const gmMetrics = get().getGrossMarginMetrics();
        if (!gmMetrics.meetsTarget) {
          errors.push({
            field: 'grossMargin',
            message: `Gross margin (${(gmMetrics.grossMarginPercent * 100).toFixed(1)}%) is below target (38.5%)`,
            severity: 'warning'
          });
        }
        break;

      case 4: // Demand
        if (!currentProject.demandStartDate) {
          errors.push({ field: 'demandStartDate', message: 'Start date is required', severity: 'error' });
        }
        const demandMetrics = get().getDemandMetrics();
        if (demandMetrics.variance !== 0) {
          errors.push({
            field: 'demandHours',
            message: `Demand hours variance: ${demandMetrics.variance} hours`,
            severity: demandMetrics.variance > 0 ? 'warning' : 'error'
          });
        }
        break;

      case 5: // Review
        // Aggregate all validations
        break;
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
    };
  },
}));
