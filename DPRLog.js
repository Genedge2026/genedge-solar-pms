import React, { useState } from 'react';
import { useDPRs } from '../../lib/hooks';
import { format, parseISO } from 'date-fns';

function fmtDate(d) {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d || '—'; }
}

function schedTag(s) {
  const map = { 'On Track': 'tag-green', 'Slightly Delayed': 'tag-amber', 'Delayed': 'tag-red', 'Ahead': 'tag-blue' };
  return <span className={`tag ${map[s] || 'tag-gray'}`}>{s || '—'}</span>;
}

function safetyTag(s) {
  return <span className={`tag ${s === 'None' || !s ? 'tag-green' : 'tag-red'}`}>{s || 'None'}</span>;
}

function priorityTag(p) {
  const map = { Critical: 'tag-red', High: 'tag-amber', Normal: 'tag-gray' };
  return <span className={`tag ${map[p] || 'tag-gray'}`}>{p || 'Normal'}</span>;
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ minWidth: 200, fontSize: 12, color: 'var(--text2)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: value !== 0 && typeof value !== 'string' ? 600 : 400 }}>{value}</span>
    </div>
  );
}

function DPRModal({ dpr, onClose }) {
  if (!dpr) return null;
  const mp = (dpr.mp_civil||0)+(dpr.mp_elec||0)+(dpr.mp_general||0)+(dpr.mp_supervisor||0)+(dpr.mp_subcon||0);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius2)', padding: 28, width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Modal Header */}
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18 }}>DPR — {dpr.site}</h2>
            <div className="text-muted text-sm mt-4">{fmtDate(dpr.date)} · {dpr.weather}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        {/* Overall */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat-card" style={{ padding: 14 }}>
            <div className="stat-label">Overall Progress</div>
            <div className="stat-value val-green" style={{ fontSize: 22 }}>{dpr.overall_pct || 0}%</div>
          </div>
          <div className="stat-card" style={{ padding: 14 }}>
            <div className="stat-label">Schedule</div>
            <div style={{ marginTop: 8 }}>{schedTag(dpr.schedule_status)}</div>
          </div>
          <div className="stat-card" style={{ padding: 14 }}>
            <div className="stat-label">Total Manpower</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{mp}</div>
          </div>
        </div>

        {/* Civil */}
        <div style={{ marginBottom: 16 }}>
          <div className="form-section-title">🏗️ Civil Works</div>
          <div className="grid-3" style={{ marginBottom: 10 }}>
            {[['Piling', dpr.piling_pct], ['PCC/Foundation', dpr.pcc_pct], ['Structure', dpr.structure_pct]].map(([l, v]) => (
              <div key={l}>
                <div className="text-xs text-muted">{l}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{v || 0}%</div>
                <div className="progress-bar" style={{ marginTop: 4 }}>
                  <div className="progress-fill prog-amber" style={{ width: `${v || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <DetailRow label="Piles today / Cumulative" value={`${dpr.piles_today || 0} nos. / ${dpr.piles_cum || 0} nos.`} />
          {dpr.civil_remarks && <DetailRow label="Remarks" value={dpr.civil_remarks} />}
        </div>

        {/* Module & Electrical */}
        <div style={{ marginBottom: 16 }}>
          <div className="form-section-title">🔆 Module & Electrical</div>
          <div className="grid-3" style={{ marginBottom: 10 }}>
            {[['Module Mounting', dpr.module_pct], ['DC Cabling', dpr.dc_cable_pct], ['AC Cabling', dpr.ac_cable_pct]].map(([l, v]) => (
              <div key={l}>
                <div className="text-xs text-muted">{l}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)' }}>{v || 0}%</div>
                <div className="progress-bar" style={{ marginTop: 4 }}>
                  <div className="progress-fill prog-blue" style={{ width: `${v || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <DetailRow label="Modules today / Cumulative" value={`${dpr.modules_today || 0} / ${dpr.modules_cum || 0} nos.`} />
          <DetailRow label="Inverter commissioning" value={`${dpr.inv_comm_pct || 0}% — ${dpr.inv_commissioned || 0} nos.`} />
          {dpr.elec_remarks && <DetailRow label="Remarks" value={dpr.elec_remarks} />}
        </div>

        {/* Generation */}
        <div style={{ marginBottom: 16 }}>
          <div className="form-section-title">⚡ Generation</div>
          <div className="grid-3">
            <DetailRow label="Today" value={`${(dpr.gen_today || 0).toFixed(1)} kWh`} />
            <DetailRow label="Cumulative" value={`${(dpr.gen_cum || 0).toFixed(0)} kWh`} />
            <DetailRow label="Availability" value={`${(dpr.availability || 0).toFixed(1)}%`} />
            <DetailRow label="Grid Export" value={`${(dpr.export_kwh || 0).toFixed(1)} kWh`} />
            <DetailRow label="Peak Power" value={`${(dpr.peak_kw || 0).toFixed(0)} kW`} />
            <DetailRow label="Inverters Running / Fault" value={`${dpr.inv_running || 0} / ${dpr.inv_fault || 0}`} />
          </div>
        </div>

        {/* Manpower */}
        <div style={{ marginBottom: 16 }}>
          <div className="form-section-title">👷 Manpower (Total: {mp})</div>
          <div className="grid-3">
            <DetailRow label="Civil Workers" value={dpr.mp_civil || 0} />
            <DetailRow label="Electrical Workers" value={dpr.mp_elec || 0} />
            <DetailRow label="General Labour" value={dpr.mp_general || 0} />
            <DetailRow label="Supervisors" value={dpr.mp_supervisor || 0} />
            <DetailRow label="Sub-contractor" value={dpr.mp_subcon || 0} />
          </div>
        </div>

        {/* Material */}
        {(dpr.material_received || dpr.material_shortage || dpr.equipment_onsite || dpr.equipment_issue) && (
          <div style={{ marginBottom: 16 }}>
            <div className="form-section-title">🚛 Material & Equipment</div>
            {dpr.material_received  && <DetailRow label="Material Received"  value={dpr.material_received} />}
            {dpr.material_shortage  && <DetailRow label="Material Shortage"  value={dpr.material_shortage} />}
            {dpr.equipment_onsite   && <DetailRow label="Equipment on Site"  value={dpr.equipment_onsite} />}
            {dpr.equipment_issue    && <DetailRow label="Equipment Issues"   value={dpr.equipment_issue} />}
          </div>
        )}

        {/* Safety */}
        <div style={{ marginBottom: 16 }}>
          <div className="form-section-title">🦺 Safety & HSE</div>
          <DetailRow label="Safety Incident" value={safetyTag(dpr.safety)} />
          <DetailRow label="Toolbox Talk" value={dpr.tbt_conducted} />
          {dpr.safety_remarks && <DetailRow label="Safety Remarks" value={dpr.safety_remarks} />}
        </div>

        {/* Issues */}
        {dpr.issues && (
          <div style={{ marginBottom: 16 }}>
            <div className="form-section-title">⚠️ Issues & Actions</div>
            <div style={{
              padding: 12, background: 'rgba(248,81,73,0.07)',
              border: '1px solid rgba(248,81,73,0.2)', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 8
            }}>{dpr.issues}</div>
            <DetailRow label="Action Required From" value={dpr.action_from} />
            <DetailRow label="Priority" value={priorityTag(dpr.priority)} />
          </div>
        )}

        {/* Overall */}
        <div>
          <div className="form-section-title">📝 Overall Assessment</div>
          {dpr.plan_tomorrow    && <DetailRow label="Plan for Tomorrow"  value={dpr.plan_tomorrow} />}
          {dpr.overall_remarks  && <DetailRow label="Overall Remarks"    value={dpr.overall_remarks} />}
          <DetailRow label="Submitted By" value={dpr.submitted_by_name} />
          <DetailRow label="Submitted At" value={dpr.created_at ? new Date(dpr.created_at).toLocaleString('en-IN') : '—'} />
        </div>
      </div>
    </div>
  );
}

export default function DPRLog({ profile, isOffice }) {
  const [siteFilter, setSiteFilter] = useState(isOffice ? 'all' : profile.site);
  const [selectedDPR, setSelectedDPR] = useState(null);
  const { dprs, loading } = useDPRs(siteFilter);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>DPR Records</h1>
          <div className="text-muted mt-4">All submitted daily progress reports</div>
        </div>
        {isOffice && (
          <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} style={{ width: 170 }}>
            <option value="all">All Sites</option>
            <option value="Devkigalol">Devkigalol</option>
            <option value="Kanja">Kanja</option>
            <option value="Mendapara">Mendapara</option>
            <option value="Mandodara">Mandodara</option>
          </select>
        )}
      </div>

      <div className="card">
        {dprs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No DPR records found</h3>
            <div>Submit your first DPR using the "Submit DPR" section.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Site</th>
                  <th>Overall %</th>
                  <th>Civil %</th>
                  <th>Module %</th>
                  <th>Gen. (kWh)</th>
                  <th>Manpower</th>
                  <th>Schedule</th>
                  <th>Safety</th>
                  <th>Submitted By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dprs.map(d => {
                  const mp = (d.mp_civil||0)+(d.mp_elec||0)+(d.mp_general||0)+(d.mp_supervisor||0)+(d.mp_subcon||0);
                  const pct = d.overall_pct || 0;
                  return (
                    <tr key={d.id}>
                      <td><strong>{fmtDate(d.date)}</strong></td>
                      <td>{d.site}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--red)' }}>
                          {pct}%
                        </span>
                      </td>
                      <td>{d.structure_pct || 0}%</td>
                      <td>{d.module_pct || 0}%</td>
                      <td>{(d.gen_today || 0).toFixed(1)}</td>
                      <td>{mp}</td>
                      <td>{schedTag(d.schedule_status)}</td>
                      <td>{safetyTag(d.safety)}</td>
                      <td className="text-muted text-sm">{d.submitted_by_name || '—'}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedDPR(d)}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDPR && <DPRModal dpr={selectedDPR} onClose={() => setSelectedDPR(null)} />}
    </div>
  );
}
