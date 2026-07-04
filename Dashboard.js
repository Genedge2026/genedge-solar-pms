import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLatestDPRs, useDPRs } from '../../lib/hooks';
import { SITES, SITE_NAMES } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';

function schedTag(s) {
  const map = { 'On Track': 'tag-green', 'Slightly Delayed': 'tag-amber', 'Delayed': 'tag-red', 'Ahead': 'tag-blue' };
  return <span className={`tag ${map[s] || 'tag-gray'}`}>{s}</span>;
}

function fmtDate(d) {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

export default function Dashboard({ siteFilter, profile, isOffice }) {
  const { latest, loading: lLoading } = useLatestDPRs();
  const { dprs, loading: dLoading } = useDPRs(siteFilter);

  if (lLoading || dLoading) return <div className="spinner-wrap"><div className="spinner"></div></div>;

  const sitesToShow = isOffice
    ? (siteFilter === 'all' ? SITE_NAMES : [siteFilter])
    : [profile.site];

  const allLatest = sitesToShow.map(s => latest[s]).filter(Boolean);

  const totalCap    = sitesToShow.reduce((a, s) => a + (SITES[s]?.capacity || 0), 0);
  const avgPct      = allLatest.length ? Math.round(allLatest.reduce((a, d) => a + (d.overall_pct || 0), 0) / allLatest.length) : 0;
  const totalGen    = allLatest.reduce((a, d) => a + (d.gen_today || 0), 0);
  const totalMP     = allLatest.reduce((a, d) => a + (d.mp_civil||0)+(d.mp_elec||0)+(d.mp_general||0)+(d.mp_supervisor||0)+(d.mp_subcon||0), 0);
  const openIssues  = dprs.filter(d => d.issues && d.issues.trim()).length;
  const safetyInc   = dprs.filter(d => d.safety && d.safety !== 'None').length;

  // Generation chart data
  const genData = sitesToShow.map(s => ({
    name: s.substring(0, 5),
    gen: parseFloat((latest[s]?.gen_today || 0).toFixed(1)),
    capacity: SITES[s]?.capacity || 0,
  }));

  // Last 7 days trend
  const trendMap = {};
  dprs.slice(0, 28).forEach(d => {
    if (!trendMap[d.date]) trendMap[d.date] = { date: d.date, gen: 0, mp: 0, count: 0 };
    trendMap[d.date].gen += d.gen_today || 0;
    trendMap[d.date].mp  += (d.mp_civil||0)+(d.mp_elec||0)+(d.mp_general||0)+(d.mp_supervisor||0)+(d.mp_subcon||0);
    trendMap[d.date].count++;
  });
  const trendData = Object.values(trendMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(d => ({ ...d, date: format(parseISO(d.date), 'dd/MM'), gen: parseFloat(d.gen.toFixed(0)) }));

  const recentDPRs = dprs.slice(0, 6);

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-24">
        <div>
          <h1>{isOffice ? 'Cluster Dashboard — Junagadh' : `${profile.site} — Site Dashboard`}</h1>
          <div className="text-muted mt-4">Live project status · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        {allLatest[0] && (
          <div className="text-xs text-muted">Last DPR: {fmtDate(allLatest[0].date)}</div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Cluster Capacity</div>
          <div className="stat-value val-accent">{totalCap.toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text2)' }}>MWp</span></div>
          <div className="stat-sub">{sitesToShow.length} site{sitesToShow.length > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Progress</div>
          <div className={`stat-value ${avgPct >= 80 ? 'val-green' : avgPct >= 50 ? 'val-accent' : 'val-red'}`}>{avgPct}%</div>
          <div className="stat-sub">Overall completion</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Generation</div>
          <div className="stat-value val-blue">{totalGen.toFixed(0)} <span style={{ fontSize: 14, color: 'var(--text2)' }}>kWh</span></div>
          <div className="stat-sub">Cluster total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Manpower Today</div>
          <div className="stat-value">{totalMP}</div>
          <div className="stat-sub">Persons on site</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">DPR Records</div>
          <div className="stat-value">{dprs.length}</div>
          <div className="stat-sub">Total submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Issues</div>
          <div className={`stat-value ${openIssues > 0 ? 'val-red' : 'val-green'}`}>{openIssues}</div>
          <div className="stat-sub">{safetyInc > 0 ? `${safetyInc} safety incident(s)` : 'No safety incidents'}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-24">
        {/* Site Progress Bars */}
        <div className="card">
          <div className="fw-700 mb-16">Site-wise Progress</div>
          {sitesToShow.map(site => {
            const d = latest[site];
            const pct = d?.overall_pct || 0;
            const cls = pct >= 80 ? 'prog-green' : pct >= 50 ? 'prog-amber' : 'prog-red';
            return (
              <div key={site} style={{ marginBottom: 16 }}>
                <div className="flex-between text-sm mb-8">
                  <span className="fw-600">{site}</span>
                  <span className="text-muted">{pct}% — {SITES[site]?.capacity}MWp</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }}></div>
                </div>
                <div className="text-xs mt-4" style={{ color: 'var(--text3)' }}>
                  {d ? `${fmtDate(d.date)} · ` : 'No DPR yet'}
                  {d && schedTag(d.schedule_status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Generation Bar Chart */}
        <div className="card">
          <div className="fw-700 mb-16">Today's Generation (kWh)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={genData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)' }}
                itemStyle={{ color: 'var(--blue)' }}
              />
              <Bar dataKey="gen" fill="var(--blue)" radius={[4, 4, 0, 0]} name="Generation kWh" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend + Recent DPRs */}
      <div className="grid-2 mb-24">
        {/* 7-day Generation Trend */}
        <div className="card">
          <div className="fw-700 mb-16">7-Day Generation Trend (kWh)</div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Line type="monotone" dataKey="gen" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} name="kWh" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted text-sm" style={{ padding: '40px 0', textAlign: 'center' }}>No trend data yet</div>
          )}
        </div>

        {/* Recent DPR Submissions */}
        <div className="card">
          <div className="fw-700 mb-16">Recent DPR Submissions</div>
          {recentDPRs.length === 0 ? (
            <div className="text-muted text-sm">No DPR records yet.</div>
          ) : (
            recentDPRs.map(d => {
              const mp = (d.mp_civil||0)+(d.mp_elec||0)+(d.mp_general||0)+(d.mp_supervisor||0)+(d.mp_subcon||0);
              return (
                <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex-between">
                    <div>
                      <div className="fw-600 text-sm">{d.site} — {fmtDate(d.date)}</div>
                      <div className="text-xs text-muted mt-4">Progress: {d.overall_pct}% · Gen: {(d.gen_today||0).toFixed(0)} kWh · MP: {mp}</div>
                    </div>
                    {schedTag(d.schedule_status)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Open Issues */}
      {isOffice && (
        <div className="card">
          <div className="fw-700 mb-16">⚠️ Open Issues Requiring Action</div>
          {dprs.filter(d => d.issues && d.issues.trim()).slice(0, 5).length === 0 ? (
            <div className="text-muted text-sm">No open issues. ✅</div>
          ) : (
            dprs.filter(d => d.issues && d.issues.trim()).slice(0, 5).map(d => (
              <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="flex-between mb-4">
                  <span className="text-xs text-muted">{d.site} · {fmtDate(d.date)}</span>
                  <span className={`tag ${d.priority === 'Critical' ? 'tag-red' : d.priority === 'High' ? 'tag-amber' : 'tag-gray'}`}>{d.priority}</span>
                </div>
                <div style={{ fontSize: 13 }}>{d.issues?.substring(0, 120)}{d.issues?.length > 120 ? '...' : ''}</div>
                {d.action_from && d.action_from !== 'None' && (
                  <div className="text-xs mt-4" style={{ color: 'var(--orange)' }}>Action from: {d.action_from}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
