import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Send, Sparkles, XIcon, ChevronRight, CheckCircle2, Circle, Check } from 'lucide-react';
import { useAssistantStore } from '../../store/assistantStore';
import { useProjectStore } from '../../store/projectStore';
import { getStepCompletion } from '../../services/ai';
import { resourceManagers } from '../../data/referenceData';
import type { FieldSuggestion } from '../../services/ai/types';

export function FloatingAssistant() {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    isLoading,
    messages,
    pendingAction,
    quickSuggestion,
    toggleOpen,
    sendMessage,
    initializeForStep,
    checkProjectChanges,
    rejectSuggestions,
    acceptQuickSuggestion,
    dismissQuickSuggestion,
    isAvailable,
  } = useAssistantStore();

  const { currentProject, currentStep, setCurrentProject } = useProjectStore();

  // Calculate step completion for progress display
  const stepCompletion = useMemo(() => {
    return getStepCompletion(currentStep, currentProject);
  }, [currentStep, currentProject]);

  // Initialize assistant when step changes
  useEffect(() => {
    if (isAvailable()) {
      initializeForStep(currentStep, currentProject as unknown as Record<string, unknown>);
    }
  // Only run when step changes, not on every project change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, initializeForStep, isAvailable]);

  // Watch for project changes to provide proactive guidance
  useEffect(() => {
    if (isAvailable()) {
      checkProjectChanges(currentProject, currentStep);
    }
  }, [currentProject, currentStep, checkProjectChanges, isAvailable]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage(message, currentProject as unknown as Record<string, unknown>, currentStep);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Apply a single suggestion
  const handleApplySuggestion = useCallback((suggestion: FieldSuggestion) => {
    const updates: Record<string, unknown> = {};
    updates[suggestion.fieldId] = suggestion.value;
    setCurrentProject(updates);
  }, [setCurrentProject]);

  // Accept the quick suggestion from the assistant
  const handleAcceptQuickSuggestion = useCallback(() => {
    acceptQuickSuggestion((fieldId, value) => {
      const updates: Record<string, unknown> = {};
      // Special handling for fields that need additional data
      if (fieldId === 'resourceManagerId') {
        const rm = resourceManagers.find(r => r.id === value);
        updates.resourceManagerId = value;
        updates.resourceManagerName = rm?.name || '';
      } else {
        updates[fieldId] = value;
      }
      setCurrentProject(updates);
    });
  }, [acceptQuickSuggestion, setCurrentProject]);

  // Don't render if AI is not available
  if (!isAvailable()) {
    return null;
  }

  return (
    <div className="floating-assistant">
      {/* Chat Panel */}
      {isOpen && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <div className="assistant-title">
              <Sparkles size={18} />
              <span>AI Assistant</span>
            </div>
            <button className="btn-icon" onClick={toggleOpen}>
              <X size={18} />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="assistant-progress">
            <div className="progress-label">
              Step {currentStep} Progress: {stepCompletion.completedCount}/{stepCompletion.requiredCount} required fields
            </div>
            <div className="progress-fields">
              {stepCompletion.fields.filter(f => f.isRequired).map((field) => (
                <div
                  key={field.fieldId}
                  className={`progress-field ${field.isComplete ? 'complete' : 'pending'}`}
                  title={field.fieldName}
                >
                  {field.isComplete ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Circle size={14} />
                  )}
                  <span>{field.fieldName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="assistant-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className="message-content">{msg.content}</div>
              </div>
            ))}

            {isLoading && (
              <div className="message message-assistant">
                <div className="message-avatar">
                  <Sparkles size={14} />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick suggestion action card */}
            {quickSuggestion && (
              <div className="quick-suggestion-card">
                <div className="quick-suggestion-content">
                  <div className="quick-suggestion-field">
                    <span className="field-label">{quickSuggestion.fieldName}</span>
                    <span className="field-value">{quickSuggestion.displayValue}</span>
                  </div>
                </div>
                <div className="quick-suggestion-actions">
                  <button
                    className="btn btn-primary btn-small"
                    onClick={handleAcceptQuickSuggestion}
                  >
                    <Check size={14} />
                    Accept
                  </button>
                  <button
                    className="btn btn-ghost btn-small"
                    onClick={dismissQuickSuggestion}
                  >
                    <XIcon size={14} />
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Pending action card (from AI chat) */}
            {pendingAction && (
              <div className="suggestion-card">
                <div className="suggestion-header">
                  <Sparkles size={14} />
                  <span>Suggestions</span>
                </div>
                <div className="suggestion-list">
                  {pendingAction.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      className="suggestion-item clickable"
                      onClick={() => handleApplySuggestion(s)}
                      title="Click to apply this suggestion"
                    >
                      <span className="field-name">{s.fieldName}:</span>
                      <span className="field-value">
                        {s.displayValue}
                        <ChevronRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="suggestion-actions">
                  <button className="btn btn-ghost btn-small" onClick={rejectSuggestions}>
                    <XIcon size={14} />
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="assistant-input">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
            />
            <button
              className="btn btn-primary btn-icon-only"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        className={`assistant-bubble ${isOpen ? 'open' : ''} ${pendingAction || quickSuggestion ? 'has-suggestion' : ''}`}
        onClick={toggleOpen}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
        {!isOpen && (pendingAction || quickSuggestion) && <span className="bubble-badge pulse" />}
      </button>
    </div>
  );
}
