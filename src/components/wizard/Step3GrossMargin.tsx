import { useState } from 'react';
import { Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { roles, GROSS_MARGIN_TARGET } from '../../data/referenceData';

export function Step3GrossMargin() {
  const {
    currentProject,
    setCurrentProject,
    addSubcontractor,
    updateSubcontractor,
    removeSubcontractor,
    addExpense,
    updateExpense,
    removeExpense,
    getGrossMarginMetrics,
    getBudgetMetrics,
  } = useProjectStore();

  const [newSubName, setNewSubName] = useState('');
  const gmMetrics = getGrossMarginMetrics();
  // budgetMetrics available for future use
  void getBudgetMetrics;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddSubcontractor = () => {
    if (!newSubName.trim()) return;
    addSubcontractor({
      name: newSubName,
      hours: 0,
      roleId: 'T004',
      costPerHour: 0,
      billRatePerHour: 0,
    });
    setNewSubName('');
  };

  const handleAddExpense = () => {
    addExpense({
      category: 'Travel',
      description: '',
      amount: 0,
      isBillable: true,
    });
  };

  return (
    <div className="step-content step-gross-margin">
      <div className="step-header">
        <h2>Gross Margin Calculator</h2>
        <p>Review profitability and add costs</p>
      </div>

      {/* Gross Margin Summary Card */}
      <div className={`gm-summary-card ${gmMetrics.meetsTarget ? 'target-met' : 'target-missed'}`}>
        <div className="gm-main">
          <div className="gm-percentage">
            <span className="value">{(gmMetrics.grossMarginPercent * 100).toFixed(1)}%</span>
            <span className="label">Gross Margin</span>
          </div>
          <div className="gm-status">
            {gmMetrics.meetsTarget ? (
              <>
                <CheckCircle size={24} />
                <span>Target Met (≥{(GROSS_MARGIN_TARGET * 100).toFixed(1)}%)</span>
              </>
            ) : (
              <>
                <AlertTriangle size={24} />
                <span>Below Target ({(GROSS_MARGIN_TARGET * 100).toFixed(1)}%)</span>
              </>
            )}
          </div>
        </div>

        <div className="gm-breakdown">
          <div className="breakdown-section">
            <h4>Revenues</h4>
            <div className="breakdown-item">
              <span>Labor Fees</span>
              <span>{formatCurrency(gmMetrics.laborFees)}</span>
            </div>
            <div className="breakdown-item">
              <span>Admin & Tech Fee ({(currentProject.adminFeePercent * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(gmMetrics.adminFee)}</span>
            </div>
            <div className="breakdown-item">
              <span>Billable Expenses</span>
              <span>{formatCurrency(gmMetrics.expenseRevenue)}</span>
            </div>
            <div className="breakdown-item">
              <span>Fee Adjustment</span>
              <span>{formatCurrency(gmMetrics.feeAdjustment)}</span>
            </div>
            <div className="breakdown-total">
              <span>Total Revenue</span>
              <span>{formatCurrency(gmMetrics.totalRevenue)}</span>
            </div>
          </div>

          <div className="breakdown-section">
            <h4>Costs</h4>
            <div className="breakdown-item">
              <span>Staff Costs</span>
              <span>{formatCurrency(gmMetrics.staffCost)}</span>
            </div>
            <div className="breakdown-item">
              <span>Subcontractor Costs</span>
              <span>{formatCurrency(gmMetrics.subcontractorCost)}</span>
            </div>
            <div className="breakdown-item">
              <span>Expenses</span>
              <span>{formatCurrency(gmMetrics.expenseCost)}</span>
            </div>
            <div className="breakdown-total">
              <span>Total Costs</span>
              <span>{formatCurrency(gmMetrics.totalCost)}</span>
            </div>
          </div>

          <div className="breakdown-section highlight">
            <div className="breakdown-total">
              <span>Gross Margin</span>
              <span>{formatCurrency(gmMetrics.grossMargin)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="gm-details-grid">
        {/* Fee Adjustment */}
        <div className="form-section">
          <h3>Fee Adjustment</h3>
          <p className="section-description">
            Adjust fees for fixed fee alignment or other billing adjustments
          </p>
          <div className="form-group">
            <label>Adjustment Amount</label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                type="number"
                value={currentProject.feeAdjustment || ''}
                onChange={(e) =>
                  setCurrentProject({ feeAdjustment: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
            <div className="input-hint">
              Enter positive value for markup, negative for discount
            </div>
          </div>
        </div>

        {/* Subcontractors */}
        <div className="form-section">
          <h3>Subcontractors</h3>
          <p className="section-description">
            Add subcontractor costs for the engagement
          </p>

          {currentProject.subcontractors.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Hours</th>
                  <th>Cost/Hr</th>
                  <th>Bill Rate</th>
                  <th>Total Cost</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentProject.subcontractors.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) =>
                          updateSubcontractor(sub.id, { name: e.target.value })
                        }
                        className="table-input"
                      />
                    </td>
                    <td>
                      <select
                        value={sub.roleId}
                        onChange={(e) =>
                          updateSubcontractor(sub.id, { roleId: e.target.value })
                        }
                        className="table-select"
                      >
                        {roles.filter(r => !r.isIndia).map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={sub.hours || ''}
                        onChange={(e) =>
                          updateSubcontractor(sub.id, {
                            hours: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="table-input number"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={sub.costPerHour || ''}
                        onChange={(e) =>
                          updateSubcontractor(sub.id, {
                            costPerHour: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="table-input number"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={sub.billRatePerHour || ''}
                        onChange={(e) =>
                          updateSubcontractor(sub.id, {
                            billRatePerHour: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="table-input number"
                      />
                    </td>
                    <td className="calculated">
                      {formatCurrency(sub.hours * sub.costPerHour)}
                    </td>
                    <td>
                      <button
                        className="btn-icon danger"
                        onClick={() => removeSubcontractor(sub.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="add-row">
            <input
              type="text"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="Subcontractor name"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubcontractor()}
            />
            <button className="btn btn-secondary" onClick={handleAddSubcontractor}>
              <Plus size={16} />
              Add Subcontractor
            </button>
          </div>
        </div>

        {/* Expenses */}
        <div className="form-section">
          <h3>Expenses</h3>
          <p className="section-description">
            Track project expenses and their billability
          </p>

          {currentProject.expenses.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Billable</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentProject.expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <select
                        value={expense.category}
                        onChange={(e) =>
                          updateExpense(expense.id, { category: e.target.value })
                        }
                        className="table-select"
                      >
                        <option value="Travel">Travel</option>
                        <option value="Meals">Meals</option>
                        <option value="Software">Software</option>
                        <option value="Professional Fees">Professional Fees</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={expense.description}
                        onChange={(e) =>
                          updateExpense(expense.id, { description: e.target.value })
                        }
                        placeholder="Description"
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={expense.amount || ''}
                        onChange={(e) =>
                          updateExpense(expense.id, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="table-input number"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={expense.isBillable}
                        onChange={(e) =>
                          updateExpense(expense.id, { isBillable: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn-icon danger"
                        onClick={() => removeExpense(expense.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button className="btn btn-secondary" onClick={handleAddExpense}>
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}
