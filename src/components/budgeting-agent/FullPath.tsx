import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Download, Plus, Trash2 } from 'lucide-react';
import type { 
  BudgetingAgentProject, 
  ResourceLevel, 
  ResourceAllocation, 
  WeeklyAllocation,
} from '../../types/budgeting-agent';
import { useAIAssistant } from '../../hooks/useAIAssistant';

interface FullPathProps {
  project: BudgetingAgentProject;
  onUpdate: (project: BudgetingAgentProject) => void;
  onBack: () => void;
}

const RESOURCE_LEVELS: ResourceLevel[] = [
  'Partner',
  'Senior Manager',
  'Manager',
  'Senior',
  'Staff',
  'Associate',
];

export default function FullPath({ project, onUpdate, onBack }: FullPathProps) {
  const [projectName, setProjectName] = useState(project.name || '');
  const [engagementLength, setEngagementLength] = useState(project.engagementLength || 8);
  const [startDate, setStartDate] = useState('');
  const [resources, setResources] = useState<ResourceAllocation[]>(
    project.resourcesByLevel || []
  );
  const [weeklyAllocations, setWeeklyAllocations] = useState<WeeklyAllocation[]>(
    project.weeklyAllocations || []
  );
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isLoading } = useAIAssistant();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addResource = () => {
    setResources([
      ...resources,
      {
        level: 'Staff',
        count: 1,
        hoursPerWeek: 40,
        totalHours: 40 * engagementLength,
      },
    ]);
  };

  const updateResource = (index: number, field: keyof ResourceAllocation, value: any) => {
    const updated = [...resources];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    // Recalculate total hours
    if (field === 'hoursPerWeek' || field === 'count') {
      updated[index].totalHours = updated[index].hoursPerWeek * updated[index].count * engagementLength;
    }
    
    setResources(updated);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const generateWeeklyAllocations = () => {
    if (!startDate) {
      alert('Please set a start date first');
      return;
    }

    const allocations: WeeklyAllocation[] = [];
    const start = new Date(startDate);

    for (let week = 0; week < engagementLength; week++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (week * 7));

      allocations.push({
        weekNumber: week + 1,
        weekStartDate: weekStart.toISOString().split('T')[0],
        allocations: resources.map(r => ({
          level: r.level,
          hours: r.hoursPerWeek * r.count,
        })),
      });
    }

    setWeeklyAllocations(allocations);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const context = {
      projectName,
      engagementLength,
      currentResources: resources,
      weeklyAllocations,
    };

    await sendMessage(chatInput, context);
    setChatInput('');
  };

  const applySuggestion = (suggestion: any) => {
    if (suggestion.field === 'resources') {
      setResources(suggestion.value);
    } else if (suggestion.field === 'weeklyAllocations') {
      setWeeklyAllocations(suggestion.value);
    }
  };

  const generateOutput = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_Budget.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (): string => {
    const headers = ['Week', 'Week Start Date', 'Resource Level', 'Hours'];
    const rows: string[][] = [headers];

    weeklyAllocations.forEach(week => {
      week.allocations.forEach(allocation => {
        rows.push([
          `Week ${week.weekNumber}`,
          week.weekStartDate,
          allocation.level,
          allocation.hours.toString(),
        ]);
      });
    });

    return rows.map(row => row.join(',')).join('\n');
  };

  const totalHours = resources.reduce((sum, r) => sum + r.totalHours, 0);
  const totalWeeklyHours = resources.reduce((sum, r) => sum + (r.hoursPerWeek * r.count), 0);

  return (
    <div className="full-path-container">
      <div className="full-path-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Full Path Budget</h1>
        <p>AI-assisted budget planning for complex engagements</p>
      </div>

      <div className="full-path-content">
        <div className="budget-form-section">
          <div className="form-section">
            <h2>Project Details</h2>
            
            <div className="form-group">
              <label htmlFor="projectName">Project Name *</label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                placeholder="Enter project name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="engagementLength">Engagement Length (weeks) *</label>
              <input
                type="number"
                id="engagementLength"
                min="5"
                value={engagementLength}
                onChange={(e) => setEngagementLength(Number(e.target.value))}
                required
              />
              <small>Minimum 5 weeks for full path</small>
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2>Resources by Level</h2>
              <button type="button" onClick={addResource} className="add-button">
                <Plus size={16} />
                Add Resource
              </button>
            </div>

            <div className="resources-list">
              {resources.map((resource, index) => (
                <div key={index} className="resource-item">
                  <select
                    value={resource.level}
                    onChange={(e) => updateResource(index, 'level', e.target.value)}
                    className="resource-level"
                  >
                    {RESOURCE_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>

                  <div className="resource-input">
                    <label>Count</label>
                    <input
                      type="number"
                      min="1"
                      value={resource.count}
                      onChange={(e) => updateResource(index, 'count', Number(e.target.value))}
                    />
                  </div>

                  <div className="resource-input">
                    <label>Hours/Week</label>
                    <input
                      type="number"
                      min="1"
                      value={resource.hoursPerWeek}
                      onChange={(e) => updateResource(index, 'hoursPerWeek', Number(e.target.value))}
                    />
                  </div>

                  <div className="resource-total">
                    <span className="total-label">Total:</span>
                    <span className="total-value">{resource.totalHours} hrs</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    className="remove-button"
                    title="Remove resource"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {resources.length === 0 && (
                <div className="empty-state">
                  <p>No resources added yet. Click "Add Resource" to get started.</p>
                </div>
              )}
            </div>

            <div className="resource-summary">
              <div className="summary-item">
                <span>Total Weekly Hours:</span>
                <strong>{totalWeeklyHours}</strong>
              </div>
              <div className="summary-item">
                <span>Total Project Hours:</span>
                <strong>{totalHours}</strong>
              </div>
            </div>
          </div>

          {resources.length > 0 && startDate && (
            <div className="form-section">
              <div className="section-header">
                <h2>Weekly Allocations</h2>
                <button type="button" onClick={generateWeeklyAllocations} className="generate-button">
                  Generate Weekly Plan
                </button>
              </div>

              {weeklyAllocations.length > 0 && (
                <div className="weekly-allocations">
                  <div className="allocations-table">
                    <div className="table-header">
                      <span>Week</span>
                      <span>Start Date</span>
                      <span>Resource Level</span>
                      <span>Hours</span>
                    </div>
                    {weeklyAllocations.map(week => (
                      <div key={week.weekNumber} className="week-group">
                        {week.allocations.map((alloc, idx) => (
                          <div key={idx} className="table-row">
                            {idx === 0 && (
                              <>
                                <span>{week.weekNumber}</span>
                                <span>{week.weekStartDate}</span>
                              </>
                            )}
                            {idx > 0 && (
                              <>
                                <span></span>
                                <span></span>
                              </>
                            )}
                            <span>{alloc.level}</span>
                            <span>{alloc.hours}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            {weeklyAllocations.length > 0 && (
              <button type="button" onClick={generateOutput} className="submit-button">
                <Download size={20} />
                Generate Budget File
              </button>
            )}
          </div>
        </div>

        <div className={`chat-assistant ${showChat ? 'expanded' : 'collapsed'}`}>
          <div className="chat-header" onClick={() => setShowChat(!showChat)}>
            <Sparkles size={20} />
            <h3>AI Assistant</h3>
          </div>

          {showChat && (
            <>
              <div className="chat-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`chat-message ${msg.role}`}>
                    <div className="message-content">{msg.content}</div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="message-suggestions">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => applySuggestion(suggestion)}
                            className="suggestion-button"
                          >
                            Apply: {suggestion.reason}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="message-timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="chat-empty-state">
                    <p>👋 Hi! I'm your AI assistant. Ask me anything about budget planning:</p>
                    <ul>
                      <li>"How many resources do I need?"</li>
                      <li>"What's a typical allocation for a {engagementLength}-week project?"</li>
                      <li>"Help me distribute hours evenly"</li>
                    </ul>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="chat-input-form">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask the AI assistant..."
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !chatInput.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
