import type { Project } from '../../types';

export interface FieldStatus {
  fieldId: string;
  fieldName: string;
  isComplete: boolean;
  isRequired: boolean;
  hint?: string;
}

export interface StepCompletionStatus {
  step: number;
  fields: FieldStatus[];
  completedCount: number;
  requiredCount: number;
  isComplete: boolean;
  nextIncompleteField: FieldStatus | null;
  progressPercent: number;
}

export function getStepCompletion(step: number, project: Project): StepCompletionStatus {
  let fields: FieldStatus[] = [];

  switch (step) {
    case 1:
      fields = [
        {
          fieldId: 'sapProjectId',
          fieldName: 'SAP Project Number',
          isComplete: !!project.sapProjectId,
          isRequired: true,
          hint: 'Enter the 13-digit project number and click Lookup to load client information',
        },
        {
          fieldId: 'industryId',
          fieldName: 'Industry',
          isComplete: !!project.industryId,
          isRequired: true,
          hint: 'Select the industry that best matches this project',
        },
        {
          fieldId: 'resourceManagerId',
          fieldName: 'Resource Manager',
          isComplete: !!project.resourceManagerId,
          isRequired: false,
          hint: 'Choose a resource manager to oversee resource allocation',
        },
        {
          fieldId: 'contractType',
          fieldName: 'Contract Type',
          isComplete: true, // Always has a default value
          isRequired: true,
        },
        {
          fieldId: 'budgetTemplateId',
          fieldName: 'Budget Template',
          isComplete: !!project.budgetTemplateId,
          isRequired: true,
          hint: 'Select a template to structure your budget work packages',
        },
      ];
      break;

    case 2: {
      const hasBudgetHours = project.budgetLines && project.budgetLines.length > 0;
      fields = [
        {
          fieldId: 'budgetLines',
          fieldName: 'Budget Hours',
          isComplete: hasBudgetHours,
          isRequired: true,
          hint: 'Enter hours for at least one role in a work package',
        },
      ];
      break;
    }

    case 3:
      // Step 3 is mostly read-only display, just check if we have data to show
      fields = [
        {
          fieldId: 'grossMarginReviewed',
          fieldName: 'Gross Margin Review',
          isComplete: true, // Viewing step 3 counts as reviewed
          isRequired: false,
        },
      ];
      break;

    case 4:
      fields = [
        {
          fieldId: 'demandStartDate',
          fieldName: 'Demand Start Date',
          isComplete: !!project.demandStartDate,
          isRequired: true,
          hint: 'Select the week when resource work should begin',
        },
        {
          fieldId: 'resourceDemands',
          fieldName: 'Resource Demand Entries',
          isComplete: project.resourceDemands && project.resourceDemands.length > 0,
          isRequired: true,
          hint: 'Add at least one resource demand with weekly hours',
        },
      ];
      break;

    case 5:
      // Review step - check overall completion
      fields = [
        {
          fieldId: 'readyForSubmit',
          fieldName: 'Project Review',
          isComplete: true,
          isRequired: false,
        },
      ];
      break;
  }

  const requiredFields = fields.filter(f => f.isRequired);
  const completedRequired = requiredFields.filter(f => f.isComplete);
  const nextIncomplete = fields.find(f => f.isRequired && !f.isComplete) || null;

  return {
    step,
    fields,
    completedCount: completedRequired.length,
    requiredCount: requiredFields.length,
    isComplete: completedRequired.length === requiredFields.length,
    nextIncompleteField: nextIncomplete,
    progressPercent: requiredFields.length > 0
      ? Math.round((completedRequired.length / requiredFields.length) * 100)
      : 100,
  };
}

export function getNextActionPrompt(completion: StepCompletionStatus): string | null {
  if (completion.isComplete) {
    if (completion.step < 5) {
      return `Great job! You've completed all required fields for this step. Click "Next" to continue to step ${completion.step + 1}.`;
    }
    return "Your project is ready for review. Check the summary and submit when ready.";
  }

  const next = completion.nextIncompleteField;
  if (next) {
    return next.hint || `Please complete the "${next.fieldName}" field.`;
  }

  return null;
}

export function hasFieldChanged(
  prevProject: Partial<Project>,
  currentProject: Project,
  fieldId: string
): boolean {
  const prevValue = (prevProject as unknown as Record<string, unknown>)[fieldId];
  const currentValue = (currentProject as unknown as Record<string, unknown>)[fieldId];

  // Handle arrays (like budgetLines, resourceDemands)
  if (Array.isArray(currentValue)) {
    const prevArray = Array.isArray(prevValue) ? prevValue : [];
    return currentValue.length !== prevArray.length;
  }

  return prevValue !== currentValue;
}
