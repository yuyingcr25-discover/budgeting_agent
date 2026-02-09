import { useState, useRef, useEffect } from 'react';
import { Send, Edit3, Download, Sparkles, Check, X } from 'lucide-react';
import { useBudgetingChat } from '../hooks/useBudgetingChat';
import type { BudgetLineItem } from '../types/budgeting-agent';
import '../components/budgeting-agent/budgeting-agent-chat.css';

export default function BudgetingAgentChat() {
  const [inputMessage, setInputMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedBudget, setEditedBudget] = useState<BudgetLineItem[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    budget, 
    isLoading, 
    sendMessage, 
    updateBudget,
    hasStarted 
  } = useBudgetingChat();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (budget) {
      setEditedBudget(budget.lineItems);
    }
  }, [budget]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      if (budget) {
        updateBudget({
          ...budget,
          lineItems: editedBudget,
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setEditedBudget(budget?.lineItems || []);
    setIsEditing(false);
  };

  const handleLineItemChange = (index: number, field: keyof BudgetLineItem, value: any) => {
    const updated = [...editedBudget];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    // Recalculate totals
    if (field === 'hours' || field === 'rate') {
      updated[index].revenue = updated[index].hours * updated[index].rate;
      updated[index].cost = updated[index].hours * updated[index].laborCost;
      updated[index].grossMargin = updated[index].revenue - updated[index].cost;
    }
    
    setEditedBudget(updated);
  };

  const handleExport = () => {
    if (!budget) return;

    const headers = [
      'Resource Level',
      'Hours',
      'Rate',
      'Labor Cost',
      'Revenue',
      'Cost',
      'Gross Margin',
      'Gross Margin %'
    ];
    
    const rows: string[][] = [headers];
    
    budget.lineItems.forEach(item => {
      rows.push([
        item.resourceLevel,
        item.hours.toString(),
        item.rate.toFixed(2),
        item.laborCost.toFixed(2),
        item.revenue.toFixed(2),
        item.cost.toFixed(2),
        item.grossMargin.toFixed(2),
        item.grossMarginPercent.toFixed(1) + '%',
      ]);
    });
    
    // Add totals
    rows.push([
      'TOTAL',
      budget.totalHours.toString(),
      '',
      '',
      budget.totalRevenue.toFixed(2),
      budget.totalCost.toFixed(2),
      budget.totalGrossMargin.toFixed(2),
      budget.grossMarginPercent.toFixed(1) + '%',
    ]);
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${budget.projectName.replace(/\s+/g, '_')}_Budget.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculateTotals = () => {
    const totalHours = editedBudget.reduce((sum, item) => sum + item.hours, 0);
    const totalRevenue = editedBudget.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = editedBudget.reduce((sum, item) => sum + item.cost, 0);
    const totalGM = totalRevenue - totalCost;
    const gmPercent = totalRevenue > 0 ? (totalGM / totalRevenue) * 100 : 0;
    
    return { totalHours, totalRevenue, totalCost, totalGM, gmPercent };
  };

  const totals = calculateTotals();

  return (
    <div className="budgeting-agent-chat">
      {!hasStarted ? (
        // Welcome Screen
        <div className="welcome-screen">
          <div className="welcome-icon">
            <Sparkles size={64} />
          </div>
          <h1>AI Budgeting Agent</h1>
          <p className="welcome-subtitle">
            Describe your project and I'll help you create a detailed budget
          </p>
          
          <div className="example-prompts">
            <p className="example-label">Try asking something like:</p>
            <div className="example-cards">
              <button 
                className="example-card"
                onClick={() => setInputMessage("I need a budget for a 3-month audit project requiring 2 managers and 3 staff members")}
              >
                "I need a budget for a 3-month audit project requiring 2 managers and 3 staff members"
              </button>
              <button 
                className="example-card"
                onClick={() => setInputMessage("Create a budget for a short 2-week engagement with one senior manager working 40 hours per week")}
              >
                "Create a budget for a short 2-week engagement with one senior manager working 40 hours per week"
              </button>
              <button 
                className="example-card"
                onClick={() => setInputMessage("I need a budget for a 6-month project: 1 partner for 10 hours/week, 1 senior manager for 20 hours/week, and 2 seniors for 40 hours/week each")}
              >
                "I need a budget for a 6-month project: 1 partner for 10 hours/week, 1 senior manager for 20 hours/week, and 2 seniors for 40 hours/week each"
              </button>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="welcome-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your project budget needs..."
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()}>
              <Send size={20} />
              {isLoading ? 'Processing...' : 'Start'}
            </button>
          </form>
        </div>
      ) : (
        // Split View: Chat + Budget
        <div className="split-view">
          {/* Left Panel - Conversation */}
          <div className="conversation-panel">
            <div className="conversation-header">
              <Sparkles size={20} />
              <h2>Conversation</h2>
            </div>

            <div className="conversation-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                  <div className="message-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message assistant loading">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="conversation-input-form">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Adjust the budget or ask questions..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !inputMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Right Panel - Budget Display */}
          <div className="budget-panel">
            <div className="budget-header">
              <div>
                <h2>{budget?.projectName || 'Budget Estimate'}</h2>
                {budget && (
                  <p className="budget-subtitle">
                    {budget.engagementLength} weeks • {budget.totalHours} hours
                  </p>
                )}
              </div>
              <div className="budget-actions">
                {isEditing ? (
                  <>
                    <button onClick={handleCancelEdit} className="btn-icon" title="Cancel">
                      <X size={18} />
                    </button>
                    <button onClick={handleEditToggle} className="btn-icon btn-primary" title="Save">
                      <Check size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleEditToggle} className="btn-icon" title="Edit">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={handleExport} className="btn-icon" title="Export CSV">
                      <Download size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {budget ? (
              <div className="budget-content">
                <div className="budget-grid">
                  <div className="grid-header">
                    <div>Resource Level</div>
                    <div>Hours</div>
                    <div>Rate</div>
                    <div>Revenue</div>
                    <div>Cost</div>
                    <div>Gross Margin</div>
                    <div>GM %</div>
                  </div>

                  {isEditing ? (
                    // Edit Mode
                    editedBudget.map((item, index) => (
                      <div key={index} className="grid-row editable">
                        <div>{item.resourceLevel}</div>
                        <div>
                          <input
                            type="number"
                            value={item.hours}
                            onChange={(e) => handleLineItemChange(index, 'hours', Number(e.target.value))}
                            min="0"
                          />
                        </div>
                        <div>${item.rate}</div>
                        <div>${item.revenue.toLocaleString()}</div>
                        <div>${item.cost.toLocaleString()}</div>
                        <div>${item.grossMargin.toLocaleString()}</div>
                        <div className={item.grossMarginPercent > 50 ? 'positive' : 'warning'}>
                          {item.grossMarginPercent.toFixed(1)}%
                        </div>
                      </div>
                    ))
                  ) : (
                    // View Mode
                    budget.lineItems.map((item, index) => (
                      <div key={index} className="grid-row">
                        <div>{item.resourceLevel}</div>
                        <div>{item.hours}</div>
                        <div>${item.rate}</div>
                        <div>${item.revenue.toLocaleString()}</div>
                        <div>${item.cost.toLocaleString()}</div>
                        <div>${item.grossMargin.toLocaleString()}</div>
                        <div className={item.grossMarginPercent > 50 ? 'positive' : 'warning'}>
                          {item.grossMarginPercent.toFixed(1)}%
                        </div>
                      </div>
                    ))
                  )}

                  <div className="grid-footer">
                    <div>TOTAL</div>
                    <div>{totals.totalHours}</div>
                    <div></div>
                    <div>${totals.totalRevenue.toLocaleString()}</div>
                    <div>${totals.totalCost.toLocaleString()}</div>
                    <div>${totals.totalGM.toLocaleString()}</div>
                    <div className={totals.gmPercent > 50 ? 'positive' : 'warning'}>
                      {totals.gmPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="budget-summary">
                  <div className="summary-card">
                    <div className="summary-label">Total Revenue</div>
                    <div className="summary-value">${totals.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Total Cost</div>
                    <div className="summary-value">${totals.totalCost.toLocaleString()}</div>
                  </div>
                  <div className="summary-card highlight">
                    <div className="summary-label">Gross Margin</div>
                    <div className="summary-value">
                      ${totals.totalGM.toLocaleString()}
                      <span className="summary-percent">{totals.gmPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="budget-empty">
                <Sparkles size={48} className="empty-icon" />
                <p>Start a conversation to generate a budget estimate</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
