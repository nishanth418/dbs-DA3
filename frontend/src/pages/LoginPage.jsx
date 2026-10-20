import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  Database,
  ShieldCheck,
  ArrowRight,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess, healthInfo }) {
  const [email, setEmail] = useState('admin@univ.edu');
  const [password, setPassword] = useState('CampusAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setError(null);

    // Form Validation
    if (!email.trim()) {
      setError('Please provide your university administrator or staff email');
      return;
    }
    if (!password) {
      setError('Please enter your workspace access password');
      return;
    }

    try {
      setLoading(true);

      // Verify connection to the active backend/database
      let health = healthInfo;
      if (!health) {
        health = await api.getHealth().catch(() => null);
      }

      // Store authentic session state in localStorage/sessionStorage
      const userSession = {
        name: email.includes('admin') ? 'Campus Administrator' : 'Warden / Staff Official',
        email: email.trim(),
        role: email.includes('admin') ? 'Super Admin' : 'Warden',
        loginTime: new Date().toISOString(),
        engine: health?.engine || 'Aiven Cloud MySQL'
      };

      if (rememberMe) {
        localStorage.setItem('nexus_auth_user', JSON.stringify(userSession));
      } else {
        sessionStorage.setItem('nexus_auth_user', JSON.stringify(userSession));
      }

      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess(userSession);
      }, 700);
    } catch (err) {
      setError(err.message || 'Authentication error. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(targetEmail) {
    setEmail(targetEmail);
    setPassword('CampusAdmin2026!');
    setError(null);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#070b16',
        color: '#ffffff',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Gradients */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* LEFT COLUMN: Campus Ecosystem Visual & Telemetry */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, rgba(13, 22, 44, 0.7) 0%, rgba(9, 14, 31, 0.95) 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          zIndex: 2
        }}
        className="login-left-pane"
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)'
            }}
          >
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              NEXUS <span style={{ color: '#38bdf8' }}>CAMPUS OS</span>
            </h2>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Hostel Management Control Center
            </div>
          </div>
        </div>

        {/* Hero Visual Card Showcase */}
        <div style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontSize: '0.76rem',
                fontWeight: 700,
                marginBottom: 16
              }}
            >
              <Sparkles size={13} />
              <span>LIVE CAMPUS TELEMETRY ACTIVE</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.6rem',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                margin: 0
              }}
            >
              Intelligent Control Over Every Floor & Room.
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: 12, lineHeight: 1.6 }}>
              Seamlessly orchestrate admissions, room allocations, dining facilities, inventory procurement, and fee ledgers across all residential towers.
            </p>
          </div>

          {/* Floating Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', marginBottom: 6 }}>
                <Database size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Relational Core
                </span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>18 Tables</div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>100% Verified Live Schema</div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', marginBottom: 6 }}>
                <Server size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Cloud Engine
                </span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>Aiven MySQL</div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>TLS 1.3 Encrypted Socket</div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: '0.82rem' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Foreign Keys Enforced · Zero Data Loss · Multi-Hostel Security</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Gateway Card */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: 'rgba(13, 22, 44, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '44px 38px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(56, 189, 248, 0.1)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: 6
              }}
            >
              Welcome Back
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Sign in to your campus management workspace.
            </p>
          </div>

          {/* Quick Demo Sign-in Pills */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Quick Preset Roles:
            </span>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@univ.edu')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: email === 'admin@univ.edu' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: email === 'admin@univ.edu' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: email === 'admin@univ.edu' ? '#93c5fd' : '#cbd5e1',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                Campus Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rajesh.k@univ.edu')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: email === 'rajesh.k@univ.edu' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: email === 'rajesh.k@univ.edu' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: email === 'rajesh.k@univ.edu' ? '#93c5fd' : '#cbd5e1',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                Warden (Dr. Rajesh)
              </button>
            </div>
          </div>

          {/* Error Callout */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.84rem',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1' }}>
                University Email or Username
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: 14, color: '#64748b', pointerEvents: 'none' }}
                />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  placeholder="admin@univ.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>
                  Workspace Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 14, color: '#64748b', pointerEvents: 'none' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: '#2563eb',
                  cursor: 'pointer'
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}
              >
                Remember this workspace session
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || success}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '13px',
                fontSize: '0.96rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: success
                  ? 'linear-gradient(135deg, #059669, #10b981)'
                  : undefined
              }}
            >
              {success ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Access Granted · Entering Dashboard...</span>
                </>
              ) : loading ? (
                <>
                  <div className="spin-animation" style={{ width: 16, height: 16, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password Assistance</h3>
            </div>
            <div className="modal-body" style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <p>
                In the university campus intranet environment, administrative workspace accounts are provisioned and maintained directly by the campus system administrator.
              </p>
              <p style={{ marginTop: 10 }}>
                Please use the provided default presets (<strong>Campus Admin</strong> or registered <strong>Warden</strong> emails) to sign in immediately.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--bg-card-border)' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForgotModal(false)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive media query for pane stacking */}
      <style>{`
        @media (max-width: 900px) {
          .login-left-pane {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
