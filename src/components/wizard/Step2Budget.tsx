import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { roles, getTemplateById } from '../../data/referenceData';

export function Step2Budget() {
  const { currentProject, setBudgetLine, getBudgetHours, getBudgetMetrics } = useProjectStore();
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  const template = getTemplateById(currentProject.budgetTemplateId);
  const metrics = getBudgetMetrics();

  // Filter to main roles for the grid
  const displayRoles = roles.filter(r =>
    !r.name.includes('NatTax') && r.isActive
  ).slice(0, 9);

  const togglePackage = (packageId: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(packageId)) {
        next.delete(packageId);
      } else {
        next.add(packageId);
      }
      return next;
    });
  };

  const handleHoursChange = (
    workPackageId: string,
    workItemId: string | null,
    roleId: string,
    value: string
  ) => {
    const hours = parseInt(value) || 0;
    setBudgetLine(workPackageId, workItemId, roleId, hours);
  };

  const getWorkPackageTotal = (workPackageId: string) => {
    return metrics.hoursByWorkPackage[workPackageId] || 0;
  };

  const getRoleTotal = (roleId: string) => {
    return metrics.hoursByRole[roleId] || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!template) {
    return (
      <div className="step-content">
        <div className="empty-state">
          <p>Please select a budget template in Step 1</p>
        </div>
      </div>
    );
  }

  return (
    <div className="step-content step-budget">
      <div className="step-header">
        <h2>Budget: {template.name}</h2>
        <p>Enter hours by work package and role</p>
      </div>

      <div className="budget-summary-bar">
        <div className="summary-item">
          <span className="label">Total Hours</span>
          <span className="value">{metrics.totalHours.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="label">Est. Billings</span>
          <span className="value">{formatCurrency(metrics.estimatedBillings)}</span>
        </div>
        <div className="summary-item">
          <span className="label">Labor Cost</span>
          <span className="value">{formatCurrency(metrics.laborCost)}</span>
        </div>
        <div className="summary-item highlight">
          <span className="label">Gross Margin</span>
          <span className="value">
            {metrics.estimatedBillings > 0
              ? ((1 - metrics.laborCost / metrics.estimatedBillings) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>

      <div className="budget-grid-container">
        <table className="budget-grid">
          <thead>
            <tr>
              <th className="sticky-col work-package-col">Work Package / Work Item</th>
              {displayRoles.map((role) => (
                <th key={role.id} className="role-col">
                  <div className="role-header">
                    <span className="role-name">{role.name}</span>
                    <span className="role-rate">${role.standardRate}/hr</span>
                  </div>
                </th>
              ))}
              <th className="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            {template.workPackages.map((wp) => {
              const isExpanded = expandedPackages.has(wp.id);
              const hasWorkItems = wp.workItems.length > 0;
              const wpTotal = getWorkPackageTotal(wp.id);

              return (
                <>
                  <tr key={wp.id} className="work-package-row">
                    <td className="sticky-col work-package-cell">
                      <button
                        className="expand-btn"
                        onClick={() => hasWorkItems && togglePackage(wp.id)}
                        disabled={!hasWorkItems}
                      >
                        {hasWorkItems ? (
                          isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        ) : (
                          <span style={{ width: 16 }} />
                        )}
                        <span className="wp-name">{wp.name}</span>
                      </button>
                    </td>
                    {displayRoles.map((role) => (
                      <td key={role.id} className="hours-cell">
                        {!hasWorkItems && (
                          <input
                            type="number"
                            min="0"
                            value={getBudgetHours(wp.id, null, role.id) || ''}
                            onChange={(e) =>
                              handleHoursChange(wp.id, null, role.id, e.target.value)
                            }
                            className="hours-input"
                          />
                        )}
                      </td>
                    ))}
                    <td className="total-cell">{wpTotal > 0 ? wpTotal : ''}</td>
                  </tr>

                  {isExpanded &&
                    wp.workItems.map((wi) => (
                      <tr key={wi.id} className="work-item-row">
                        <td className="sticky-col work-item-cell">
                          <span className="wi-code">{wi.code}</span>
                          <span className="wi-name">{wi.name}</span>
                        </td>
                        {displayRoles.map((role) => (
                          <td key={role.id} className="hours-cell">
                            <input
                              type="number"
                              min="0"
                              value={getBudgetHours(wp.id, wi.id, role.id) || ''}
                              onChange={(e) =>
                                handleHoursChange(wp.id, wi.id, role.id, e.target.value)
                              }
                              className="hours-input"
                            />
                          </td>
                        ))}
                        <td className="total-cell">
                          {displayRoles.reduce(
                            (sum, role) => sum + getBudgetHours(wp.id, wi.id, role.id),
                            0
                          ) || ''}
                        </td>
                      </tr>
                    ))}
                </>
              );
            })}

            <tr className="totals-row">
              <td className="sticky-col">TOTALS</td>
              {displayRoles.map((role) => (
                <td key={role.id} className="total-cell">
                  {getRoleTotal(role.id) || ''}
                </td>
              ))}
              <td className="total-cell grand-total">{metrics.totalHours || ''}</td>
            </tr>

            <tr className="rates-row">
              <td className="sticky-col">Rate</td>
              {displayRoles.map((role) => (
                <td key={role.id} className="rate-cell">
                  ${role.standardRate}
                </td>
              ))}
              <td></td>
            </tr>

            <tr className="billings-row">
              <td className="sticky-col">Est. Billings</td>
              {displayRoles.map((role) => {
                const hours = getRoleTotal(role.id);
                const billings = hours * role.standardRate;
                return (
                  <td key={role.id} className="billings-cell">
                    {billings > 0 ? formatCurrency(billings) : ''}
                  </td>
                );
              })}
              <td className="billings-cell grand-total">
                {formatCurrency(metrics.estimatedBillings)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
