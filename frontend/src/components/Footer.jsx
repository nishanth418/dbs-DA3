import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="app-footer-left">
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Nexus Campus OS</span>
          <span className="app-footer-dot">·</span>
          <span>Enterprise Living & Facility Operations</span>
          <span className="app-footer-dot">·</span>
          <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>18 Relational Tables Live</span>
        </div>
        <div className="app-footer-links">
          <button
            type="button"
            className="app-footer-link"
            onClick={() => onNavigate && onNavigate('privacy')}
          >
            Privacy Policy
          </button>
          <span className="app-footer-dot">·</span>
          <button
            type="button"
            className="app-footer-link"
            onClick={() => onNavigate && onNavigate('terms')}
          >
            Terms of Service
          </button>
          <span className="app-footer-dot">·</span>
          <button
            type="button"
            className="app-footer-link"
            onClick={() => onNavigate && onNavigate('settings')}
          >
            System Diagnostics
          </button>
        </div>
      </div>
    </footer>
  );
}
