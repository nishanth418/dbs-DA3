import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function StatCard({ title, value, subtext, icon: Icon, color = '#3b82f6', gradient, trend }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(14px)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--bg-card-border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Background Accent Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: color,
          opacity: 0.1,
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-secondary)'
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: `${color}18`,
            border: `1px solid ${color}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}
        >
          {trend && (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700 }}>
              <TrendingUp size={12} />
              {trend}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      </div>
    </div>
  );
}
