import React, { useState } from 'react';
import { useLatestDPRs, useDPRs } from '../../lib/hooks';
import { SITES, SITE_NAMES } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';

function fmtDate(d) {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d || '—'; }
}

function schedTag(s) {
  const map = { 'On Track': 'tag-green', 'Slightly Delayed': 'tag-amber', 'Delayed': 'tag-red', 'Ahead': 'tag-blue' };
  return <span className={`tag ${map[s] || 'tag-gray'}`}>{s || '—'}</span>;
}

function downloadCSV(content, filename) {
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ReportsPage({ isOffice }) {
  const [activeTab, setActiveTab] = useState('summary');
  const { latest, loading: lLoading } = useLatestDPRs();
  const { dprs, loading: dLoading } = useDPRs('all');

  if (!isOffice) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Access Restricted</h3>
        <div>Reports module is available to office admin only.</div>
      </div>
    );
  }

  if (lLoading || dLoading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  // ── Export: Progress Report ──
  function exportProgress() {
    let csv = 'Date,Site,Overall%,Piling%,PCC%,Structure%,Module%,DC Cable%,AC Cable%,Inv Comm%,Gen Today(kWh),Gen Cum(kWh),Availability%,Schedule,Submitted By\n';
    [...dprs].sort((a, b) => b.date.localeCompare(a.date)).forEach(d => {
      csv += [
        d.date, d.site, d.overall_pct || 0,
        d.piling_pct || 0, d.pcc_pct || 0, d.structure_pct || 0,
        d.module_pct || 0, d.dc_cable_pct || 0, d.ac_cable_pct || 0, d.inv_comm_pct || 0,
        (d.gen_today || 0).toFixed(1), (d.gen_cum || 0).toFixed(1),
        (d.availability || 0).toFixed(1), d.schedule_status || '',
        d.submitted_by_name || ''
      ].join(',') + '\n';
    });
    downloadCSV(csv, `genedge_progress_report_${format(new Date(), 'yyyyMMdd')}.csv`);
  }

  // ── Export: Manpower Report ──
  function exportManpower() {
    let csv = 'Date,Site,Civil,Electrical,General Labour,Supervisors,Sub-Contractor,Total\n';
    [...dprs].sort((a, b) => b.date.localeCompare(a.date)).forEach(d => {
      const tot = (d.mp_civil||0)+(d.mp_elec||0)+(d.mp_general||0)+(d.mp_supervisor||0)+(d.mp_subcon||0);
      csv += [d.date, d.site, d.mp_civil||0, d.mp_elec||0, d.mp_general||0, d.mp_supervisor||0, d.mp_subcon||0, tot].join(',') + '\n';
    });
    downloadCSV(csv, `genedge_manpower_report_${format(new Date(), 'yyyyMMdd')}.csv`);
  }

  // ── Export: Generation Report ──
  function exportGeneration() {
    let csv = 'Date,Site,Gen Today(kWh),Gen Cumulative(kWh),Availability%,Export(kWh),Peak Power(kW),Inverters Running,Inverters Fault\n';
    [...dprs].sort((a, b) => b.date.localeCompare(a.date)).forEach(d => {
      csv += [
        d.date, d.site,
        (d.gen_today||0).toFixed(1), (d.gen_cum||0).toFixed(1),
        (d.availability||0).toFixed(1), (d.export_kwh||0).toFixed(1),
        (d.peak_kw||0).toFixed(0), d.inv_running||0, d.inv_fault||0
      ].join(',') + '\n';
    });
    downloadCSV(csv, `genedge_generation_report_${format(new Date(), 'yyyyMMdd')}.csv`);
  }

  // ── Export: Issues Report ──
  function exportIssues() {
    let csv = 'Date,Site,Issue Description,Action Required From,Priority,Safety Incident\n';
    dprs.filter(d => d.issues && d.issues.trim()).forEach(d => {
      csv += [
        d.date, d.site,
        `"${(d.issues || '').replace(/"/g, '""')}"`,
        d.action_from || '', d.priority || 'Normal', d.safety || 'None'
      ].join(',') + '\n';
    });
    downloadCSV(csv, `genedge_issues_report_${format(new Date(), 'yyyyMMdd')}.csv`);
  }

  // ── Export: Full DPR Dump ──
  function exportFullDPR() {
    if (!dprs.length) return;
    const keys = Object.keys(dprs[0]);
    let csv = keys.join(',') + '\n';
    dprs.forEach(d => {
      csv += keys.map(k => {
        const v = d[k];
        if (typeof v === 'string' && v.includes(',')) return `"${v.replace(/"/g, '""')}"`;
        return v ?? '';
      }).join(',') + '\n';
    });
    downloadCSV(csv, `genedge_full_dpr_dump_${format(new Date(), 'yyyyMMdd')}.csv`);
  }

  // ── Cluster totals ──
  const totalDPRs    = dprs.length;
  const totalGenKWh  = dprs.reduce((a, d) => a + (d.gen_today || 0), 0);
  const totalIssues  = dprs.filter(d => d.issues && d.issues.trim()).length;
  const safetyInc    = dprs.filter(d => d.safety && d.safety !== 'None').length;
  const totalMP      = dprs.reduce((a, d) => a + (d.mp_civil||0)+(d.mp_elec||0)+(d.mp_general||0)+(d.mp_supervisor||0)+(d.mp_subcon||0), 0);

  const TABS = [
    { id: 'summary',   label: '📊 Summary' },
    { id: 'exports',   label: '⬇️ Exports' },
  ];

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>Reports & Analytics</h1>
          <div className="text-muted mt-4">Cluster-level reporting — Junagadh</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          Generated: {format(new Date(), 'dd MMM yyyy, HH:mm')}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: '9px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              color: activeTab === t.id ? 'var(--accent)' : 'var(--text2)',
              borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s'
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── SUMMARY TAB ── */}
      {activeTab === 'summary' && (
        <>
          {/* KPI Cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total DPR Submissions</div>
              <div className="stat-value">{totalDPRs}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cumulative Generation</div>
              <div className="stat-value val-blue">{(totalGenKWh / 1000).toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text2)' }}>MWh</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Issues Logged</div>
              <div className={`stat-value ${totalIssues > 0 ? 'val-red' : 'val-green'}`}>{totalIssues}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Safety Incidents</div>
              <div className={`stat-value ${safetyInc > 0 ? 'val-red' : 'val-green'}`}>{safetyInc}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Manpower Days</div>
              <div className="stat-value">{totalMP}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cluster Capacity</div>
              <div className="stat-value val-accent">7.8 <span style={{ fontSize: 14, color: 'var(--text2)' }}>MWp</span></div>
            </div>
          </div>

          {/* Site Summary Table */}
          <div className="card mb-24" style={{ marginBottom: 24 }}>
            <div className="fw-700 mb-16">Site-wise Summary (Latest Status)</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Capacity</th>
                    <th>Overall Progress</th>
                    <th>Civil %</th>
                    <th>Module %</th>
                    <th>Last Gen (kWh)</th>
                    <th>Schedule</th>
                    <th>Last DPR</th>
                  </tr>
                </thead>
                <tbody>
                  {SITE_NAMES.map(site => {
                    const d = latest[site];
                    const pct = d?.overall_pct || 0;
                    return (
                      <tr key={site}>
                        <td><strong>{site}</strong></td>
                        <td>{SITES[site]?.capacity} MWp</td>
                        <td>
                          <div className="flex gap-8">
                            <span style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--red)' }}>{pct}%</span>
                            <div style={{ flex: 1, alignSelf: 'center' }}>
                              <div className="progress-bar" style={{ width: 80 }}>
                                <div className={`progress-fill ${pct >= 80 ? 'prog-green' : pct >= 50 ? 'prog-amber' : 'prog-red'}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{d?.structure_pct || 0}%</td>
                        <td>{d?.module_pct || 0}%</td>
                        <td>{d ? (d.gen_today || 0).toFixed(1) : '—'}</td>
                        <td>{d ? schedTag(d.schedule_status) : '—'}</td>
                        <td className="text-muted text-sm">{d ? fmtDate(d.date) : 'No data'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety Summary */}
          <div className="card">
            <div className="fw-700 mb-16">Safety & HSE Summary</div>
            <div className="grid-3">
              {['None', 'Near Miss', 'First Aid', 'LTI'].map(type => {
                const count = dprs.filter(d => (d.safety || 'None') === type).length;
                return (
                  <div key={type} style={{
                    padding: '14px 18px', background: 'var(--surface2)',
                    border: `1px solid ${type !== 'None' && count > 0 ? 'rgba(248,81,73,0.3)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)'
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: type === 'None' ? 'var(--green)' : count > 0 ? 'var(--red)' : 'var(--text2)' }}>{count}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{type}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── EXPORTS TAB ── */}
      {activeTab === 'exports' && (
        <div className="grid-2">
          {[
            {
              icon: '📈', title: 'Progress Report',
              desc: 'Site-wise completion % for all work categories — civil, electrical, module, inverter.',
              fn: exportProgress, file: 'genedge_progress_report_YYYYMMDD.csv'
            },
            {
              icon: '👷', title: 'Manpower Report',
              desc: 'Daily headcount by category (civil, electrical, general, supervisors, sub-con) per site.',
              fn: exportManpower, file: 'genedge_manpower_report_YYYYMMDD.csv'
            },
            {
              icon: '⚡', title: 'Generation Report',
              desc: 'Day-wise generation, cumulative kWh, availability %, export, peak power, inverter status.',
              fn: exportGeneration, file: 'genedge_generation_report_YYYYMMDD.csv'
            },
            {
              icon: '⚠️', title: 'Issues / NCR Report',
              desc: 'All open issues with action-required party and priority level, from DPR records.',
              fn: exportIssues, file: 'genedge_issues_report_YYYYMMDD.csv'
            },
            {
              icon: '🗄️', title: 'Full DPR Data Dump',
              desc: 'Complete raw export of all DPR submissions — all fields, all sites, all dates.',
              fn: exportFullDPR, file: 'genedge_full_dpr_dump_YYYYMMDD.csv'
            },
          ].map(r => (
            <div key={r.title} className="card">
              <div style={{ fontSize: 28, marginBottom: 10 }}>{r.icon}</div>
              <div className="fw-700 mb-8">{r.title}</div>
              <div className="text-sm text-muted" style={{ marginBottom: 14 }}>{r.desc}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, fontFamily: 'monospace' }}>{r.file}</div>
              <button className="btn btn-outline btn-sm" onClick={r.fn} disabled={dprs.length === 0}>
                ⬇ Export CSV
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
