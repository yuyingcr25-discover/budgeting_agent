import { Check } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

const steps = [
  { number: 1, title: 'Project Setup', description: 'Basic project info' },
  { number: 2, title: 'Budget', description: 'Hours by role' },
  { number: 3, title: 'Gross Margin', description: 'Costs & profitability' },
  { number: 4, title: 'Demand', description: 'Resource scheduling' },
  { number: 5, title: 'Review', description: 'Validate & submit' },
];

export function WizardNav() {
  const { currentStep, setStep, validateStep } = useProjectStore();

  return (
    <div className="wizard-nav">
      {steps.map((step, index) => {
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;
        const validation = validateStep(step.number);
        const hasErrors = !validation.isValid;

        return (
          <div key={step.number} className="wizard-step-container">
            <button
              className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${hasErrors && isCompleted ? 'has-errors' : ''}`}
              onClick={() => setStep(step.number)}
            >
              <div className="step-number">
                {isCompleted ? <Check size={16} /> : step.number}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </button>
            {index < steps.length - 1 && <div className="step-connector" />}
          </div>
        );
      })}
    </div>
  );
}
