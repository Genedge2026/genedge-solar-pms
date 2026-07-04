import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 20,
      background: 'radial-gradient(ellipse at top, #1a2332 0%, #0d1117 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>Genedge Solar PMS</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            Project Management System — Junagadh Cluster
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ marginBottom: 24, fontSize: 18 }}>Sign in to your account</h2>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@genedge.in"
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="alert-error" style={{ marginTop: 14 }}>{error}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: 20, padding: '12px 0', fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div style={{
          marginTop: 20, padding: '14px 18px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius2)', fontSize: 12, color: 'var(--text2)'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Access managed by office admin
          </div>
          <div>Site users and office admin accounts are created and managed by the Genedge office team via the Supabase dashboard.</div>
          <div style={{ marginTop: 6, color: 'var(--text3)' }}>
            Contact Er. Abhijeet Kumar for account access.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text3)' }}>
          Genedge Renewable Private Limited © 2026
        </div>
      </div>
    </div>
  );
}
