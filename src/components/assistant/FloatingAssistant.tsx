import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, XIcon, Play, ChevronRight } from 'lucide-react';
import { useAssistantStore } from '../../store/assistantStore';
import { useProjectStore } from '../../store/projectStore';
import { useFieldGuide, step1Fields, step4Fields } from './FieldGuide';
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
    isGuideActive,
    currentGuideField,
    toggleOpen,
    setOpen,
    sendMessage,
    initializeForStep,
    rejectSuggestions,
    setGuideActive,
    isAvailable,
  } = useAssistantStore();

  const { currentProject, currentStep, setCurrentProject } = useProjectStore();

  // Get the right fields for current step
  const guideFields = currentStep === 1 ? step1Fields : currentStep === 4 ? step4Fields : [];

  // Field guide hook
  const { startGuide, stopGuide, highlightField, isComplete } = useFieldGuide({
    fields: guideFields,
    enabled: isGuideActive && guideFields.length > 0,
  });

  // Initialize assistant when step changes
  useEffect(() => {
    if (isAvailable()) {
      initializeForStep(currentStep, currentProject as unknown as Record<string, unknown>);
    }
  }, [currentStep, initializeForStep, isAvailable, currentProject]);

  // Start guide automatically when entering a step with fields
  useEffect(() => {
    if (isGuideActive && guideFields.length > 0 && !isComplete) {
      // Small delay to let the DOM render
      const timer = setTimeout(startGuide, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isGuideActive, guideFields.length, isComplete, startGuide]);

  // Auto-open panel when guide is active and there's a pending action
  useEffect(() => {
    if (isGuideActive && pendingAction && !isOpen) {
      setOpen(true);
    }
  }, [isGuideActive, pendingAction, isOpen, setOpen]);

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

  // Get current field info for display
  const currentFieldInfo = currentGuideField
    ? guideFields.find(f => f.id === currentGuideField)
    : null;

  // Apply a single suggestion and highlight the field
  const handleApplySuggestion = useCallback((suggestion: FieldSuggestion) => {
    // Apply the value to the project
    const updates: Record<string, unknown> = {};
    updates[suggestion.fieldId] = suggestion.value;
    setCurrentProject(updates);

    // Find current field index by looking at fieldKey matching
    const currentFieldIndex = guideFields.findIndex(f => f.fieldKey === suggestion.fieldId);

    // Advance to next field after a short delay
    if (currentFieldIndex >= 0 && currentFieldIndex < guideFields.length - 1) {
      setTimeout(() => highlightField(currentFieldIndex + 1), 300);
    } else {
      // We're at the end, just trigger advancement
      setTimeout(startGuide, 300);
    }
  }, [setCurrentProject, guideFields, highlightField, startGuide]);

  const handleStartGuide = () => {
    setGuideActive(true);
    startGuide();
  };

  const handleStopGuide = () => {
    setGuideActive(false);
    stopGuide();
  };

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

            {/* Pending action card - synced with spotlight */}
            {pendingAction && (
              <div className="suggestion-card">
                <div className="suggestion-header">
                  <Sparkles size={14} />
                  <span>
                    {currentFieldInfo
                      ? `Select ${currentFieldInfo.title}`
                      : 'Suggestions'}
                  </span>
                </div>
                {currentFieldInfo && (
                  <div className="suggestion-context">
                    {currentFieldInfo.description}
                  </div>
                )}
                <div className="suggestion-list">
                  {pendingAction.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      className="suggestion-item clickable"
                      onClick={() => handleApplySuggestion(s)}
                      title="Click to apply this suggestion"
                    >
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
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Guide controls */}
            {guideFields.length > 0 && !isComplete && (
              <div className="guide-controls">
                {isGuideActive ? (
                  <button className="btn btn-ghost btn-small" onClick={handleStopGuide}>
                    <X size={14} />
                    Stop Guide
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-small" onClick={handleStartGuide}>
                    <Play size={14} />
                    Start Guided Tour
                  </button>
                )}
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
