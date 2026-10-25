import React, { useState } from 'react';
import {
  Bell,
  Search,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Header({ title, subtitle, onRefresh, refreshing, onSearch, searchQuery }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'New High-Value Order Placed', desc: '₹14,990 • Order #ORD-84920 by Julian Vance', time: '10m ago', unread: true },
    { id: 2, title: 'Low Inventory Alert', desc: 'Sardinia Sky Blue Linen Shirt has only 3 units left', time: '1h ago', alert: true },
    { id: 3, title: 'Supabase Realtime Sync', desc: 'Live listeners active for products & orders', time: 'Just now', info: true },
  ];

  return (
    <header style={{
      height: 'var(--header-height)',
      position: 'sticky',
      top: 0,
      background: 'rgba(10, 12, 16, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 40
    }}>
      {/* Title & Context */}
      <div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Global Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Universal Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="luxury-input"
            style={{ paddingLeft: '38px', paddingRight: '12px', height: '40px', fontSize: '13px' }}
            placeholder="Search orders, garments, SKUs..."
            value={searchQuery || ''}
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        {/* Live Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="secondary-btn"
            style={{ height: '40px', padding: '0 14px' }}
            title="Refresh database records"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span style={{ fontSize: '13px' }}>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}

        {/* Notification Bell with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-gold)',
              boxShadow: '0 0 8px var(--accent-gold)'
            }} />
          </button>

          {showNotifications && (
            <div className="glass-panel animate-fade" style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '320px',
              padding: '16px',
              background: '#12151c',
              border: '1px solid var(--border-gold)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>System Notifications</span>
                <span style={{ fontSize: '11px', color: 'var(--text-gold)', cursor: 'pointer' }} onClick={() => setShowNotifications(false)}>Dismiss</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: n.alert ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid ' + (n.alert ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-subtle)')
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: n.alert ? '#f87171' : 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.time}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
