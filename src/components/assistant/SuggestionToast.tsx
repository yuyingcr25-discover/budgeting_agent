import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAssistantStore } from '../../store/assistantStore';

export function SuggestionToasts() {
  const { toasts, removeToast } = useAssistantStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'warning' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
          </div>
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
            {toast.action && (
              <button className="toast-action" onClick={toast.action.onClick}>
                {toast.action.label}
              </button>
            )}
          </div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
