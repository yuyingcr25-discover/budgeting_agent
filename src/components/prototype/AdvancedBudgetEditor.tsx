import React, { useMemo, useState } from 'react';
import { roles as allRoles } from '../../data/referenceData';
import { fillBudgetWithHistorical } from '../../lib/ocrParser';
import { historicalSamples } from '../../data/mockPrototypeData';

type Budget = {
  templateName: string;
  rows: Array<{ costType: string; year1: number; year2: number; comments?: string }>;
  totals: { year1: number; year2: number };
};

export default function AdvancedBudgetEditor({
  budget,
  setBudget,
  onBack,
  onDone,
}: {
  budget: Budget | null;
  setBudget: (b: Budget) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const displayRoles = useMemo(() => allRoles.filter(r => r.isActive).slice(0, 6), []);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  // weeklyData[rowIdx][roleId][week] = hours
  const [weeklyData, setWeeklyData] = useState<Record<string, Record<string, Record<number, number>>>>({});
  const weeks = Array.from({ length: 12 }, (_, i) => i + 1);

  function isExpandable(row: any) {
    if (!row || !row.costType) return false;
    const t = String(row.costType).toLowerCase().trim();
    // don't expand project-level metadata or codes
    if (t.includes('project') || t.includes('code') || t.includes('project name')) return false;
    // don't expand rows that look like a numeric code
    if (/^\d+$/.test(t)) return false;
    return true;
  }

  if (!budget) return <div>No budget loaded</div>;

  const toggle = (i: number) => {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  function updateCell(rowIdx: number, roleId: string, value: string) {
    const hours = parseInt(value) || 0;
    setWeeklyData(prev => {
      const copy = { ...prev };
      copy[rowIdx] = copy[rowIdx] || {};
      copy[rowIdx][roleId] = copy[rowIdx][roleId] || {};
      // set total as week 0 aggregated
      copy[rowIdx][roleId][0] = hours;
      return copy;
    });
  }

  function distributeToWeeks(rowIdx: number, roleId: string) {
    const total = weeklyData[rowIdx]?.[roleId]?.[0] || 0;
    if (!total) return;
    const per = Math.floor(total / weeks.length);
    const rem = total - per * weeks.length;
    setWeeklyData(prev => {
      const copy = { ...prev };
      copy[rowIdx] = copy[rowIdx] || {};
      copy[rowIdx][roleId] = copy[rowIdx][roleId] || {};
      weeks.forEach((w, i) => {
        copy[rowIdx][roleId][w] = per + (i < rem ? 1 : 0);
      });
      return copy;
    });
  }

  function applyHistoricalAll() {
    if (!budget) return;
    // merge historical into budget rows using fillBudgetWithHistorical
    const dummyTemplate = budget as any;
    const hist = historicalSamples.find(h => h.templateName === budget.templateName) || historicalSamples[0];
    const merged = fillBudgetWithHistorical(dummyTemplate, hist);
    setBudget(merged);
    // populate weeklyData only for expandable (work-item) rows: assign merged.year1 into first role evenly
    const newWeekly: any = {};
    merged.rows.forEach((r: any, idx: number) => {
      if (!isExpandable(r)) return; // skip non-workitem rows
      const firstRole = displayRoles[0];
      newWeekly[idx] = {};
      newWeekly[idx][firstRole.id] = {};
      newWeekly[idx][firstRole.id][0] = r.year1 || 0;
      const total = r.year1 || 0;
      const per = Math.floor(total / weeks.length);
      const rem = total - per * weeks.length;
      weeks.forEach((w, i) => {
        newWeekly[idx][firstRole.id][w] = per + (i < rem ? 1 : 0);
      });
    });
    setWeeklyData(newWeekly);
  }

  return (
    <div>
      <h3>Budget Editor — {budget.templateName}</h3>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => applyHistoricalAll()} style={{ marginRight: 8 }}>Prefill with historical</button>
        <button onClick={onBack} style={{ marginRight: 8 }}>Back to CRM</button>
        <button onClick={onDone} style={{ background: '#0b74de', color: 'white' }}>Done and Sync</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Work Item</th>
            {displayRoles.map((r) => (
              <th key={r.id}>{r.name}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {budget.rows.map((row, i) => {
              const totalsPerRow = displayRoles.reduce((s, r) => s + (weeklyData[i]?.[r.id]?.[0] || 0), 0);
              const expandable = isExpandable(row);
              return (
                <React.Fragment key={i}>
                  <tr>
                    <td>
                      {expandable ? (
                        <button onClick={() => toggle(i)} style={{ marginRight: 8 }}>{expanded.has(i) ? '-' : '+'}</button>
                      ) : (
                        <span style={{ display: 'inline-block', width: 26 }} />
                      )}
                      {row.costType}
                      {row.comments ? <div style={{ fontSize: 11, color: '#666' }}>{row.comments}</div> : null}
                    </td>
                    {displayRoles.map((r) => (
                      <td key={r.id} style={{ padding: 8 }}>
                        <input
                          value={weeklyData[i]?.[r.id]?.[0] ?? ''}
                          onChange={(e) => updateCell(i, r.id, e.target.value)}
                          onBlur={() => distributeToWeeks(i, r.id)}
                          className="hours-input"
                          disabled={!expandable}
                        />
                      </td>
                    ))}
                    <td style={{ fontWeight: 'bold' }}>{totalsPerRow || ''}</td>
                  </tr>
                  {expandable && expanded.has(i) && (
                    <tr>
                      <td colSpan={displayRoles.length + 2}>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 6 }}>
                          {weeks.map((w) => (
                            <div key={w} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 12, color: '#666' }}>W{w}</div>
                              {displayRoles.map((r) => (
                                <div key={r.id} style={{ marginTop: 4 }}>
                                  <input
                                    style={{ width: 60 }}
                                    value={weeklyData[i]?.[r.id]?.[w] ?? ''}
                                    onChange={(e) => {
                                      const v = parseInt(e.target.value) || 0;
                                      setWeeklyData(prev => {
                                        const copy = { ...prev };
                                        copy[i] = copy[i] || {};
                                        copy[i][r.id] = copy[i][r.id] || {};
                                        copy[i][r.id][w] = v;
                                        return copy;
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
        <strong>Totals</strong>
        <div>Year1: {budget.totals.year1}</div>
        <div>Year2: {budget.totals.year2}</div>
      </div>
    </div>
  );
}
