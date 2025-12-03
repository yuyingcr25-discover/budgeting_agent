import { useAssistantStore } from '../../store/assistantStore';

interface InlineSuggestionProps {
  fieldId: string;
  currentValue: string;
  onAccept: (value: string | number | boolean) => void;
  children: React.ReactNode;
}

export function InlineSuggestion({
  fieldId,
  currentValue,
  onAccept,
  children,
}: InlineSuggestionProps) {
  const { inlineSuggestions, setInlineSuggestion } = useAssistantStore();
  const suggestion = inlineSuggestions[fieldId];

  // Only show suggestion if field is empty and we have a suggestion
  const showSuggestion = !currentValue && suggestion;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestion && e.key === 'Tab') {
      e.preventDefault();
      onAccept(suggestion.value);
      setInlineSuggestion(fieldId, null);
    }
  };

  const handleAcceptClick = () => {
    if (suggestion) {
      onAccept(suggestion.value);
      setInlineSuggestion(fieldId, null);
    }
  };

  return (
    <div className="inline-suggestion-wrapper" onKeyDown={handleKeyDown}>
      {children}
      {showSuggestion && (
        <div className="inline-suggestion-overlay">
          <span className="ghost-text">{suggestion.displayValue}</span>
          <button
            className="accept-suggestion-btn"
            onClick={handleAcceptClick}
            tabIndex={-1}
            title="Press Tab to accept"
          >
            Tab
          </button>
        </div>
      )}
    </div>
  );
}

// Hook for easy integration
export function useInlineSuggestion(fieldId: string) {
  const { inlineSuggestions, setInlineSuggestion } = useAssistantStore();
  const suggestion = inlineSuggestions[fieldId];

  const accept = (onAccept: (value: string | number | boolean) => void) => {
    if (suggestion) {
      onAccept(suggestion.value);
      setInlineSuggestion(fieldId, null);
    }
  };

  const dismiss = () => {
    setInlineSuggestion(fieldId, null);
  };

  return { suggestion, accept, dismiss };
}
