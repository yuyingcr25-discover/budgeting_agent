import { useState } from 'react';
import type { ConversationMessage } from '../types/budgeting-agent';
import { getAIService } from '../services/ai';

export function useAIAssistant() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string, context: any) => {
    // Add user message
    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get AI service
      const aiService = getAIService();
      
      // Check if AI service is available
      if (!aiService || !aiService.isAvailable()) {
        const errorMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm currently not available. Please configure your API key in the settings to use the AI assistant.",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Prepare conversation context
      const conversationContext = {
        currentStep: 'budgeting',
        projectData: context,
      };

      // Send to AI service
      const response = await aiService.chat(
        messages.map(m => ({ role: m.role, content: m.content })).concat({
          role: 'user',
          content,
        }),
        conversationContext
      );

      // Add assistant response
      const assistantMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
}
