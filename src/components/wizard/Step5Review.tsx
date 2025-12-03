import { useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Download, Send } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import {
  getTemplateById,
  getIndustryById,
  GROSS_MARGIN_TARGET,
} from '../../data/referenceData';
import { AlertModal } from '../ui/Modal';
import { ToastContainer, useToast } from '../ui/Toast';

export function Step5Review() {
  const toast = useToast();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    currentProject,
    setCurrentProject,
    validateProject,
    getBudgetMetrics,
    getGrossMarginMetrics,
    getDemandMetrics,
  } = useProjectStore();

  const validation = validateProject();
  const budgetMetrics = getBudgetMetrics();
  const gmMetrics = getGrossMarginMetrics();
  const demandMetrics = getDemandMetrics();
  const template = getTemplateById(currentProject.budgetTemplateId);
  const industry = getIndustryById(currentProject.industryId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const criticalErrors = validation.errors.filter((e) => e.severity === 'error');
  const warnings = validation.errors.filter((e) => e.severity === 'warning');

  const handleExportBudget = () => {
    // Generate CSV for SAP Budget Upload
    const headers = ['ProjectID', 'WorkPackageID', 'ResourceType', 'ActivityType/Role', 'WorkItem', 'Hours', 'Amount'];
    const rows = currentProject.budgetLines.map((line) => [
      currentProject.sapProjectId,
      line.workPackageId,
      '0ACT',
      line.roleId,
      line.workItemId || '',
      line.hours.toString(),
      (line.hours * 580).toString(), // Simplified calculation
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_upload_${currentProject.sapProjectId}.csv`;
    a.click();
  };

  const handleExportDemand = () => {
    // Generate CSV for ProFinda Demand Upload
    const headers = ['ProjectID', 'RequestType', 'Email', 'EmployeeID', 'Role', 'Location', ...Array.from({ length: 12 }, (_, i) => `Week${i + 1}`)];
    const rows = currentProject.resourceDemands.map((demand) => [
      currentProject.sapProjectId,
      demand.requestType,
      demand.employeeEmail || '',
      demand.employeeId || '',
      demand.roleId,
      demand.locationId,
      ...Array.from({ length: 12 }, (_, i) => (demand.weeklyHours[i + 1] || 0).toString()),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demand_upload_${currentProject.sapProjectId}.csv`;
    a.click();
  };

  const handleSubmit = () => {
    if (criticalErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }
    setCurrentProject({ status: 'Submitted' });
    setShowSuccessModal(true);
  };

  return (
    <div className="step-content step-review">
      <div className="step-header">
        <h2>Review & Submit</h2>
        <p>Validate your project setup and submit for approval</p>
      </div>

      {/* Validation Summary */}
      <div className={`validation-summary ${validation.isValid ? 'valid' : 'invalid'}`}>
        <div className="validation-header">
          {validation.isValid ? (
            <>
              <CheckCircle size={24} />
              <span>All validations passed</span>
            </>
          ) : (
            <>
              <AlertCircle size={24} />
              <span>
                {criticalErrors.length} error(s), {warnings.length} warning(s)
              </span>
            </>
          )}
        </div>

        {validation.errors.length > 0 && (
          <div className="validation-list">
            {criticalErrors.map((error, i) => (
              <div key={i} className="validation-item error">
                <AlertCircle size={16} />
                <span>{error.message}</span>
              </div>
            ))}
            {warnings.map((warning, i) => (
              <div key={i} className="validation-item warning">
                <AlertTriangle size={16} />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Summary */}
      <div className="review-grid">
        <div className="review-section">
          <h3>Project Information</h3>
          <div className="review-items">
            <div className="review-item">
              <span className="label">Project #</span>
              <span className="value">{currentProject.sapProjectId || '—'}</span>
            </div>
            <div className="review-item">
              <span className="label">Client</span>
              <span className="value">{currentProject.clientName || '—'}</span>
            </div>
            <div className="review-item">
              <span className="label">Year End</span>
              <span className="value">{currentProject.yearEnd || '—'}</span>
            </div>
            <div className="review-item">
              <span className="label">Industry</span>
              <span className="value">{industry?.name || '—'}</span>
            </div>
            <div className="review-item">
              <span className="label">Template</span>
              <span className="value">{template?.name || '—'}</span>
            </div>
            <div className="review-item">
              <span className="label">Contract Type</span>
              <span className="value">{currentProject.contractType}</span>
            </div>
            {currentProject.contractType === 'Fixed Fee' && (
              <div className="review-item">
                <span className="label">Total Fee</span>
                <span className="value">{formatCurrency(currentProject.totalProjectFee)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="review-section">
          <h3>Budget Summary</h3>
          <div className="review-items">
            <div className="review-item">
              <span className="label">Total Hours</span>
              <span className="value">{budgetMetrics.totalHours.toLocaleString()}</span>
            </div>
            <div className="review-item">
              <span className="label">CohnReznick Hours</span>
              <span className="value">{budgetMetrics.totalHoursByCR.toLocaleString()}</span>
            </div>
            <div className="review-item">
              <span className="label">Subcontractor Hours</span>
              <span className="value">{budgetMetrics.totalHoursBySub.toLocaleString()}</span>
            </div>
            <div className="review-item">
              <span className="label">Est. Billings</span>
              <span className="value">{formatCurrency(budgetMetrics.estimatedBillings)}</span>
            </div>
            <div className="review-item">
              <span className="label">Labor Cost</span>
              <span className="value">{formatCurrency(budgetMetrics.laborCost)}</span>
            </div>
          </div>
        </div>

        <div className="review-section">
          <h3>Gross Margin</h3>
          <div className="review-items">
            <div className="review-item highlight">
              <span className="label">Gross Margin %</span>
              <span className={`value ${gmMetrics.meetsTarget ? 'success' : 'warning'}`}>
                {(gmMetrics.grossMarginPercent * 100).toFixed(1)}%
              </span>
            </div>
            <div className="review-item">
              <span className="label">Target</span>
              <span className="value">{(GROSS_MARGIN_TARGET * 100).toFixed(1)}%</span>
            </div>
            <div className="review-item">
              <span className="label">Total Revenue</span>
              <span className="value">{formatCurrency(gmMetrics.totalRevenue)}</span>
            </div>
            <div className="review-item">
              <span className="label">Total Cost</span>
              <span className="value">{formatCurrency(gmMetrics.totalCost)}</span>
            </div>
            <div className="review-item">
              <span className="label">Gross Margin $</span>
              <span className="value">{formatCurrency(gmMetrics.grossMargin)}</span>
            </div>
          </div>
        </div>

        <div className="review-section">
          <h3>Resource Demand</h3>
          <div className="review-items">
            <div className="review-item">
              <span className="label">Start Date</span>
              <span className="value">{currentProject.demandStartDate || '—'}</span>
            </div>
            <div className="review-item">
              <span className="label">Resources</span>
              <span className="value">{currentProject.resourceDemands.length}</span>
            </div>
            <div className="review-item">
              <span className="label">Demand Hours</span>
              <span className="value">{demandMetrics.totalDemandHours.toLocaleString()}</span>
            </div>
            <div className="review-item">
              <span className="label">Variance</span>
              <span className={`value ${demandMetrics.variance === 0 ? 'success' : 'warning'}`}>
                {demandMetrics.variance === 0 ? '✓ Balanced' : `${demandMetrics.variance} hours`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export & Submit Actions */}
      <div className="review-actions">
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={handleExportBudget}>
            <Download size={16} />
            Export SAP Budget
          </button>
          <button className="btn btn-secondary" onClick={handleExportDemand}>
            <Download size={16} />
            Export ProFinda Demand
          </button>
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={handleSubmit}
          disabled={criticalErrors.length > 0}
        >
          <Send size={18} />
          Submit for Approval
        </button>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Cannot Submit"
        variant="error"
        message="Please resolve all errors before submitting the project."
      />

      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Project Submitted"
        variant="success"
        message="Your project has been submitted for approval. You will be notified once it has been reviewed."
      />
    </div>
  );
}
