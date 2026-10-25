import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  ClipboardList,
  Tag,
  Star,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, counts = {} }) {
  const { signOut, user, profile } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Product Catalog', icon: ShoppingBag, count: counts.products },
    { id: 'inventory', label: 'Inventory & Stock', icon: Layers, alert: counts.lowStock > 0 },
    { id: 'orders', label: 'Customer Orders', icon: ClipboardList, count: counts.pendingOrders },
    { id: 'promotions', label: 'Promo Coupons', icon: Tag, count: counts.promos },
    { id: 'reviews', label: 'Client Reviews', icon: Star, count: counts.reviews },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'linear-gradient(180deg, #10131a 0%, #090b0e 100%)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #d4af37 0%, #997819 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
          color: '#0a0c10',
          fontWeight: 800,
          fontSize: '18px',
          fontFamily: 'var(--font-serif)'
        }}>
          E
        </div>
        <div>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            color: 'var(--text-primary)'
          }}>
            EDEN & THREADS
          </h1>
          <span style={{
            fontSize: '10px',
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 600
          }}>
            Haute Couture Admin
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '16px 12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '8px 12px 4px'
        }}>
          Main Administration
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.03) 100%)'
                  : 'transparent',
                color: isActive ? 'var(--text-gold)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color={isActive ? 'var(--accent-gold)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {item.count !== undefined && item.count > 0 && (
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                    color: isActive ? '#0a0c10' : 'var(--text-secondary)'
                  }}>
                    {item.count}
                  </span>
                )}
                {item.alert && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--status-danger)',
                    boxShadow: '0 0 6px var(--status-danger)'
                  }} />
                )}
                {isActive && <ChevronRight size={14} color="var(--accent-gold)" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Customer Store Link */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(212,175,55,0.06)',
            border: '1px solid rgba(212,175,55,0.18)',
            color: 'var(--text-gold)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.06)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} />
            <span>View Live Storefront</span>
          </div>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2b3040 0%, #151821 100%)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-gold)',
            fontWeight: 600,
            fontSize: '13px'
          }}>
            {(profile?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>
              {profile?.full_name || 'Administrator'}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>
              {user?.email}
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          title="Sign out of Admin Session"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
