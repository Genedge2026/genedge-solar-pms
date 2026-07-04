import React, { useState, useEffect } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/pages/Dashboard';
import DPRForm from './components/pages/DPRForm';
import DPRLog from './components/pages/DPRLog';
import ManpowerPage from './components/pages/ManpowerPage';
import InventoryPage from './components/pages/InventoryPage';
import IssuesPage from './components/pages/IssuesPage';
import ReportsPage from './components/pages/ReportsPage';

// Nav items per role
const OFFICE_NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard',    section: 'Main' },
  { id: 'dpr',       icon: '📋', label: 'Submit DPR',   section: 'Main' },
  { id: 'dpr-log',   icon: '📁', label: 'DPR Records',  section: 'Main' },
  { id: 'manpower',  icon: '👷', label: 'Manpower',     section: 'Operations' },
  { id: 'inventory', icon: '📦', label: 'Inventory',    section: 'Operations' },
  { id: 'issues',    icon: '⚠️',  label: 'Issues / NCR', section: 'Operations' },
  { id: 'reports',   icon: '📈', label: 'Reports',      section: 'Admin' },
];

// Site users: ONLY DPR submit + DPR records
const SITE_NAV = [
  { id: 'dpr',      icon: '📋', label: 'Submit DPR',  section: 'DPR' },
  { id: 'dpr-log',  icon: '📁', label: 'My DPR Log',  section: 'DPR' },
];

function AppShell() {
  const { user, profile, loading, signOut } = useAuth();
  const [siteFilter, setSiteFilter] = useState('all');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isOffice = profile?.role === 'office';
  const NAV      = isOffice ? OFFICE_NAV : SITE_NAV;
  const [page, setPage] = useState(isOffice ? 'dashboard' : 'dpr');

  // keep default page in sync after profile loads
  useEffect(() => {
    if (profile) setPage(isOffice ? 'dashboard' : 'dpr');
  }, [profile, isOffice]);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (loading) return (
    <div className="spinner-wrap" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!user || !profile) return <LoginPage />;

  const initials = (profile.full_name || profile.email || 'U').slice(0, 2).toUpperCase();

  // Group nav by section label
  const sections = [...new Set(NAV.map(n => n.section))];

  const pageProps = { siteFilter, profile, isOffice };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div className="offline-banner">
          ⚡ You are offline — DPR entries saved locally and will sync when connection returns.
        </div>
      )}

      {/* ── Top Bar ── */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 20px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="flex gap-12">
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>⚡ Genedge Solar PMS</span>
          <span style={{
            fontSize: 11, background: 'var(--surface3)', border: '1px solid var(--border)',
            padding: '3px 10px', borderRadius: 20, color: 'var(--text2)',
          }}>Junagadh Cluster</span>
        </div>

        <div className="flex gap-12">
          {/* Office-only site filter */}
          {isOffice && (
            <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)}
              style={{ width: 160, padding: '5px 10px', fontSize: 12 }}>
              <option value="all">All Sites</option>
              <option value="Devkigalol">Devkigalol</option>
              <option value="Kanja">Kanja</option>
              <option value="Mendapara">Mendapara</option>
              <option value="Mandodara">Mandodara</option>
            </select>
          )}

          {/* User pill */}
          <div className="flex gap-8">
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              background: isOffice ? 'rgba(88,166,255,0.2)' : 'rgba(240,165,0,0.2)',
              color: isOffice ? 'var(--blue)' : 'var(--accent)',
            }}>{initials}</div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{profile.full_name || profile.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                {isOffice ? 'Office Admin' : `Site — ${profile.site}`}
              </div>
            </div>
            <span style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600, alignSelf: 'center',
              background: isOffice ? 'rgba(88,166,255,0.1)' : 'rgba(240,165,0,0.1)',
              color: isOffice ? 'var(--blue)' : 'var(--accent)',
              border: `1px solid ${isOffice ? 'rgba(88,166,255,0.3)' : 'rgba(240,165,0,0.3)'}`,
            }}>{isOffice ? 'Office Admin' : 'Site User'}</span>
          </div>

          <button className="btn btn-outline btn-sm" onClick={signOut}>Logout</button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Sidebar ── */}
        <nav style={{
          width: 220, background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '16px 0', flexShrink: 0,
        }}>
          {sections.map(section => (
            <div key={section} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
                letterSpacing: '0.8px', padding: '0 16px', marginBottom: 6,
              }}>{section}</div>
              {NAV.filter(n => n.section === section).map(item => (
                <div
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', cursor: 'pointer',
                    borderLeft: `3px solid ${page === item.id ? 'var(--accent)' : 'transparent'}`,
                    background: page === item.id ? 'rgba(240,165,0,0.06)' : 'transparent',
                    color: page === item.id ? 'var(--accent)' : 'var(--text2)',
                    fontSize: 13, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Site user info box at bottom */}
          {!isOffice && (
            <div style={{
              margin: '16px 12px 0', padding: '12px',
              background: 'rgba(240,165,0,0.06)',
              border: '1px solid rgba(240,165,0,0.2)',
              borderRadius: 'var(--radius)', fontSize: 12,
            }}>
              <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>📍 Your Site</div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.site}</div>
              <div style={{ color: 'var(--text3)', marginTop: 4, fontSize: 11 }}>
                You can submit DPR and view your records only.
              </div>
            </div>
          )}
        </nav>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* Office-only pages: guard at render level too */}
          {page === 'dashboard' && isOffice  && <Dashboard  {...pageProps} />}
          {page === 'dpr'                     && <DPRForm    {...pageProps} />}
          {page === 'dpr-log'                 && <DPRLog     {...pageProps} />}
          {page === 'manpower'  && isOffice  && <ManpowerPage  {...pageProps} />}
          {page === 'inventory' && isOffice  && <InventoryPage {...pageProps} />}
          {page === 'issues'    && isOffice  && <IssuesPage    {...pageProps} />}
          {page === 'reports'   && isOffice  && <ReportsPage   {...pageProps} />}

          {/* Fallback: if somehow a site user hits a restricted page */}
          {!isOffice && !['dpr', 'dpr-log'].includes(page) && (
            <div className="empty-state">
              <div className="empty-icon">🔒</div>
              <h3>Access Restricted</h3>
              <div>This section is available to office admin only.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
