import type { Project } from '../../types';
import { industries, budgetTemplates, resourceManagers } from '../../data/referenceData';

export interface FieldSuggestion {
  fieldId: string;
  fieldName: string;
  value: string;
  displayValue: string;
  reason: string;
}

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

/**
 * Generate a smart suggestion for a field based on the current project context
 */
export function getFieldSuggestion(fieldId: string, project: Project): FieldSuggestion | null {
  switch (fieldId) {
    case 'industryId': {
      // Suggest based on client name patterns or default to a common industry
      const clientName = project.clientName?.toLowerCase() || '';
      let suggestedIndustry = industries[5]; // Default: Financial Services

      if (clientName.includes('tech') || clientName.includes('software')) {
        suggestedIndustry = industries.find(i => i.name === 'Technology') || suggestedIndustry;
      } else if (clientName.includes('health') || clientName.includes('medical')) {
        suggestedIndustry = industries.find(i => i.name === 'HealthCare') || suggestedIndustry;
      } else if (clientName.includes('manufactur')) {
        suggestedIndustry = industries.find(i => i.name === 'Manufacturing & Distribution') || suggestedIndustry;
      } else if (clientName.includes('energy') || clientName.includes('renewable')) {
        suggestedIndustry = industries.find(i => i.name === 'Renewable Energy') || suggestedIndustry;
      }

      return {
        fieldId: 'industryId',
        fieldName: 'Industry',
        value: suggestedIndustry.id,
        displayValue: suggestedIndustry.name,
        reason: clientName
          ? `Based on the client name "${project.clientName}"`
          : 'A common industry selection',
      };
    }

    case 'resourceManagerId': {
      // Suggest the first resource manager as a default
      const rm = resourceManagers[0];
      return {
        fieldId: 'resourceManagerId',
        fieldName: 'Resource Manager',
        value: rm.id,
        displayValue: rm.name,
        reason: 'Available resource manager for your region',
      };
    }

    case 'budgetTemplateId': {
      // Suggest template based on delivery org or industry
      const deliveryOrg = project.deliveryServiceOrg?.toLowerCase() || '';
      let template = budgetTemplates[0]; // Default: Assurance

      if (deliveryOrg.includes('tax')) {
        template = budgetTemplates.find(t => t.category === 'Tax') || template;
      } else if (deliveryOrg.includes('gcs') || deliveryOrg.includes('advisory')) {
        template = budgetTemplates.find(t => t.category === 'GCS (Advisory)') || template;
      } else if (deliveryOrg.includes('v360') || deliveryOrg.includes('valuation')) {
        template = budgetTemplates.find(t => t.category === 'V360 (Valuation)') || template;
      } else if (deliveryOrg.includes('assurance') || deliveryOrg.includes('audit')) {
        template = budgetTemplates.find(t => t.category === 'Assurance') || template;
      }

      return {
        fieldId: 'budgetTemplateId',
        fieldName: 'Budget Template',
        value: template.id,
        displayValue: `${template.name} (${template.category})`,
        reason: project.deliveryServiceOrg
          ? `Matches your delivery organization "${project.deliveryServiceOrg}"`
          : 'A standard template for most projects',
      };
    }

    case 'demandStartDate': {
      // Suggest next Monday
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const dateStr = nextMonday.toISOString().split('T')[0];

      return {
        fieldId: 'demandStartDate',
        fieldName: 'Demand Start Date',
        value: dateStr,
        displayValue: nextMonday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        reason: 'The upcoming Monday - a typical project start date',
      };
    }

    default:
      return null;
  }
}

/**
 * Get all available suggestions for the current step
 */
export function getStepSuggestions(step: number, project: Project): FieldSuggestion[] {
  const completion = getStepCompletion(step, project);
  const suggestions: FieldSuggestion[] = [];

  for (const field of completion.fields) {
    if (!field.isComplete && field.isRequired) {
      const suggestion = getFieldSuggestion(field.fieldId, project);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
  }

  return suggestions;
}
