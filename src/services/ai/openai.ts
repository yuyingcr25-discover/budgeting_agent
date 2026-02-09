import OpenAI from 'openai';
import type { AIService, AIMessage, AIResponse, WizardContext, FieldSuggestion } from './types';
import { getSystemPrompt, getSuggestionPrompt } from './prompts';

export class OpenAIService implements AIService {
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    if (apiKey) {
      this.client = new OpenAI({
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

    // Use custom system prompt if provided, otherwise use default
    const systemPrompt = (context as any).systemPromptOverride || getSystemPrompt(context);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const messageText = response.choices[0]?.message?.content || '';

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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const messageText = response.choices[0]?.message?.content || '';

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
      if (data.suggestions && Array.isArray(data.suggestions)) {
        return data.suggestions;
      }
    } catch {
      // Not valid JSON
    }
    return [];
  }

  private cleanMessageText(text: string): string {
    // Remove JSON blocks from the message text
    return text.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
  }
}
