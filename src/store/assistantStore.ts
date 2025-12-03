import { create } from 'zustand';
import type { AIMessage, FieldSuggestion, WizardContext, TrackerFieldSuggestion } from '../services/ai';
import { getAIService, isAIAvailable, getWelcomeMessage, getStepCompletion, getNextActionPrompt, getFieldSuggestion, getStepSuggestions } from '../services/ai';
import { industries, budgetTemplates, resourceManagers, roles } from '../data/referenceData';
import type { Project } from '../types';

interface PendingAction {
  id: string;
  type: 'fill_fields';
  suggestions: FieldSuggestion[];
  description: string;
}

interface Toast {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type: 'info' | 'success' | 'warning';
  duration?: number;
}

interface AssistantStore {
  // State
  isOpen: boolean;
  isLoading: boolean;
  messages: AIMessage[];
  pendingAction: PendingAction | null;
  quickSuggestion: TrackerFieldSuggestion | null;
  toasts: Toast[];
  inlineSuggestions: Record<string, FieldSuggestion>;
  lastStep: number;
  hasVisitedStep: Record<number, boolean>;
  lastProjectSnapshot: Partial<Project> | null;
  lastCompletedField: string | null;
  skippedFields: Set<string>;

  // Actions
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  sendMessage: (content: string, projectData: Record<string, unknown>, step: number) => Promise<void>;
  initializeForStep: (step: number, projectData: Record<string, unknown>) => void;
  clearMessages: () => void;

  // Proactive guidance actions
  checkProjectChanges: (project: Project, step: number) => void;
  offerNextFieldSuggestion: (project: Project, step: number) => void;

  // Suggestion actions
  setPendingAction: (action: PendingAction | null) => void;
  acceptSuggestions: (onApply: (suggestions: FieldSuggestion[]) => void) => void;
  rejectSuggestions: () => void;
  setInlineSuggestion: (fieldId: string, suggestion: FieldSuggestion | null) => void;
  clearInlineSuggestions: () => void;
  acceptQuickSuggestion: (onApply: (fieldId: string, value: string) => void) => void;
  dismissQuickSuggestion: (project: Project, step: number) => void;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Utility
  isAvailable: () => boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function buildWizardContext(step: number, projectData: Record<string, unknown>): WizardContext {
  return {
    step,
    projectData,
    referenceData: {
      industries: industries.map(i => ({ id: i.id, name: i.name })),
      roles: roles.map(r => ({ id: r.id, name: r.name, standardRate: r.standardRate })),
      templates: budgetTemplates.map(t => ({ id: t.id, name: t.name, category: t.category })),
      resourceManagers: resourceManagers.map(r => ({ id: r.id, name: r.name })),
    },
  };
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  isOpen: false,
  isLoading: false,
  messages: [],
  pendingAction: null,
  quickSuggestion: null,
  toasts: [],
  inlineSuggestions: {},
  lastStep: 0,
  hasVisitedStep: {},
  lastProjectSnapshot: null,
  lastCompletedField: null,
  skippedFields: new Set<string>(),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setOpen: (open) => set({ isOpen: open }),

  sendMessage: async (content, projectData, step) => {
    const service = getAIService();
    if (!service) return;

    const userMessage: AIMessage = { role: 'user', content };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      const context = buildWizardContext(step, projectData);
      const response = await service.chat([...get().messages, userMessage], context);

      const assistantMessage: AIMessage = { role: 'assistant', content: response.message };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));

      // If there are suggestions, create a pending action
      if (response.suggestions && response.suggestions.length > 0) {
        const action: PendingAction = {
          id: generateId(),
          type: 'fill_fields',
          suggestions: response.suggestions,
          description: `Fill ${response.suggestions.length} field${response.suggestions.length > 1 ? 's' : ''}`,
        };
        set({ pendingAction: action });

        // Show toast for the suggestion
        get().addToast({
          message: `AI suggests filling ${response.suggestions.length} field${response.suggestions.length > 1 ? 's' : ''}`,
          type: 'info',
          action: {
            label: 'View',
            onClick: () => set({ isOpen: true }),
          },
        });
      }
    } catch (error) {
      console.error('AI chat error:', error);
      set((state) => ({
        messages: [
          ...state.messages,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ],
        isLoading: false,
      }));
    }
  },

  initializeForStep: (step, projectData) => {
    const { lastStep, messages, hasVisitedStep } = get();
    const isFirstVisit = !hasVisitedStep[step];
    const project = projectData as unknown as Project;

    // Only add welcome message if step changed
    if (step !== lastStep) {
      // Get completion status and build context-aware welcome
      const completion = getStepCompletion(step, project);

      let welcomeMessage = getWelcomeMessage(step, projectData);

      // Get suggestions for incomplete fields
      const suggestions = getStepSuggestions(step, project);
      const firstSuggestion = suggestions[0] || null;

      // If we have a suggestion for the next field, mention it
      if (firstSuggestion && !completion.isComplete) {
        welcomeMessage += `\n\nI'd suggest setting **${firstSuggestion.fieldName}** to "${firstSuggestion.displayValue}" (${firstSuggestion.reason}). Click "Accept" below to apply this, or fill it in yourself.`;
      } else if (!completion.isComplete) {
        const nextActionHint = getNextActionPrompt(completion);
        if (nextActionHint) {
          welcomeMessage += `\n\n${nextActionHint}`;
        }
      }

      // Keep conversation history but add new step context
      const newMessage: AIMessage = { role: 'assistant', content: welcomeMessage };

      set({
        messages: messages.length === 0 ? [newMessage] : [...messages, newMessage],
        lastStep: step,
        inlineSuggestions: {},
        hasVisitedStep: { ...hasVisitedStep, [step]: true },
        lastProjectSnapshot: { ...project },
        quickSuggestion: firstSuggestion,
        skippedFields: new Set<string>(), // Reset skipped fields for new step
        // Auto-open on first visit to help guide the user
        isOpen: isFirstVisit ? true : get().isOpen,
      });

      // Try to get proactive suggestions for this step from AI
      const service = getAIService();
      if (service) {
        const context = buildWizardContext(step, projectData);
        service.getSuggestions(context).then((aiSuggestions) => {
          if (aiSuggestions.length > 0) {
            // Set inline suggestions
            const inlineSuggestions: Record<string, FieldSuggestion> = {};
            aiSuggestions.forEach((s) => {
              inlineSuggestions[s.fieldId] = s;
            });
            set({ inlineSuggestions });
          }
        }).catch(console.error);
      }
    }
  },

  clearMessages: () => set({ messages: [], lastStep: 0 }),

  checkProjectChanges: (project, step) => {
    const { lastProjectSnapshot, isLoading, messages } = get();

    // Don't check if we're still loading or no snapshot exists
    if (isLoading || !lastProjectSnapshot) return;

    // Get completion status before and after
    const previousCompletion = getStepCompletion(step, lastProjectSnapshot as Project);
    const currentCompletion = getStepCompletion(step, project);

    // Find newly completed fields
    const newlyCompleted = currentCompletion.fields.filter((field) => {
      const prevField = previousCompletion.fields.find(f => f.fieldId === field.fieldId);
      return field.isComplete && prevField && !prevField.isComplete;
    });

    if (newlyCompleted.length > 0) {
      // Update snapshot and clear old suggestion
      set({ lastProjectSnapshot: { ...project }, lastCompletedField: newlyCompleted[0].fieldId, quickSuggestion: null });

      // Celebrate completion and prompt for next action
      const fieldNames = newlyCompleted.map(f => f.fieldName).join(', ');

      if (currentCompletion.isComplete) {
        // All fields (including optional) are complete
        const successMessage: AIMessage = {
          role: 'assistant',
          content: `${fieldNames} completed! All fields for this step are done. You can click "Next" to continue.`,
        };
        set({ messages: [...messages, successMessage] });

        get().addToast({
          message: `Step ${step} complete!`,
          type: 'success',
          duration: 3000,
        });
      } else if (currentCompletion.isRequiredComplete && !previousCompletion.isRequiredComplete) {
        // Just finished required fields, now offering optional
        const successMessage: AIMessage = {
          role: 'assistant',
          content: `${fieldNames} completed! All required fields are done. You can click "Next" to continue, or I can help with optional fields.`,
        };
        set({ messages: [...messages, successMessage] });

        get().addToast({
          message: `Required fields complete!`,
          type: 'success',
          duration: 3000,
        });

        // Offer optional field suggestions
        get().offerNextFieldSuggestion(project, step);
      } else {
        // Still have more fields to fill - offer the next suggestion
        get().offerNextFieldSuggestion(project, step);
      }
    } else {
      // Just update snapshot for comparison
      set({ lastProjectSnapshot: { ...project } });
    }
  },

  offerNextFieldSuggestion: (project, step) => {
    const { messages, skippedFields } = get();
    const completion = getStepCompletion(step, project);

    // Find all incomplete fields (excluding skipped ones), required first then optional
    const remainingFields = completion.fields.filter(
      f => !f.isComplete && !skippedFields.has(f.fieldId)
    );

    // Sort: required fields first, then optional
    remainingFields.sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return 0;
    });

    // Find the first field with a suggestion
    for (const nextField of remainingFields) {
      const isOptional = !nextField.isRequired;
      const suggestion = getFieldSuggestion(nextField.fieldId, project, isOptional);

      if (suggestion) {
        const optionalLabel = isOptional ? ' (Optional)' : '';
        const skipNote = isOptional ? ' Click "Skip" if you don\'t need this.' : '';
        const progressMessage: AIMessage = {
          role: 'assistant',
          content: `Great progress! Next, let's set **${suggestion.fieldName}**${optionalLabel}. I'd suggest "${suggestion.displayValue}" (${suggestion.reason}). Click "Accept" to apply, or choose your own value.${skipNote}`,
        };
        set({
          messages: [...messages, progressMessage],
          quickSuggestion: suggestion,
        });
        return;
      }
    }

    // No fields with suggestions available, just prompt
    const nextHint = getNextActionPrompt(completion);
    if (nextHint) {
      const progressMessage: AIMessage = {
        role: 'assistant',
        content: nextHint,
      };
      set({ messages: [...messages, progressMessage] });
    }
  },

  setPendingAction: (action) => set({ pendingAction: action }),

  acceptSuggestions: (onApply) => {
    const { pendingAction } = get();
    if (pendingAction?.type === 'fill_fields') {
      onApply(pendingAction.suggestions);
      get().addToast({
        message: 'Fields updated successfully',
        type: 'success',
        duration: 3000,
      });
    }
    set({ pendingAction: null });
  },

  rejectSuggestions: () => {
    set({ pendingAction: null });
    get().addToast({
      message: 'Suggestions dismissed',
      type: 'info',
      duration: 2000,
    });
  },

  setInlineSuggestion: (fieldId, suggestion) => {
    set((state) => {
      const newSuggestions = { ...state.inlineSuggestions };
      if (suggestion) {
        newSuggestions[fieldId] = suggestion;
      } else {
        delete newSuggestions[fieldId];
      }
      return { inlineSuggestions: newSuggestions };
    });
  },

  clearInlineSuggestions: () => set({ inlineSuggestions: {} }),

  acceptQuickSuggestion: (onApply) => {
    const { quickSuggestion, messages } = get();
    if (quickSuggestion) {
      onApply(quickSuggestion.fieldId, quickSuggestion.value);

      // Add confirmation message
      const confirmMessage: AIMessage = {
        role: 'assistant',
        content: `Done! I've set ${quickSuggestion.fieldName} to "${quickSuggestion.displayValue}".`,
      };
      set({
        messages: [...messages, confirmMessage],
        quickSuggestion: null,
      });

      get().addToast({
        message: `${quickSuggestion.fieldName} updated`,
        type: 'success',
        duration: 2000,
      });
    }
  },

  dismissQuickSuggestion: (project, step) => {
    const { messages, quickSuggestion, skippedFields } = get();
    const completion = getStepCompletion(step, project);

    // Add the current field to skipped fields
    const newSkippedFields = new Set(skippedFields);
    if (quickSuggestion?.fieldId) {
      newSkippedFields.add(quickSuggestion.fieldId);
    }

    // Find all remaining incomplete fields (excluding skipped ones)
    const remainingFields = completion.fields.filter(
      f => !f.isComplete && !newSkippedFields.has(f.fieldId)
    );

    // Iterate through remaining fields to find one with a suggestion
    for (const nextField of remainingFields) {
      const isOptional = !nextField.isRequired;
      const nextSuggestion = getFieldSuggestion(nextField.fieldId, project, isOptional);

      if (nextSuggestion) {
        const optionalLabel = isOptional ? ' (Optional)' : '';
        const dismissMessage: AIMessage = {
          role: 'assistant',
          content: `No problem! Let's move on to **${nextSuggestion.fieldName}**${optionalLabel}. I'd suggest "${nextSuggestion.displayValue}".`,
        };
        set({
          messages: [...messages, dismissMessage],
          quickSuggestion: nextSuggestion,
          skippedFields: newSkippedFields,
        });
        return;
      }
    }

    // No more fields with suggestions, check if required are done
    if (completion.isRequiredComplete) {
      const doneMessage: AIMessage = {
        role: 'assistant',
        content: "All set! Required fields are complete. You can click \"Next\" to continue.",
      };
      set({
        messages: [...messages, doneMessage],
        quickSuggestion: null,
        skippedFields: newSkippedFields,
      });
    } else {
      const dismissMessage: AIMessage = {
        role: 'assistant',
        content: "No problem! Go ahead and fill in the value yourself.",
      };
      set({
        messages: [...messages, dismissMessage],
        quickSuggestion: null,
        skippedFields: newSkippedFields,
      });
    }
  },

  addToast: (toast) => {
    const id = generateId();
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 5000);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  isAvailable: isAIAvailable,
}));
