import { useState } from 'react';
import type { ConversationMessage, BudgetEstimate, ResourceLevel } from '../types/budgeting-agent';
import { getAIService } from '../services/ai';
import { roles } from '../data/referenceData';

export function useBudgetingChat() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [budget, setBudget] = useState<BudgetEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const parseBudgetFromResponse = (text: string, userInput: string): BudgetEstimate | null => {
    // Try to extract structured budget data from AI response
    // For now, use pattern matching and fallback to defaults
    
    // Try to parse JSON if present
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.lineItems) {
          return data;
        }
      } catch (e) {
        // Continue with pattern matching
      }
    }

    // Pattern matching approach
    const projectNameMatch = text.match(/project\s+(?:name|called|titled)[:\s]+["']?([^"'\n]+)["']?/i) ||
                             userInput.match(/(?:for|called)\s+["']?([^"'\n]+?)["']?\s+(?:project|audit)/i);
    
    const weeksMatch = text.match(/(\d+)\s*(?:week|wk)s?/i) || userInput.match(/(\d+)\s*(?:week|wk|month)s?/i);
    const monthsMatch = text.match(/(\d+)\s*months?/i) || userInput.match(/(\d+)\s*months?/i);
    
    let engagementLength = 4; // default
    if (weeksMatch) {
      engagementLength = parseInt(weeksMatch[1]);
    } else if (monthsMatch) {
      engagementLength = parseInt(monthsMatch[1]) * 4;
    }

    // Parse resource requirements
    const lineItems = [];
    
    // Look for patterns like "2 managers", "1 partner", "3 staff members"
    const resourcePatterns = [
      /(\d+)\s+partner(?:s)?\s+(?:for|working|@)?\s*(\d+)?\s*(?:hours?)?(?:\/|\s+per\s+)?(?:week)?/gi,
      /(\d+)\s+(?:senior\s+)?manager(?:s)?\s+(?:for|working|@)?\s*(\d+)?\s*(?:hours?)?(?:\/|\s+per\s+)?(?:week)?/gi,
      /(\d+)\s+senior(?:s)?\s+(?:for|working|@)?\s*(\d+)?\s*(?:hours?)?(?:\/|\s+per\s+)?(?:week)?/gi,
      /(\d+)\s+staff(?:\s+members?)?\s+(?:for|working|@)?\s*(\d+)?\s*(?:hours?)?(?:\/|\s+per\s+)?(?:week)?/gi,
    ];

    const combinedText = userInput + ' ' + text;
    
    resourcePatterns.forEach((pattern, idx) => {
      const matches = Array.from(combinedText.matchAll(pattern));
      matches.forEach(match => {
        const count = parseInt(match[1]);
        const hoursPerWeek = match[2] ? parseInt(match[2]) : 40;
        
        let resourceLevel: ResourceLevel = 'Staff';
        if (idx === 0) resourceLevel = 'Partner';
        else if (idx === 1) resourceLevel = match[0].toLowerCase().includes('senior') ? 'Senior Manager' : 'Manager';
        else if (idx === 2) resourceLevel = 'Senior';
        else if (idx === 3) resourceLevel = 'Staff';
        
        const roleData = roles.find(r => r.name === resourceLevel);
        if (roleData) {
          const totalHours = hoursPerWeek * engagementLength * count;
          const revenue = totalHours * roleData.standardRate;
          const cost = totalHours * roleData.laborCost;
          
          lineItems.push({
            resourceLevel,
            count,
            hoursPerWeek,
            hours: totalHours,
            rate: roleData.standardRate,
            laborCost: roleData.laborCost,
            revenue,
            cost,
            grossMargin: revenue - cost,
            grossMarginPercent: ((revenue - cost) / revenue) * 100,
          });
        }
      });
    });

    // If no resources found, create a default budget
    if (lineItems.length === 0) {
      const defaultRole = roles.find(r => r.name === 'Manager');
      if (defaultRole) {
        const totalHours = 160; // 40 hours/week * 4 weeks
        const revenue = totalHours * defaultRole.standardRate;
        const cost = totalHours * defaultRole.laborCost;
        
        lineItems.push({
          resourceLevel: 'Manager',
          count: 1,
          hoursPerWeek: 40,
          hours: totalHours,
          rate: defaultRole.standardRate,
          laborCost: defaultRole.laborCost,
          revenue,
          cost,
          grossMargin: revenue - cost,
          grossMarginPercent: ((revenue - cost) / revenue) * 100,
        });
      }
    }

    const totalHours = lineItems.reduce((sum, item) => sum + item.hours, 0);
    const totalRevenue = lineItems.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = lineItems.reduce((sum, item) => sum + item.cost, 0);
    const totalGM = totalRevenue - totalCost;

    return {
      projectName: projectNameMatch ? projectNameMatch[1].trim() : 'New Project',
      engagementLength,
      lineItems,
      totalHours,
      totalRevenue,
      totalCost,
      totalGrossMargin: totalGM,
      grossMarginPercent: totalRevenue > 0 ? (totalGM / totalRevenue) * 100 : 0,
    };
  };

  const sendMessage = async (content: string) => {
    if (!hasStarted) {
      setHasStarted(true);
    }

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiService = getAIService();
      
      if (!aiService || !aiService.isAvailable()) {
        const errorMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm currently not available. Please configure your API key to use the AI assistant.",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Build context including current budget if it exists
      const systemPrompt = `You are a budget planning assistant for professional services projects. 
Help users create and adjust project budgets. When they describe a project, extract:
- Project name (if mentioned)
- Duration in weeks or months
- Resource requirements (roles like Partner, Senior Manager, Manager, Senior, Staff)
- Hours per week for each role

Provide clear, conversational responses. When creating or adjusting budgets, explain your reasoning.
Current budget: ${budget ? JSON.stringify(budget) : 'none yet'}`;

      // Use the chat method with proper context
      const response = await aiService.chat(
        [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content }
        ],
        { 
          currentStep: 'budgeting', 
          projectData: budget,
          systemPromptOverride: systemPrompt
        } as any
      );

      const assistantMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Try to extract budget from response
      const extractedBudget = parseBudgetFromResponse(response.message, content);
      if (extractedBudget) {
        setBudget(extractedBudget);
      }

    } catch (error: any) {
      console.error('Budgeting chat error:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response?.data);
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

  const updateBudget = (newBudget: BudgetEstimate) => {
    setBudget(newBudget);
  };

  return {
    messages,
    budget,
    isLoading,
    hasStarted,
    sendMessage,
    updateBudget,
  };
}
