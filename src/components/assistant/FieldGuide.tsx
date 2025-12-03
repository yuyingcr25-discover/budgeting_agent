import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import type { Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAssistantStore } from '../../store/assistantStore';
import { useProjectStore } from '../../store/projectStore';

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

interface UseFieldGuideOptions {
  fields: GuideField[];
  enabled?: boolean;
  onFieldChange?: (fieldId: string, filled: boolean) => void;
}

export function useFieldGuide({ fields, enabled = true, onFieldChange }: UseFieldGuideOptions) {
  const driverRef = useRef<Driver | null>(null);
  const currentFieldIndexRef = useRef(0);
  const { currentProject } = useProjectStore();
  const { addToast } = useAssistantStore();

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
          }
        }, 300);
      },
    });

    driverRef.current.drive();
    currentFieldIndexRef.current = index;
  }, [fields, findNextUnfilledField]);

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
  }, []);

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
