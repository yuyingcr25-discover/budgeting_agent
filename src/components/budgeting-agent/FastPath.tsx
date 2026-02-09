import { useState, useMemo } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import type { BudgetingAgentProject, ResourceLevel, FastPathFormData } from '../../types/budgeting-agent';
import { roles } from '../../data/referenceData';

interface FastPathProps {
  project: BudgetingAgentProject;
  onUpdate: (project: BudgetingAgentProject) => void;
  onBack: () => void;
}

const RESOURCE_LEVELS: ResourceLevel[] = [
  'Partner',
  'Senior Manager',
  'Manager',
  'Senior',
  'Staff',
  'Associate',
];

// Map resource levels to role data
const getRoleData = (level: ResourceLevel) => {
  const roleMap: Record<ResourceLevel, string> = {
    'Partner': 'Partner',
    'Senior Manager': 'Senior Manager',
    'Manager': 'Manager',
    'Senior': 'Senior',
    'Staff': 'Staff',
    'Associate': 'Staff', // Use Staff rates for Associate
  };
  return roles.find(r => r.name === roleMap[level]);
};

export default function FastPath({ project, onUpdate, onBack }: FastPathProps) {
  const [formData, setFormData] = useState<FastPathFormData>({
    projectName: project.name || '',
    engagementLength: project.engagementLength || 1,
    needsResourceAssignment: project.needsResourceAssignment ?? false,
    resourceLevel: project.resourceLevel || 'Staff',
    totalHours: project.totalHours || 40,
  });

  // Calculate gross margin metrics
  const metrics = useMemo(() => {
    const roleData = getRoleData(formData.resourceLevel);
    if (!roleData) return null;

    const revenue = formData.totalHours * roleData.standardRate;
    const cost = formData.totalHours * roleData.laborCost;
    const grossMargin = revenue - cost;
    const grossMarginPercent = (grossMargin / revenue) * 100;

    return {
      revenue,
      cost,
      grossMargin,
      grossMarginPercent,
      standardRate: roleData.standardRate,
      laborCost: roleData.laborCost,
    };
  }, [formData.resourceLevel, formData.totalHours]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedProject: BudgetingAgentProject = {
      ...project,
      name: formData.projectName,
      engagementLength: formData.engagementLength,
      needsResourceAssignment: formData.needsResourceAssignment,
      resourceLevel: formData.resourceLevel,
      totalHours: formData.totalHours,
    };
    
    onUpdate(updatedProject);
    generateOutput(updatedProject);
    
    // Also generate RM CSV if resource assignment is needed
    if (formData.needsResourceAssignment) {
      generateRMOutput(updatedProject);
    }
  };

  const generateOutput = (proj: BudgetingAgentProject) => {
    // Calculate even distribution of hours
    const weeksInEngagement = proj.engagementLength;
    const hoursPerWeek = (proj.totalHours || 0) / weeksInEngagement;
    
    // Generate CSV output
    const csvContent = generateCSV(proj, hoursPerWeek);
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.name.replace(/\s+/g, '_')}_Budget.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (proj: BudgetingAgentProject, hoursPerWeek: number): string => {
    const roleData = getRoleData(proj.resourceLevel!);
    const headers = ['Project Name', 'Week', 'Resource Level', 'Hours', 'Standard Rate', 'Labor Cost', 'Revenue', 'Cost', 'Gross Margin'];
    const rows: string[][] = [headers];
    
    const weeklyRevenue = hoursPerWeek * (roleData?.standardRate || 0);
    const weeklyCost = hoursPerWeek * (roleData?.laborCost || 0);
    const weeklyGM = weeklyRevenue - weeklyCost;
    
    for (let week = 1; week <= proj.engagementLength; week++) {
      rows.push([
        proj.name,
        `Week ${week}`,
        proj.resourceLevel || 'Unassigned',
        hoursPerWeek.toFixed(2),
        (roleData?.standardRate || 0).toFixed(2),
        (roleData?.laborCost || 0).toFixed(2),
        weeklyRevenue.toFixed(2),
        weeklyCost.toFixed(2),
        weeklyGM.toFixed(2),
      ]);
    }
    
    // Add summary row
    const totalRevenue = metrics?.revenue || 0;
    const totalCost = metrics?.cost || 0;
    const totalGM = metrics?.grossMargin || 0;
    
    rows.push([
      '',
      'TOTAL',
      '',
      proj.totalHours?.toFixed(2) || '0',
      '',
      '',
      totalRevenue.toFixed(2),
      totalCost.toFixed(2),
      totalGM.toFixed(2),
    ]);
    
    return rows.map(row => row.join(',')).join('\n');
  };

  const generateRMOutput = (proj: BudgetingAgentProject) => {
    const hoursPerWeek = (proj.totalHours || 0) / proj.engagementLength;
    const headers = ['Project Name', 'Week', 'Resource Level', 'Hours', 'Assignment Status'];
    const rows: string[][] = [headers];
    
    for (let week = 1; week <= proj.engagementLength; week++) {
      rows.push([
        proj.name,
        `Week ${week}`,
        proj.resourceLevel || 'Unassigned',
        hoursPerWeek.toFixed(2),
        'Needs Assignment',
      ]);
    }
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.name.replace(/\s+/g, '_')}_RM_Assignment.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fast-path-container">
      <div className="fast-path-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Fast Path Budget</h1>
        <p>Quick project setup for engagements under 1 month</p>
      </div>

      <form onSubmit={handleSubmit} className="fast-path-form">
        <div className="form-section">
          <h2>Project Details</h2>
          
          <div className="form-group">
            <label htmlFor="projectName">Project Name *</label>
            <input
              type="text"
              id="projectName"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              required
              placeholder="Enter project name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="engagementLength">Engagement Length (weeks) *</label>
            <input
              type="number"
              id="engagementLength"
              min="1"
              max="4"
              value={formData.engagementLength}
              onChange={(e) => setFormData({ ...formData, engagementLength: Number(e.target.value) })}
              required
            />
            <small>Maximum 4 weeks for fast path</small>
          </div>

          <div className="form-group">
            <label htmlFor="totalHours">Total Hours *</label>
            <input
              type="number"
              id="totalHours"
              min="1"
              value={formData.totalHours}
              onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="resourceLevel">Resource Level *</label>
            <select
              id="resourceLevel"
              value={formData.resourceLevel}
              onChange={(e) => setFormData({ ...formData, resourceLevel: e.target.value as ResourceLevel })}
              required
            >
              {RESOURCE_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <small>Required for gross margin calculations</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Resource Manager Assignment</h2>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.needsResourceAssignment}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  needsResourceAssignment: e.target.checked,
                })}
              />
              <span>Generate RM assignment file</span>
            </label>
            <small>Check this to generate a separate CSV for the Resource Manager team</small>
          </div>
        </div>

        {metrics && (
          <div className="form-section">
            <h2>Gross Margin Analysis</h2>
            <div className="gross-margin-display">
              <div className="gm-row">
                <span className="gm-label">Standard Rate:</span>
                <span className="gm-value">${metrics.standardRate}/hr</span>
              </div>
              <div className="gm-row">
                <span className="gm-label">Labor Cost:</span>
                <span className="gm-value">${metrics.laborCost}/hr</span>
              </div>
              <div className="gm-row gm-divider">
                <span className="gm-label">Total Revenue:</span>
                <span className="gm-value">${metrics.revenue.toLocaleString()}</span>
              </div>
              <div className="gm-row">
                <span className="gm-label">Total Cost:</span>
                <span className="gm-value">${metrics.cost.toLocaleString()}</span>
              </div>
              <div className="gm-row gm-total">
                <span className="gm-label">Gross Margin:</span>
                <span className="gm-value">
                  ${metrics.grossMargin.toLocaleString()} ({metrics.grossMarginPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="form-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Hours:</span>
              <span className="summary-value">{formData.totalHours}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Hours per Week:</span>
              <span className="summary-value">
                {((formData.totalHours || 0) / formData.engagementLength).toFixed(2)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Resource Level:</span>
              <span className="summary-value">{formData.resourceLevel}</span>
            </div>
            {metrics && (
              <div className="summary-item">
                <span className="summary-label">Gross Margin:</span>
                <span className="summary-value" style={{ color: metrics.grossMarginPercent > 50 ? '#10b981' : '#f59e0b' }}>
                  {metrics.grossMarginPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            <Download size={20} />
            Generate Budget File
          </button>
        </div>
      </form>
    </div>
  );
}
