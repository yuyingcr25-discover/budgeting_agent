import type { WizardContext } from './types';

export function getSystemPrompt(context: WizardContext): string {
  const basePrompt = `You are a helpful AI assistant for PSW (Project Setup Workbook), a project budgeting and resource planning application. You guide users through setting up projects step by step.

Your role is to:
1. Proactively guide users through the wizard steps
2. Suggest field values based on context and industry best practices
3. Answer questions about the fields and what values to enter
4. Be concise and helpful

Available reference data:
- Industries: ${context.referenceData.industries.map(i => i.name).join(', ')}
- Budget Templates: ${context.referenceData.templates.map(t => `${t.name} (${t.category})`).join(', ')}
- Resource Managers: ${context.referenceData.resourceManagers.map(r => r.name).join(', ')}

Current project data:
${JSON.stringify(context.projectData, null, 2)}

When you want to suggest filling fields, include a JSON block with suggestions in this format:
\`\`\`json
{
  "suggestions": [
    {
      "fieldId": "industryId",
      "fieldName": "Industry",
      "value": "6",
      "displayValue": "Financial Services",
      "confidence": "high"
    }
  ]
}
\`\`\`

Be conversational but efficient. Focus on helping the user complete their task quickly.`;

  const stepPrompts: Record<number, string> = {
    1: `\n\nYou are currently on Step 1: Project Setup.

This step involves:
- Looking up the SAP project number (13-digit ID)
- Selecting the industry
- Choosing a resource manager
- Setting the contract type (Time & Materials or Fixed Fee)
- Selecting a budget template

Guide the user to fill in these fields. If they've selected an industry, suggest an appropriate budget template. Common patterns:
- Financial Services, Technology, Healthcare → often need GCS (Advisory) templates
- Construction, Real Estate → often need Assurance templates
- Any industry can need Tax Compliance for tax work

If the project info is already populated from SAP lookup, acknowledge that and move to suggesting industry/template.`,

    2: `\n\nYou are currently on Step 2: Budget.

This step involves entering hours by work package and role. The budget grid shows:
- Work packages from the selected template
- Roles (Partner, Director, Manager, Senior, Staff, etc.)
- Hours per role per work package

You can suggest work packages that are commonly used for the selected industry. Don't estimate specific hours - that requires project-specific knowledge.`,

    3: `\n\nYou are currently on Step 3: Gross Margin.

This step shows the gross margin calculation including:
- Revenue from labor fees
- Subcontractor costs
- Expenses (billable and non-billable)
- Target gross margin is 38.5%

You can explain the components but don't make specific suggestions for this step.`,

    4: `\n\nYou are currently on Step 4: Resource Demand.

This step involves scheduling resources by week. The grid shows:
- Resource type (Named, Unnamed, Generic)
- Role selection
- Location
- Weekly hour allocations

You can suggest:
- Even distribution of budget hours across weeks
- Typical team composition based on project size
- Remind about matching demand to budget hours`,

    5: `\n\nYou are currently on Step 5: Review.

This is the final review step. Help the user understand the summary and address any validation warnings.`,
  };

  return basePrompt + (stepPrompts[context.step] || '');
}

export function getSuggestionPrompt(context: WizardContext): { system: string; user: string } {
  const system = `You are an AI that generates field suggestions for a project setup wizard.
Return ONLY a JSON array of suggestions, no other text.

Each suggestion should have:
- fieldId: the form field identifier
- fieldName: human-readable name
- value: the actual value to set
- displayValue: what to show the user
- confidence: "high", "medium", or "low"

Available reference data:
- Industries: ${JSON.stringify(context.referenceData.industries)}
- Templates: ${JSON.stringify(context.referenceData.templates)}
- Resource Managers: ${JSON.stringify(context.referenceData.resourceManagers)}`;

  let user = '';

  switch (context.step) {
    case 1:
      user = `Generate suggestions for Step 1 (Project Setup).
Current project data: ${JSON.stringify(context.projectData)}

Suggest appropriate values for any empty fields based on:
1. If deliveryServiceOrg is set, suggest matching budget template category
2. If industry is not set but we have client info, suggest likely industry
3. Suggest a resource manager if not set

Return JSON array of suggestions.`;
      break;

    case 2:
      user = `Generate work package suggestions for Step 2 (Budget).
Current project data: ${JSON.stringify(context.projectData)}

Based on the selected industry and template, suggest which work packages are most important to fill in first.
Return as suggestions with fieldId as "workPackagePriority" and value as the work package name.`;
      break;

    case 4:
      user = `Generate resource demand suggestions for Step 4.
Current project data: ${JSON.stringify(context.projectData)}

Suggest:
1. If budget hours exist, how to distribute them evenly across 12 weeks
2. Typical role mix for the project type

Return JSON array of suggestions.`;
      break;

    default:
      user = 'No suggestions needed for this step. Return empty array: []';
  }

  return { system, user };
}

export function getWelcomeMessage(step: number, projectData: Record<string, unknown>): string {
  const messages: Record<number, string> = {
    1: projectData.sapProjectId
      ? `I see you've loaded project "${projectData.clientName || 'Unknown'}". Would you like me to suggest an industry and budget template based on the delivery organization "${projectData.deliveryServiceOrg}"?`
      : "Let's set up your project! Start by entering the SAP project number to load the client information, or I can help you select an industry and template manually.",

    2: `Now let's work on the budget. I can suggest which work packages are most relevant for your ${projectData.industryId ? 'selected industry' : 'project'}.`,

    3: "Here's your gross margin summary. The target is 38.5%. Let me know if you need help understanding any of the components.",

    4: `Time to schedule resources! You have ${(projectData as Record<string, unknown>).budgetLines ? 'budget hours to allocate' : 'no budget hours yet'}. Would you like me to suggest an even distribution across the weeks?`,

    5: "Great job! Here's your project summary. Review the details and address any warnings before submitting.",
  };

  return messages[step] || "How can I help you with this step?";
}
