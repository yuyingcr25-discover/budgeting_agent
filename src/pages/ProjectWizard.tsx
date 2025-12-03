import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { WizardNav } from '../components/wizard/WizardNav';
import { Step1ProjectSetup } from '../components/wizard/Step1ProjectSetup';
import { Step2Budget } from '../components/wizard/Step2Budget';
import { Step3GrossMargin } from '../components/wizard/Step3GrossMargin';
import { Step4Demand } from '../components/wizard/Step4Demand';
import { Step5Review } from '../components/wizard/Step5Review';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { AlertModal } from '../components/ui/Modal';

export function ProjectWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; errors: string[] }>({
    isOpen: false,
    errors: [],
  });

  const {
    currentProject,
    currentStep,
    nextStep,
    prevStep,
    saveProject,
    loadProject,
    validateStep,
  } = useProjectStore();

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  const handleSave = () => {
    saveProject();
    toast.success('Project saved successfully!');
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    const errors = validation.errors.filter((e) => e.severity === 'error');
    if (errors.length > 0) {
      setErrorModal({
        isOpen: true,
        errors: errors.map((e) => e.message),
      });
      return;
    }
    nextStep();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ProjectSetup />;
      case 2:
        return <Step2Budget />;
      case 3:
        return <Step3GrossMargin />;
      case 4:
        return <Step4Demand />;
      case 5:
        return <Step5Review />;
      default:
        return <Step1ProjectSetup />;
    }
  };

  return (
    <div className="project-wizard">
      <div className="wizard-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <div className="project-title">
          <h1>{currentProject.clientName || 'New Project'}</h1>
          <span className="project-id">
            {currentProject.sapProjectId || 'No Project #'}
          </span>
        </div>
        <button className="btn btn-secondary" onClick={handleSave}>
          <Save size={18} />
          Save Draft
        </button>
      </div>

      <WizardNav />

      <div className="wizard-content">{renderStep()}</div>

      <div className="wizard-footer">
        <button
          className="btn btn-secondary"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft size={18} />
          Previous
        </button>

        <div className="step-indicator">
          Step {currentStep} of 5
        </div>

        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={currentStep === 5}
        >
          Next
          <ArrowRight size={18} />
        </button>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <AlertModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, errors: [] })}
        title="Please Fix Errors"
        variant="error"
        message={
          <ul>
            {errorModal.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        }
      />
    </div>
  );
}
