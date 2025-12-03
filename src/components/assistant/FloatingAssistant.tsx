import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, XIcon, ChevronRight } from 'lucide-react';
import { useAssistantStore } from '../../store/assistantStore';
import { useProjectStore } from '../../store/projectStore';
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
    toggleOpen,
    sendMessage,
    initializeForStep,
    rejectSuggestions,
    isAvailable,
  } = useAssistantStore();

  const { currentProject, currentStep, setCurrentProject } = useProjectStore();

  // Initialize assistant when step changes
  useEffect(() => {
    if (isAvailable()) {
      initializeForStep(currentStep, currentProject as unknown as Record<string, unknown>);
    }
  }, [currentStep, initializeForStep, isAvailable, currentProject]);

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

            {/* Pending action card */}
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
        className={`assistant-bubble ${isOpen ? 'open' : ''} ${pendingAction ? 'has-suggestion' : ''}`}
        onClick={toggleOpen}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
        {!isOpen && pendingAction && <span className="bubble-badge pulse" />}
      </button>
    </div>
  );
}
