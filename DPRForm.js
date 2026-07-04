import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { SITE_NAMES } from '../../lib/supabase';

const today = new Date().toISOString().split('T')[0];

const INITIAL = {
  site: '', date: today, weather: 'Clear', reporter: '',
  // Civil
  piling_pct: 0, pcc_pct: 0, structure_pct: 0, piles_today: 0, piles_cum: 0, civil_remarks: '',
  // Module & Electrical
  module_pct: 0, dc_cable_pct: 0, ac_cable_pct: 0, inv_comm_pct: 0,
  modules_today: 0, modules_cum: 0, inv_commissioned: 0, elec_remarks: '',
  // Generation
  gen_today: 0, gen_cum: 0, availability: 0, export_kwh: 0, peak_kw: 0, inv_running: 0, inv_fault: 0,
  // Manpower
  mp_civil: 0, mp_elec: 0, mp_general: 0, mp_supervisor: 0, mp_subcon: 0,
  // Material
  material_received: '', material_shortage: '', equipment_onsite: '', equipment_issue: '',
  // Safety
  safety: 'None', tbt_conducted: 'Yes', safety_remarks: '',
  // Issues
  issues: '', action_from: 'None', priority: 'Normal',
  // Overall
  overall_pct: 0, schedule_status: 'On Track', plan_tomorrow: '', overall_remarks: '',
};

function RangeField({ label, id, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="range-group">
        <input type="range" min="0" max="100" value={value}
          onChange={e => onChange(id, parseInt(e.target.value))} />
        <span className="range-val">{value}%</span>
      </div>
    </div>
  );
}

function NumField({ label, id, value, onChange, step = 1 }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input type="number" min="0" step={step} value={value}
        onChange={e => onChange(id, parseFloat(e.target.value) || 0)} />
    </div>
  );
}

export default function DPRForm({ profile, isOffice }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...INITIAL, site: profile.role === 'site' ? profile.site : '', reporter: profile.full_name || '' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // {type, msg}

  function set(id, val) { setForm(f => ({ ...f, [id]: val })); }
  function setE(e) { set(e.target.name, e.target.value); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.site) { setStatus({ type: 'error', msg: 'Please select a site.' }); return; }
    if (!form.date)  { setStatus({ type: 'error', msg: 'Please select a date.' });  return; }

    setSubmitting(true);
    setStatus(null);

    const payload = {
      ...form,
      submitted_by: user.id,
      submitted_by_name: profile.full_name || profile.email,
    };

    const { error } = await supabase.from('dprs').insert([payload]);
    setSubmitting(false);

    if (error) {
      setStatus({ type: 'error', msg: `Submit failed: ${error.message}` });
    } else {
      setStatus({ type: 'success', msg: `✅ DPR submitted successfully for ${form.site} — ${form.date}` });
      setForm({ ...INITIAL, site: profile.role === 'site' ? profile.site : '', reporter: profile.full_name || '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>Daily Project Review (DPR)</h1>
          <div className="text-muted mt-4">Fill complete daily progress for your site</div>
        </div>
      </div>

      {status && (
        <div className={`alert-${status.type} mb-16`} style={{ marginBottom: 16 }}>{status.msg}</div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── SECTION 1: BASIC INFO ── */}
        <div className="card form-section">
          <div className="form-section-title">📅 Basic Information</div>
          <div className="form-row">
            <div className="form-group">
              <label>Site *</label>
              {isOffice ? (
                <select name="site" value={form.site} onChange={setE} required>
                  <option value="">-- Select Site --</option>
                  {SITE_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" value={form.site} readOnly
                  style={{ background: 'var(--surface3)', cursor: 'not-allowed' }} />
              )}
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="date" value={form.date} onChange={setE} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Weather Condition</label>
              <select name="weather" value={form.weather} onChange={setE}>
                <option value="Clear">☀️ Clear / Sunny</option>
                <option value="Partly Cloudy">⛅ Partly Cloudy</option>
                <option value="Cloudy">☁️ Cloudy</option>
                <option value="Rainy">🌧️ Rainy</option>
                <option value="Foggy">🌫️ Foggy</option>
                <option value="Storm">⛈️ Storm / High Wind</option>
              </select>
            </div>
            <div className="form-group">
              <label>Report Prepared By</label>
              <input type="text" name="reporter" value={form.reporter} onChange={setE}
                placeholder="Name of engineer / supervisor" />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: CIVIL WORKS ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">🏗️ Civil Works Progress</div>
          <div className="form-row-3">
            <RangeField label="Piling Work (%)"          id="piling_pct"    value={form.piling_pct}    onChange={set} />
            <RangeField label="Foundation / PCC (%)"     id="pcc_pct"       value={form.pcc_pct}       onChange={set} />
            <RangeField label="Structure Erection (%)"   id="structure_pct" value={form.structure_pct} onChange={set} />
          </div>
          <div className="form-row">
            <NumField label="Piles Completed Today (nos.)"       id="piles_today" value={form.piles_today} onChange={set} />
            <NumField label="Total Piles Completed (cumulative)" id="piles_cum"   value={form.piles_cum}   onChange={set} />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Civil Works Remarks</label>
            <textarea name="civil_remarks" value={form.civil_remarks} onChange={setE}
              placeholder="Any delays, soil conditions, notes about civil works..." />
          </div>
        </div>

        {/* ── SECTION 3: MODULE & ELECTRICAL ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">🔆 Module Mounting & Electrical</div>
          <div className="form-row-3">
            <RangeField label="Module Mounting (%)"       id="module_pct"    value={form.module_pct}    onChange={set} />
            <RangeField label="DC Cabling (%)"            id="dc_cable_pct"  value={form.dc_cable_pct}  onChange={set} />
            <RangeField label="AC Cabling (%)"            id="ac_cable_pct"  value={form.ac_cable_pct}  onChange={set} />
          </div>
          <div className="form-row">
            <NumField label="Modules Installed Today (nos.)"       id="modules_today" value={form.modules_today} onChange={set} />
            <NumField label="Total Modules Installed (cumulative)" id="modules_cum"   value={form.modules_cum}   onChange={set} />
          </div>
          <div className="form-row">
            <RangeField label="Inverter Commissioning (%)" id="inv_comm_pct"     value={form.inv_comm_pct}    onChange={set} />
            <NumField   label="Inverters Commissioned (nos.)" id="inv_commissioned" value={form.inv_commissioned} onChange={set} />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Electrical Works Remarks</label>
            <textarea name="elec_remarks" value={form.elec_remarks} onChange={setE}
              placeholder="Inverter status, cable laying, stringing progress, termination status..." />
          </div>
        </div>

        {/* ── SECTION 4: GENERATION ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">⚡ Generation Data (if plant operational)</div>
          <div className="form-row-3">
            <NumField label="Today's Generation (kWh)"    id="gen_today"    value={form.gen_today}    onChange={set} step={0.1} />
            <NumField label="Cumulative Generation (kWh)" id="gen_cum"      value={form.gen_cum}      onChange={set} step={0.1} />
            <NumField label="Plant Availability (%)"      id="availability" value={form.availability} onChange={set} step={0.1} />
          </div>
          <div className="form-row-3">
            <NumField label="Grid Export (kWh)"       id="export_kwh" value={form.export_kwh} onChange={set} step={0.1} />
            <NumField label="Peak Power Achieved (kW)" id="peak_kw"    value={form.peak_kw}    onChange={set} step={0.1} />
            <div />
          </div>
          <div className="form-row">
            <NumField label="Inverters Running (nos.)" id="inv_running" value={form.inv_running} onChange={set} />
            <NumField label="Inverters in Fault (nos.)" id="inv_fault"  value={form.inv_fault}   onChange={set} />
          </div>
        </div>

        {/* ── SECTION 5: MANPOWER ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">👷 Manpower on Site</div>
          <div className="form-row-3">
            <NumField label="Civil Workers"           id="mp_civil"      value={form.mp_civil}      onChange={set} />
            <NumField label="Electrical Workers"      id="mp_elec"       value={form.mp_elec}       onChange={set} />
            <NumField label="General Labour"          id="mp_general"    value={form.mp_general}    onChange={set} />
          </div>
          <div className="form-row">
            <NumField label="Supervisors / Engineers" id="mp_supervisor" value={form.mp_supervisor} onChange={set} />
            <NumField label="Sub-contractor Personnel" id="mp_subcon"    value={form.mp_subcon}     onChange={set} />
          </div>
        </div>

        {/* ── SECTION 6: MATERIAL & EQUIPMENT ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">🚛 Material & Equipment Status</div>
          <div className="form-row">
            <div className="form-group">
              <label>Material Received Today</label>
              <textarea name="material_received" value={form.material_received} onChange={setE}
                placeholder="e.g. 200 nos. modules lot-3, 2 rolls AC cable 240sqmm..." rows={2} />
            </div>
            <div className="form-group">
              <label>Material Shortage / Pending</label>
              <textarea name="material_shortage" value={form.material_shortage} onChange={setE}
                placeholder="Any material pending from store / office..." rows={2} />
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Equipment on Site</label>
              <textarea name="equipment_onsite" value={form.equipment_onsite} onChange={setE}
                placeholder="e.g. 1 Pile driver, 1 JCB, 2 cranes..." rows={2} />
            </div>
            <div className="form-group">
              <label>Equipment Breakdown / Issues</label>
              <textarea name="equipment_issue" value={form.equipment_issue} onChange={setE}
                placeholder="Any equipment downtime, hours lost..." rows={2} />
            </div>
          </div>
        </div>

        {/* ── SECTION 7: SAFETY ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">🦺 Safety & HSE</div>
          <div className="form-row">
            <div className="form-group">
              <label>Safety Incidents Today</label>
              <select name="safety" value={form.safety} onChange={setE}>
                <option value="None">✅ No incident</option>
                <option value="Near Miss">⚠️ Near miss</option>
                <option value="First Aid">🩹 First Aid case</option>
                <option value="LTI">🚨 LTI (Lost Time Injury)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Toolbox Talk Conducted?</label>
              <select name="tbt_conducted" value={form.tbt_conducted} onChange={setE}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Safety Remarks / Incident Details</label>
            <textarea name="safety_remarks" value={form.safety_remarks} onChange={setE}
              placeholder="Safety observations, PPE compliance, incident details if any..." />
          </div>
        </div>

        {/* ── SECTION 8: ISSUES / SNAGS ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">⚠️ Issues, Snags & Action Required</div>
          <div className="form-group">
            <label>Open Issues / Observations</label>
            <textarea name="issues" value={form.issues} onChange={setE} rows={3}
              placeholder="List all current issues, NCRs, open snags requiring attention..." />
          </div>
          <div className="form-row" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Action Required From</label>
              <select name="action_from" value={form.action_from} onChange={setE}>
                <option value="None">-- No pending action --</option>
                <option value="Office">Office / PMO</option>
                <option value="Store">Store / Procurement</option>
                <option value="OEM">OEM / Vendor</option>
                <option value="Client">Client / Utility</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={setE}>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── SECTION 9: OVERALL ASSESSMENT ── */}
        <div className="card form-section" style={{ marginTop: 14 }}>
          <div className="form-section-title">📝 Overall Assessment</div>
          <div className="form-row">
            <RangeField label="Overall Site Progress (%)" id="overall_pct" value={form.overall_pct} onChange={set} />
            <div className="form-group">
              <label>Schedule Status</label>
              <select name="schedule_status" value={form.schedule_status} onChange={setE}>
                <option value="On Track">✅ On Track</option>
                <option value="Slightly Delayed">⚠️ Slightly Delayed</option>
                <option value="Delayed">🔴 Delayed</option>
                <option value="Ahead">🟢 Ahead of Schedule</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Plan for Tomorrow</label>
            <textarea name="plan_tomorrow" value={form.plan_tomorrow} onChange={setE} rows={3}
              placeholder="Key activities planned for tomorrow..." />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Engineer / Supervisor Overall Remarks</label>
            <textarea name="overall_remarks" value={form.overall_remarks} onChange={setE} rows={3}
              placeholder="Overall observations, highlights, concerns, coordination notes..." />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-12" style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}
            style={{ fontSize: 15, padding: '12px 28px' }}>
            {submitting ? 'Submitting...' : '✓ Submit DPR'}
          </button>
          <button type="button" className="btn btn-outline"
            onClick={() => setForm({ ...INITIAL, site: profile.role === 'site' ? profile.site : '', reporter: profile.full_name || '' })}>
            Clear Form
          </button>
        </div>

        {status && (
          <div className={`alert-${status.type}`} style={{ marginTop: 14 }}>{status.msg}</div>
        )}
      </form>
    </div>
  );
}
