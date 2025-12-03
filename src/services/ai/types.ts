// AI Service Types

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  message: string;
  suggestions?: FieldSuggestion[];
}

export interface FieldSuggestion {
  fieldId: string;
  fieldName: string;
  value: string | number | boolean;
  displayValue: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AIServiceConfig {
  provider: 'anthropic';
  apiKey: string;
  model?: string;
}

export interface WizardContext {
  step: number;
  projectData: Record<string, unknown>;
  referenceData: {
    industries: Array<{ id: string; name: string }>;
    roles: Array<{ id: string; name: string; standardRate: number }>;
    templates: Array<{ id: string; name: string; category: string }>;
    resourceManagers: Array<{ id: string; name: string }>;
  };
}

export interface AIService {
  chat(messages: AIMessage[], context: WizardContext): Promise<AIResponse>;
  getSuggestions(context: WizardContext): Promise<FieldSuggestion[]>;
  isAvailable(): boolean;
}
