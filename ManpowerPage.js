import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDPRs } from '../../lib/hooks';
import { format, parseISO } from 'date-fns';

function fmtDate(d) {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d || '—'; }
}

export default function ManpowerPage({ siteFilter, isOffice }) {
  const [localFilter, setLocalFilter] = useState(siteFilter || 'all');
  const { dprs, loading } = useDPRs(localFilter);

  if (!isOffice) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Access Restricted</h3>
        <div>Manpower module is available to office admin only.</div>
      </div>
    );
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  // Aggregate stats
  const recent = dprs.slice(0, 30);
  const totalCivil = recent.reduce((a, d) => a + (d.mp_civil || 0), 0);
  const totalElec  = recent.reduce((a, d) => a + (d.mp_elec || 0), 0);
  const totalGen   = recent.reduce((a, d) => a + (d.mp_general || 0), 0);
  const totalSup   = recent.reduce((a, d) => a + (d.mp_supervisor || 0), 0);
  const totalSub   = recent.reduce((a, d) => a + (d.mp_subcon || 0), 0);
  const grandTotal = totalCivil + totalElec + totalGen + totalSup + totalSub;
  const avgPerDay  = dprs.length ? Math.round(grandTotal / Math.min(dprs.length, 30)) : 0;

  // Chart: last 7 unique dates
  const dateMap = {};
  recent.forEach(d => {
    if (!dateMap[d.date]) dateMap[d.date] = { date: d.date, civil: 0, elec: 0, general: 0, supervisor: 0, subcon: 0 };
    dateMap[d.date].civil      += d.mp_civil      || 0;
    dateMap[d.date].elec       += d.mp_elec       || 0;
    dateMap[d.date].general    += d.mp_general    || 0;
    dateMap[d.date].supervisor += d.mp_supervisor || 0;
    dateMap[d.date].subcon     += d.mp_subcon     || 0;
  });
  const chartData = Object.values(dateMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(d => ({ ...d, label: format(parseISO(d.date), 'dd/MM') }));

  const COLORS = { civil: '#f0a500', elec: '#58a6ff', general: '#3fb950', supervisor: '#bc8cff', subcon: '#ffa657' };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>Manpower Status</h1>
          <div className="text-muted mt-4">Daily headcount across Junagadh cluster sites</div>
        </div>
        <select value={localFilter} onChange={e => setLocalFilter(e.target.value)} style={{ width: 170 }}>
          <option value="all">All Sites</option>
          <option value="Devkigalol">Devkigalol</option>
          <option value="Kanja">Kanja</option>
          <option value="Mendapara">Mendapara</option>
          <option value="Mandodara">Mandodara</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Avg. Daily Manpower</div>
          <div className="stat-value">{avgPerDay}</div>
          <div className="stat-sub">persons / day</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Civil Workers</div>
          <div className="stat-value val-accent">{totalCivil}</div>
          <div className="stat-sub">cumulative</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Electrical Workers</div>
          <div className="stat-value val-blue">{totalElec}</div>
          <div className="stat-sub">cumulative</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">General Labour</div>
          <div className="stat-value val-green">{totalGen}</div>
          <div className="stat-sub">cumulative</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Supervisors</div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>{totalSup}</div>
          <div className="stat-sub">cumulative</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sub-contractor</div>
          <div className="stat-value val-accent">{totalSub}</div>
          <div className="stat-sub">cumulative</div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      {chartData.length > 0 && (
        <div className="card mb-24" style={{ marginBottom: 24 }}>
          <div className="fw-700 mb-16">7-Day Manpower Trend (by Category)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
              <Bar dataKey="civil"      stackId="a" fill={COLORS.civil}      name="Civil"        radius={[0,0,0,0]} />
              <Bar dataKey="elec"       stackId="a" fill={COLORS.elec}       name="Electrical"   radius={[0,0,0,0]} />
              <Bar dataKey="general"    stackId="a" fill={COLORS.general}    name="General"      radius={[0,0,0,0]} />
              <Bar dataKey="supervisor" stackId="a" fill={COLORS.supervisor} name="Supervisor"   radius={[0,0,0,0]} />
              <Bar dataKey="subcon"     stackId="a" fill={COLORS.subcon}     name="Sub-con."     radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="fw-700 mb-16">Site-wise Manpower Detail</div>
        {dprs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👷</div>
            <h3>No manpower data</h3>
            <div>Manpower data is submitted via DPR forms.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Site</th>
                  <th>Civil</th>
                  <th>Electrical</th>
                  <th>General</th>
                  <th>Supervisors</th>
                  <th>Sub-con.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {dprs.map(d => {
                  const tot = (d.mp_civil||0)+(d.mp_elec||0)+(d.mp_general||0)+(d.mp_supervisor||0)+(d.mp_subcon||0);
                  return (
                    <tr key={d.id}>
                      <td><strong>{fmtDate(d.date)}</strong></td>
                      <td>{d.site}</td>
                      <td>{d.mp_civil      || 0}</td>
                      <td>{d.mp_elec       || 0}</td>
                      <td>{d.mp_general    || 0}</td>
                      <td>{d.mp_supervisor || 0}</td>
                      <td>{d.mp_subcon     || 0}</td>
                      <td><strong style={{ color: 'var(--accent)' }}>{tot}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
