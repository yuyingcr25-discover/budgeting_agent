import { create } from 'zustand';
import type { AIMessage, FieldSuggestion, WizardContext } from '../services/ai';
import { getAIService, isAIAvailable, getWelcomeMessage } from '../services/ai';
import { industries, budgetTemplates, resourceManagers, roles } from '../data/referenceData';

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
  toasts: Toast[];
  inlineSuggestions: Record<string, FieldSuggestion>;
  lastStep: number;

  // Actions
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  sendMessage: (content: string, projectData: Record<string, unknown>, step: number) => Promise<void>;
  initializeForStep: (step: number, projectData: Record<string, unknown>) => void;
  clearMessages: () => void;

  // Suggestion actions
  setPendingAction: (action: PendingAction | null) => void;
  acceptSuggestions: (onApply: (suggestions: FieldSuggestion[]) => void) => void;
  rejectSuggestions: () => void;
  setInlineSuggestion: (fieldId: string, suggestion: FieldSuggestion | null) => void;
  clearInlineSuggestions: () => void;

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
  toasts: [],
  inlineSuggestions: {},
  lastStep: 0,

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
    const { lastStep, messages } = get();

    // Only add welcome message if step changed
    if (step !== lastStep) {
      const welcomeMessage = getWelcomeMessage(step, projectData);

      // Keep conversation history but add new step context
      const newMessage: AIMessage = { role: 'assistant', content: welcomeMessage };

      set({
        messages: messages.length === 0 ? [newMessage] : [...messages, newMessage],
        lastStep: step,
        inlineSuggestions: {},
      });

      // Try to get proactive suggestions for this step
      const service = getAIService();
      if (service) {
        const context = buildWizardContext(step, projectData);
        service.getSuggestions(context).then((suggestions) => {
          if (suggestions.length > 0) {
            // Set inline suggestions
            const inlineSuggestions: Record<string, FieldSuggestion> = {};
            suggestions.forEach((s) => {
              inlineSuggestions[s.fieldId] = s;
            });
            set({ inlineSuggestions });
          }
        }).catch(console.error);
      }
    }
  },

  clearMessages: () => set({ messages: [], lastStep: 0 }),

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
