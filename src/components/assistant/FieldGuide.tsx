import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import type { Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAssistantStore } from '../../store/assistantStore';
import { useProjectStore } from '../../store/projectStore';
import { industries, budgetTemplates, resourceManagers } from '../../data/referenceData';
import type { FieldSuggestion } from '../../services/ai';

export interface GuideField {
  id: string;
  element: string; // CSS selector
  title: string;
  description: string;
  fieldKey: string; // Key in project data to check if filled
  isRequired?: boolean;
  popoverPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// Field definitions for Step 1
export const step1Fields: GuideField[] = [
  {
    id: 'projectId',
    element: '#projectId',
    title: 'SAP Project Number',
    description: 'Enter the 13-digit SAP project number and click Lookup to load project details. Try: 0001251396026',
    fieldKey: 'sapProjectId',
    isRequired: true,
    popoverPosition: 'bottom',
  },
  {
    id: 'industry',
    element: '#industry',
    title: 'Industry',
    description: 'Select the industry for this project. This helps determine appropriate budget templates.',
    fieldKey: 'industryId',
    isRequired: true,
    popoverPosition: 'bottom',
  },
  {
    id: 'resourceManager',
    element: '#resourceManager',
    title: 'Resource Manager',
    description: 'Choose the resource manager who will oversee staffing for this project.',
    fieldKey: 'resourceManagerId',
    isRequired: false,
    popoverPosition: 'bottom',
  },
  {
    id: 'contractType',
    element: '#contractType',
    title: 'Contract Type',
    description: 'Select Time & Materials for hourly billing or Fixed Fee for a set project price.',
    fieldKey: 'contractType',
    isRequired: false,
    popoverPosition: 'bottom',
  },
  {
    id: 'budgetTemplate',
    element: '.template-list',
    title: 'Budget Template',
    description: 'Select a budget template that matches your project type. This defines the work packages available.',
    fieldKey: 'budgetTemplateId',
    isRequired: true,
    popoverPosition: 'top',
  },
];

// Field definitions for Step 4
export const step4Fields: GuideField[] = [
  {
    id: 'demandStartDate',
    element: '#demandStartDate',
    title: 'Start Date',
    description: 'Set the date when resource scheduling begins.',
    fieldKey: 'demandStartDate',
    isRequired: true,
    popoverPosition: 'bottom',
  },
];

// Generate suggestions for a specific field based on project context
export function generateFieldSuggestions(
  fieldId: string,
  projectData: Record<string, unknown>
): FieldSuggestion[] {
  const suggestions: FieldSuggestion[] = [];
  const deliveryOrg = projectData.deliveryServiceOrg as string;

  switch (fieldId) {
    case 'industry': {
      // Suggest industry based on delivery org or default to common ones
      const suggestedIndustries = deliveryOrg === 'Tax'
        ? industries.filter(i => ['Financial Services', 'Private Client Services', 'Technology'].includes(i.name))
        : deliveryOrg === 'GCS'
        ? industries.filter(i => ['Technology', 'Financial Services', 'HealthCare'].includes(i.name))
        : industries.slice(0, 3);

      suggestedIndustries.forEach(ind => {
        suggestions.push({
          fieldId: 'industryId',
          fieldName: 'Industry',
          value: ind.id,
          displayValue: ind.name,
          confidence: deliveryOrg ? 'medium' : 'low',
        });
      });
      break;
    }

    case 'resourceManager': {
      // Suggest first few resource managers
      resourceManagers.slice(0, 3).forEach(rm => {
        suggestions.push({
          fieldId: 'resourceManagerId',
          fieldName: 'Resource Manager',
          value: rm.id,
          displayValue: rm.name,
          confidence: 'low',
        });
      });
      break;
    }

    case 'budgetTemplate': {
      // Suggest template based on delivery org
      const matchingTemplates = deliveryOrg
        ? budgetTemplates.filter(t =>
            t.category.toLowerCase().includes(deliveryOrg.toLowerCase()) ||
            (deliveryOrg === 'Assurance' && t.category === 'Assurance') ||
            (deliveryOrg === 'Tax' && t.category === 'Tax') ||
            (deliveryOrg === 'GCS' && t.category === 'GCS (Advisory)') ||
            (deliveryOrg === 'V360' && t.category === 'V360 (Valuation)')
          )
        : budgetTemplates.slice(0, 3);

      (matchingTemplates.length > 0 ? matchingTemplates : budgetTemplates.slice(0, 3)).forEach(t => {
        suggestions.push({
          fieldId: 'budgetTemplateId',
          fieldName: 'Budget Template',
          value: t.id,
          displayValue: `${t.name} (${t.category})`,
          confidence: deliveryOrg ? 'high' : 'medium',
        });
      });
      break;
    }

    case 'contractType': {
      suggestions.push(
        {
          fieldId: 'contractType',
          fieldName: 'Contract Type',
          value: 'Time & Materials',
          displayValue: 'Time & Materials',
          confidence: 'medium',
        },
        {
          fieldId: 'contractType',
          fieldName: 'Contract Type',
          value: 'Fixed Fee',
          displayValue: 'Fixed Fee',
          confidence: 'medium',
        }
      );
      break;
    }

    case 'demandStartDate': {
      // Suggest next Monday
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
      const dateStr = nextMonday.toISOString().split('T')[0];

      suggestions.push({
        fieldId: 'demandStartDate',
        fieldName: 'Start Date',
        value: dateStr,
        displayValue: `Next Monday (${nextMonday.toLocaleDateString()})`,
        confidence: 'medium',
      });
      break;
    }
  }

  return suggestions;
}

interface UseFieldGuideOptions {
  fields: GuideField[];
  enabled?: boolean;
  onFieldChange?: (fieldId: string, filled: boolean) => void;
}

export function useFieldGuide({ fields, enabled = true, onFieldChange }: UseFieldGuideOptions) {
  const driverRef = useRef<Driver | null>(null);
  const currentFieldIndexRef = useRef(0);
  const { currentProject } = useProjectStore();
  const { addToast, setCurrentGuideField, setPendingAction } = useAssistantStore();

  // Check if a field is filled
  const isFieldFilled = useCallback((field: GuideField): boolean => {
    const value = currentProject[field.fieldKey as keyof typeof currentProject];
    if (value === null || value === undefined || value === '') return false;
    // Special case for contractType which always has a default
    if (field.fieldKey === 'contractType') return true;
    return true;
  }, [currentProject]);

  // Find next unfilled required field
  const findNextUnfilledField = useCallback((): number => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!isFieldFilled(field) && field.isRequired) {
        return i;
      }
    }
    // If all required are filled, find any unfilled
    for (let i = 0; i < fields.length; i++) {
      if (!isFieldFilled(fields[i])) {
        return i;
      }
    }
    return -1; // All filled
  }, [fields, isFieldFilled]);

  // Highlight a specific field
  const highlightField = useCallback((index: number) => {
    if (index < 0 || index >= fields.length) return;

    const field = fields[index];
    const element = document.querySelector(field.element);
    if (!element) return;

    if (driverRef.current) {
      driverRef.current.destroy();
    }

    // Update assistant store with current field
    setCurrentGuideField(field.id);

    // Generate and set suggestions for this field
    const suggestions = generateFieldSuggestions(field.id, currentProject as unknown as Record<string, unknown>);
    if (suggestions.length > 0) {
      setPendingAction({
        id: `guide-${field.id}`,
        type: 'fill_fields',
        suggestions,
        description: `Suggestions for ${field.title}`,
      });
    }

    driverRef.current = driver({
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      stagePadding: 8,
      stageRadius: 8,
      allowClose: true,
      disableActiveInteraction: false,
      popoverClass: 'field-guide-popover',
      steps: [
        {
          element: field.element,
          popover: {
            title: field.title,
            description: field.description,
            side: field.popoverPosition || 'bottom',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        // Check if field was filled and advance
        setTimeout(() => {
          const nextIndex = findNextUnfilledField();
          if (nextIndex !== -1 && nextIndex !== currentFieldIndexRef.current) {
            currentFieldIndexRef.current = nextIndex;
            highlightField(nextIndex);
          } else if (nextIndex === -1) {
            // All done
            setCurrentGuideField(null);
            setPendingAction(null);
          }
        }, 300);
      },
    });

    driverRef.current.drive();
    currentFieldIndexRef.current = index;
  }, [fields, findNextUnfilledField, currentProject, setCurrentGuideField, setPendingAction]);

  // Advance to next field
  const advanceToNextField = useCallback(() => {
    const nextIndex = findNextUnfilledField();
    if (nextIndex !== -1) {
      highlightField(nextIndex);
    } else {
      // All fields filled
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      addToast({
        message: 'All required fields completed!',
        type: 'success',
        duration: 3000,
      });
    }
  }, [findNextUnfilledField, highlightField, addToast]);

  // Start the guide
  const startGuide = useCallback(() => {
    if (!enabled) return;

    const firstUnfilled = findNextUnfilledField();
    if (firstUnfilled !== -1) {
      // Small delay to ensure DOM is ready
      setTimeout(() => highlightField(firstUnfilled), 500);
    }
  }, [enabled, findNextUnfilledField, highlightField]);

  // Stop the guide
  const stopGuide = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    setCurrentGuideField(null);
    setPendingAction(null);
  }, [setCurrentGuideField, setPendingAction]);

  // Watch for field changes and advance
  useEffect(() => {
    if (!enabled) return;

    const currentField = fields[currentFieldIndexRef.current];
    if (currentField && isFieldFilled(currentField)) {
      onFieldChange?.(currentField.id, true);
      // Small delay before advancing
      const timer = setTimeout(advanceToNextField, 400);
      return () => clearTimeout(timer);
    }
  }, [currentProject, enabled, fields, isFieldFilled, advanceToNextField, onFieldChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  return {
    startGuide,
    stopGuide,
    advanceToNextField,
    highlightField,
    currentFieldIndex: currentFieldIndexRef.current,
    isComplete: findNextUnfilledField() === -1,
  };
}
