import { useState } from 'react';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import {
  industries,
  budgetTemplates,
  templateCategories,
  resourceManagers,
  lookupSapProject,
} from '../../data/referenceData';

export function Step1ProjectSetup() {
  const { currentProject, setCurrentProject } = useProjectStore();
  const [projectSearch, setProjectSearch] = useState(currentProject.sapProjectId);
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(
    currentProject.sapProjectId ? 'found' : null
  );

  const handleProjectLookup = () => {
    const result = lookupSapProject(projectSearch);
    if (result) {
      setCurrentProject({
        sapProjectId: result.projectId,
        clientId: result.clientId,
        clientName: result.clientName,
        yearEnd: result.yearEnd,
        deliveryServiceOrg: result.deliveryOrg,
      });
      setSearchResult('found');
    } else {
      setSearchResult('not-found');
    }
  };

  const selectedTemplate = budgetTemplates.find(t => t.id === currentProject.budgetTemplateId);

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Project Setup</h2>
        <p>Enter the SAP project number and configure basic project settings</p>
      </div>

      <div className="form-section">
        <h3>Project Information</h3>

        <div className="form-group">
          <label htmlFor="projectId">Project # (SAP)</label>
          <div className="input-with-button">
            <input
              type="text"
              id="projectId"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Enter 13-digit project number"
            />
            <button onClick={handleProjectLookup} className="btn btn-secondary">
              <Search size={16} />
              Lookup
            </button>
          </div>
          {searchResult === 'found' && (
            <div className="input-feedback success">
              <CheckCircle size={14} />
              Project found
            </div>
          )}
          {searchResult === 'not-found' && (
            <div className="input-feedback error">
              <AlertCircle size={14} />
              Project not found in SAP. Try: 0001251396026, 0002491434026
            </div>
          )}
        </div>

        {currentProject.sapProjectId && (
          <div className="info-grid">
            <div className="info-item">
              <label>Client #</label>
              <span>{currentProject.clientId}</span>
            </div>
            <div className="info-item">
              <label>Client Name</label>
              <span>{currentProject.clientName}</span>
            </div>
            <div className="info-item">
              <label>Year End</label>
              <span>{currentProject.yearEnd}</span>
            </div>
            <div className="info-item">
              <label>Delivery Service Org</label>
              <span>{currentProject.deliveryServiceOrg}</span>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="industry">Industry</label>
            <select
              id="industry"
              value={currentProject.industryId}
              onChange={(e) => setCurrentProject({ industryId: e.target.value })}
            >
              <option value="">Select industry...</option>
              {industries.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="resourceManager">Resource Manager</label>
            <select
              id="resourceManager"
              value={currentProject.resourceManagerId}
              onChange={(e) => {
                const rm = resourceManagers.find(r => r.id === e.target.value);
                setCurrentProject({
                  resourceManagerId: e.target.value,
                  resourceManagerName: rm?.name || '',
                });
              }}
            >
              <option value="">Select resource manager...</option>
              {resourceManagers.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Contract Details</h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contractType">Contract Type</label>
            <select
              id="contractType"
              value={currentProject.contractType}
              onChange={(e) => setCurrentProject({
                contractType: e.target.value as 'Fixed Fee' | 'Time & Materials'
              })}
            >
              <option value="Time & Materials">Time & Materials</option>
              <option value="Fixed Fee">Fixed Fee</option>
            </select>
          </div>

          {currentProject.contractType === 'Fixed Fee' && (
            <div className="form-group">
              <label htmlFor="totalFee">Total Project Fee</label>
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  id="totalFee"
                  value={currentProject.totalProjectFee || ''}
                  onChange={(e) => setCurrentProject({
                    totalProjectFee: parseFloat(e.target.value) || 0
                  })}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="timeEntryStart">Time Entry Start Date (Optional)</label>
          <input
            type="date"
            id="timeEntryStart"
            value={currentProject.timeEntryStartDate || ''}
            onChange={(e) => setCurrentProject({
              timeEntryStartDate: e.target.value || null
            })}
          />
          <div className="input-hint">
            Use if time entry is required before the project was created in SAP
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Budget Template</h3>

        <div className="template-categories">
          {templateCategories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${
                selectedTemplate?.category === cat.name ? 'active' : ''
              }`}
              onClick={() => {
                const firstTemplate = budgetTemplates.find(t => t.category === cat.name);
                if (firstTemplate) {
                  setCurrentProject({ budgetTemplateId: firstTemplate.id });
                }
              }}
            >
              {cat.name}
              <span className="count">{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="template-list">
          {budgetTemplates
            .filter(t => !selectedTemplate || t.category === selectedTemplate.category)
            .map((template) => (
              <div
                key={template.id}
                className={`template-card ${
                  currentProject.budgetTemplateId === template.id ? 'selected' : ''
                }`}
                onClick={() => setCurrentProject({ budgetTemplateId: template.id })}
              >
                <div className="template-name">{template.name}</div>
                <div className="template-meta">
                  {template.workPackages.length} work packages
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
