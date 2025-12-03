import Anthropic from '@anthropic-ai/sdk';
import type { AIService, AIMessage, AIResponse, WizardContext, FieldSuggestion } from './types';
import { getSystemPrompt, getSuggestionPrompt } from './prompts';

export class AnthropicService implements AIService {
  private client: Anthropic | null = null;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-haiku-20241022') {
    if (apiKey) {
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true, // For demo/prototype only - use backend proxy in production
      });
    }
    this.model = model;
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(messages: AIMessage[], context: WizardContext): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const systemPrompt = getSystemPrompt(context);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find(c => c.type === 'text');
    const messageText = textContent?.type === 'text' ? textContent.text : '';

    // Parse suggestions from response if present
    const suggestions = this.parseSuggestions(messageText);

    return {
      message: this.cleanMessageText(messageText),
      suggestions,
    };
  }

  async getSuggestions(context: WizardContext): Promise<FieldSuggestion[]> {
    if (!this.client) {
      return [];
    }

    const prompt = getSuggestionPrompt(context);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const messageText = textContent?.type === 'text' ? textContent.text : '';

    return this.parseSuggestionsFromJSON(messageText);
  }

  private parseSuggestions(text: string): FieldSuggestion[] | undefined {
    // Look for JSON block with suggestions
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.suggestions && Array.isArray(data.suggestions)) {
          return data.suggestions;
        }
      } catch {
        // Not valid JSON, ignore
      }
    }
    return undefined;
  }

  private parseSuggestionsFromJSON(text: string): FieldSuggestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Try parsing the whole response as JSON
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data;
      }
      if (data.suggestions) {
        return data.suggestions;
      }
    } catch {
      // Not valid JSON
    }
    return [];
  }

  private cleanMessageText(text: string): string {
    // Remove JSON blocks from the message for display
    return text.replace(/```json[\s\S]*?```/g, '').trim();
  }
}
