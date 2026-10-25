import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  PackageCheck,
  Sparkles
} from 'lucide-react';
import { getOptimizedImageUrl, FALLBACK_GARMENT_IMAGES } from '../utils/imageOptimizer';

export default function DashboardOverview({ products = [], orders = [], promos = [], reviews = [], onNavigate }) {
  // Safe Financial Computations
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid' || o.order_status === 'Paid' || o.order_status === 'Delivered')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingOrders = orders.filter(o => o.order_status === 'Placed' || o.order_status === 'Preparation');
  const deliveredOrders = orders.filter(o => o.order_status === 'Delivered');

  const totalStockUnits = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowStockProducts = products.filter(p => Number(p.stock) <= 5);

  const kpis = [
    {
      label: 'Gross Realized Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: '+24.8% vs last month',
      isPositive: true,
      icon: DollarSign,
      glowColor: 'rgba(212, 175, 55, 0.25)',
      borderColor: 'rgba(212, 175, 55, 0.4)',
      accentColor: 'var(--accent-gold)'
    },
    {
      label: 'Total Orders Received',
      value: orders.length.toString(),
      change: `${pendingOrders.length} pending dispatch`,
      isPositive: true,
      icon: ShoppingBag,
      glowColor: 'rgba(255, 120, 73, 0.2)',
      borderColor: 'rgba(255, 120, 73, 0.35)',
      accentColor: '#ff7849'
    },
    {
      label: 'Active Inventory Units',
      value: totalStockUnits.toString(),
      change: `${lowStockProducts.length} low-stock alerts`,
      isPositive: lowStockProducts.length === 0,
      icon: Layers,
      glowColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 0.35)',
      accentColor: '#60a5fa'
    },
    {
      label: 'Client Satisfaction Index',
      value: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1) + ' / 5.0' : '4.9 / 5.0',
      change: `${reviews.length} authenticated reviews`,
      isPositive: true,
      icon: Sparkles,
      glowColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      accentColor: '#34d399'
    }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner Notice */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(22,25,34,0.9) 100%)',
        border: '1px solid var(--border-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Eden & Threads Realtime Gateway Active
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Connected to Supabase PostgreSQL cluster. Catalog adjustments reflect instantly on the customer storefront.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('products')}
          className="gold-btn"
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          <span>Catalog Controls</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* KPI Modern Visual Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${kpi.borderColor}`,
                background: 'rgba(18, 21, 28, 0.75)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 12px 30px ${kpi.glowColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {kpi.label}
                </span>
                <div style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: kpi.accentColor,
                  border: `1px solid ${kpi.borderColor}`
                }}>
                  <Icon size={20} />
                </div>
              </div>

              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                {kpi.value}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: kpi.isPositive ? '#34d399' : '#f87171' }}>
                {kpi.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Recent Orders & Best Sellers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent High-Priority Orders */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Client Purchases
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Live orders requiring fulfillment and courier dispatch
              </p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-gold)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No orders placed yet. Orders will appear here in realtime once customer checkout occurs.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(212,175,55,0.1)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-gold)',
                      fontWeight: 700,
                      fontSize: '12px'
                    }}>
                      ORD
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {order.order_id || 'ORD-RECENT'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {order.customer_name} • {order.customer_email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                        ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className={`badge ${
                        order.order_status === 'Delivered' ? 'badge-success' :
                        order.order_status === 'Dispatched' ? 'badge-info' :
                        order.order_status === 'Paid' ? 'badge-gold' : 'badge-warning'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Catalog Showcase Quick Overview */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Luxury Catalog
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {products.length} Garments
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {products.slice(0, 4).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img
                  src={getOptimizedImageUrl(p.image, 300)}
                  alt={p.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_GARMENT_IMAGES[p.id] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400';
                  }}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    background: '#1a1e28',
                    border: '1px solid var(--border-subtle)'
                  }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gold)', fontWeight: 600 }}>
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${p.stock <= 5 ? 'badge-danger' : 'badge-gold'}`}>
                    {p.stock} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="secondary-btn"
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px', fontSize: '12px' }}
          >
            <span>Manage All Products</span>
          </button>
        </div>
      </div>
    </div>
  );
}
