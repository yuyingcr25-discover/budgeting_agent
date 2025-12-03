import { AnthropicService } from './anthropic';
import type { AIService } from './types';

export type { AIService, AIMessage, AIResponse, WizardContext, FieldSuggestion } from './types';
export { getWelcomeMessage } from './prompts';
export { getStepCompletion, getNextActionPrompt, hasFieldChanged, getFieldSuggestion, getStepSuggestions } from './completionTracker';
export type { FieldStatus, StepCompletionStatus, FieldSuggestion as TrackerFieldSuggestion } from './completionTracker';

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService | null {
  if (aiServiceInstance) {
    return aiServiceInstance;
  }

  const provider = import.meta.env.VITE_AI_PROVIDER || 'anthropic';
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

  if (!apiKey) {
    console.warn('AI service not configured: VITE_ANTHROPIC_API_KEY not set');
    return null;
  }

  if (provider === 'anthropic') {
    aiServiceInstance = new AnthropicService(apiKey);
  }

  return aiServiceInstance;
}

export function isAIAvailable(): boolean {
  const service = getAIService();
  return service?.isAvailable() ?? false;
}
