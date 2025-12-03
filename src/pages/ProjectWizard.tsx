import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { WizardNav } from '../components/wizard/WizardNav';
import { Step1ProjectSetup } from '../components/wizard/Step1ProjectSetup';
import { Step2Budget } from '../components/wizard/Step2Budget';
import { Step3GrossMargin } from '../components/wizard/Step3GrossMargin';
import { Step4Demand } from '../components/wizard/Step4Demand';
import { Step5Review } from '../components/wizard/Step5Review';

export function ProjectWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
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
    alert('Project saved!');
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (validation.errors.filter((e) => e.severity === 'error').length > 0) {
      alert('Please fix errors before proceeding:\n' +
        validation.errors.map((e) => `• ${e.message}`).join('\n'));
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
    </div>
  );
}
