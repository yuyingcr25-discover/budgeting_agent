import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { roles, locations, getRoleById } from '../../data/referenceData';
import type { ResourceRequestType } from '../../types';

export function Step4Demand() {
  const {
    currentProject,
    setCurrentProject,
    addResourceDemand,
    updateResourceDemand,
    removeResourceDemand,
    setDemandWeeklyHours,
    getDemandMetrics,
    getBudgetMetrics,
  } = useProjectStore();

  const demandMetrics = getDemandMetrics();
  const budgetMetrics = getBudgetMetrics();

  // Generate week numbers based on start date
  const getWeekNumbers = () => {
    const weeks = [];
    for (let i = 1; i <= 12; i++) {
      weeks.push(i);
    }
    return weeks;
  };

  const weeks = getWeekNumbers();

  const handleAddResource = (type: ResourceRequestType) => {
    addResourceDemand({
      requestType: type,
      employeeEmail: null,
      employeeName: null,
      employeeId: null,
      roleId: 'T004',
      serviceDepartment: currentProject.deliveryServiceOrg,
      locationId: '16', // Default to New York
      weeklyHours: {},
    });
  };

  const getResourceTotalHours = (weeklyHours: Record<number, number>) => {
    return Object.values(weeklyHours).reduce((sum, h) => sum + h, 0);
  };

  const formatVariance = (variance: number) => {
    if (variance === 0) return '0';
    return variance > 0 ? `+${variance}` : `${variance}`;
  };

  return (
    <div className="step-content step-demand">
      <div className="step-header">
        <h2>Resource Demand</h2>
        <p>Schedule resources by week</p>
      </div>

      {/* Summary Bar */}
      <div className="demand-summary-bar">
        <div className="summary-item">
          <span className="label">Budget Hours (excl. Partners)</span>
          <span className="value">
            {Object.entries(budgetMetrics.hoursByRole)
              .filter(([roleId]) => {
                const role = getRoleById(roleId);
                return role && !role.name.toLowerCase().includes('partner');
              })
              .reduce((sum, [, hours]) => sum + hours, 0)}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Demand Hours</span>
          <span className="value">{demandMetrics.totalDemandHours}</span>
        </div>
        <div className={`summary-item ${demandMetrics.variance === 0 ? 'success' : 'warning'}`}>
          <span className="label">Variance</span>
          <span className="value">
            {demandMetrics.variance === 0 ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {formatVariance(demandMetrics.variance)}
          </span>
        </div>
      </div>

      {/* Start Date */}
      <div className="form-section compact">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="demandStartDate">Resource Scheduling Start Date</label>
            <input
              type="date"
              id="demandStartDate"
              value={currentProject.demandStartDate || ''}
              onChange={(e) =>
                setCurrentProject({ demandStartDate: e.target.value || null })
              }
            />
          </div>
        </div>
      </div>

      {/* Resource Demand Grid */}
      <div className="demand-grid-container">
        <table className="demand-grid">
          <thead>
            <tr>
              <th className="resource-col">Resource</th>
              <th className="role-col">Role</th>
              <th className="location-col">Location</th>
              {weeks.map((week) => (
                <th key={week} className="week-col">
                  Wk {week}
                </th>
              ))}
              <th className="total-col">Total</th>
              <th className="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            {currentProject.resourceDemands.map((demand) => {
              const totalHours = getResourceTotalHours(demand.weeklyHours);

              return (
                <tr key={demand.id}>
                  <td className="resource-cell">
                    {demand.requestType === 'Named' ? (
                      <input
                        type="email"
                        value={demand.employeeEmail || ''}
                        onChange={(e) =>
                          updateResourceDemand(demand.id, {
                            employeeEmail: e.target.value,
                            employeeName: e.target.value.split('@')[0],
                          })
                        }
                        placeholder="email@cohnreznick.com"
                        className="table-input"
                      />
                    ) : (
                      <span className="resource-type-badge">
                        [{demand.requestType}]
                      </span>
                    )}
                  </td>
                  <td>
                    <select
                      value={demand.roleId}
                      onChange={(e) =>
                        updateResourceDemand(demand.id, { roleId: e.target.value })
                      }
                      className="table-select"
                    >
                      {roles
                        .filter((r) => !r.name.toLowerCase().includes('partner'))
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={demand.locationId}
                      onChange={(e) =>
                        updateResourceDemand(demand.id, { locationId: e.target.value })
                      }
                      className="table-select"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {weeks.map((week) => (
                    <td key={week} className="hours-cell">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={demand.weeklyHours[week] || ''}
                        onChange={(e) =>
                          setDemandWeeklyHours(
                            demand.id,
                            week,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="hours-input"
                      />
                    </td>
                  ))}
                  <td className="total-cell">{totalHours || ''}</td>
                  <td>
                    <button
                      className="btn-icon danger"
                      onClick={() => removeResourceDemand(demand.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Weekly totals row */}
            <tr className="totals-row">
              <td colSpan={3}>Weekly Totals</td>
              {weeks.map((week) => (
                <td key={week} className="total-cell">
                  {demandMetrics.demandByWeek[week] || ''}
                </td>
              ))}
              <td className="total-cell grand-total">
                {demandMetrics.totalDemandHours || ''}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Resource Buttons */}
      <div className="add-resource-buttons">
        <button
          className="btn btn-secondary"
          onClick={() => handleAddResource('Named')}
        >
          <Plus size={16} />
          Add Named Resource
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleAddResource('Unnamed')}
        >
          <Plus size={16} />
          Add Unnamed Resource
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleAddResource('Generic')}
        >
          <Plus size={16} />
          Add Generic Resource
        </button>
      </div>

      {/* Hours by Role Summary */}
      {Object.keys(demandMetrics.demandByRole).length > 0 && (
        <div className="form-section">
          <h3>Hours by Role</h3>
          <div className="role-hours-summary">
            {Object.entries(demandMetrics.demandByRole).map(([roleId, hours]) => {
              const role = getRoleById(roleId);
              const budgetHours = budgetMetrics.hoursByRole[roleId] || 0;
              const variance = budgetHours - hours;

              return (
                <div key={roleId} className="role-hours-item">
                  <span className="role-name">{role?.name || roleId}</span>
                  <div className="hours-comparison">
                    <span className="budget">Budget: {budgetHours}</span>
                    <span className="demand">Demand: {hours}</span>
                    <span className={`variance ${variance === 0 ? 'ok' : variance > 0 ? 'under' : 'over'}`}>
                      {variance === 0 ? '✓' : formatVariance(variance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
