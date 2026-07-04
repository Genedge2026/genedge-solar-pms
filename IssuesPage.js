import React, { useState } from 'react';
import { useIssues } from '../../lib/hooks';
import { format, parseISO } from 'date-fns';

function fmtDate(d) {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d || '—'; }
}

function priorityTag(p) {
  const map = { Critical: 'tag-red', High: 'tag-amber', Normal: 'tag-gray' };
  return <span className={`tag ${map[p] || 'tag-gray'}`}>{p || 'Normal'}</span>;
}

function actionTag(a) {
  const map = { Office: 'tag-blue', Store: 'tag-amber', OEM: 'tag-red', Client: 'tag-purple', Contractor: 'tag-gray' };
  return <span className={`tag ${map[a] || 'tag-gray'}`}>{a || '—'}</span>;
}

export default function IssuesPage({ isOffice, siteFilter }) {
  const [localFilter, setLocalFilter] = useState(siteFilter || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { issues, loading } = useIssues(localFilter);

  if (!isOffice) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Access Restricted</h3>
        <div>Issues / NCR module is available to office admin only.</div>
      </div>
    );
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const filtered = priorityFilter === 'all'
    ? issues
    : issues.filter(i => i.priority === priorityFilter);

  const critical = issues.filter(i => i.priority === 'Critical').length;
  const high     = issues.filter(i => i.priority === 'High').length;
  const normal   = issues.filter(i => i.priority === 'Normal' || !i.priority).length;

  const actionGroups = {};
  issues.forEach(i => {
    const k = i.action_from || 'None';
    actionGroups[k] = (actionGroups[k] || 0) + 1;
  });

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>Issues & NCR Tracker</h1>
          <div className="text-muted mt-4">All open issues extracted from DPR submissions</div>
        </div>
        <div className="flex gap-12">
          <select value={localFilter} onChange={e => setLocalFilter(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Sites</option>
            <option value="Devkigalol">Devkigalol</option>
            <option value="Kanja">Kanja</option>
            <option value="Mendapara">Mendapara</option>
            <option value="Mandodara">Mandodara</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Issues</div>
          <div className="stat-value">{issues.length}</div>
          <div className="stat-sub">from DPR records</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical</div>
          <div className={`stat-value ${critical > 0 ? 'val-red' : 'val-green'}`}>{critical}</div>
          <div className="stat-sub">immediate action</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Priority</div>
          <div className={`stat-value ${high > 0 ? 'val-accent' : 'val-green'}`}>{high}</div>
          <div className="stat-sub">urgent attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Normal</div>
          <div className="stat-value">{normal}</div>
          <div className="stat-sub">routine items</div>
        </div>
      </div>

      {/* Action Required Breakdown */}
      {Object.keys(actionGroups).length > 0 && (
        <div className="card mb-24" style={{ marginBottom: 24 }}>
          <div className="fw-700 mb-16">Action Required Breakdown</div>
          <div className="flex flex-wrap gap-12">
            {Object.entries(actionGroups).map(([k, v]) => (
              <div key={k} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '10px 18px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No issues found</h3>
            <div>Issues are logged via the DPR form by site teams.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Site</th>
                  <th>Issue Description</th>
                  <th>Action From</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td style={{ whiteSpace: 'nowrap' }}><strong>{fmtDate(i.date)}</strong></td>
                    <td>{i.site}</td>
                    <td style={{ maxWidth: 380 }}>{i.issues}</td>
                    <td>{actionTag(i.action_from)}</td>
                    <td>{priorityTag(i.priority)}</td>
                    <td><span className="tag tag-amber">Open</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
