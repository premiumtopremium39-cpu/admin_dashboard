import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';

export default function PromoCodesManagement({ promos = [], onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: 15,
    min_order_amount: 0,
    active: true,
    expires_at: ''
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePromo = async (promo) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active: !promo.active })
        .eq('id', promo.id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleDeletePromo = async (id, code) => {
    if (!window.confirm(`Delete coupon code "${code}"?`)) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        active: formData.active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      };

      const { error } = await supabase
        .from('promo_codes')
        .insert([payload]);

      if (error) throw error;

      confetti({ particleCount: 40, spread: 50 });
      setModalOpen(false);
      setFormData({
        code: '',
        type: 'percent',
        value: 15,
        min_order_amount: 0,
        active: true,
        expires_at: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create promo code');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-gold)'
          }}>
            <Tag size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Promotional Vouchers & Coupons
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Manage percentage and flat discount codes for customer checkout
            </p>
          </div>
        </div>

        <button onClick={() => setModalOpen(true)} className="gold-btn">
          <Plus size={16} />
          <span>Create New Promo</span>
        </button>
      </div>

      {/* Promos Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {promos.map((promo) => (
          <div
            key={promo.id}
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '16px',
              border: promo.active ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
              background: promo.active ? 'rgba(22, 25, 34, 0.75)' : 'rgba(15, 17, 23, 0.5)',
              opacity: promo.active ? 1 : 0.65,
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-gold)',
                letterSpacing: '0.05em',
                background: 'rgba(212,175,55,0.1)',
                padding: '4px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(212,175,55,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{promo.code}</span>
                <button
                  onClick={() => handleCopyCode(promo.code, promo.id)}
                  title="Copy Coupon"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-gold)', cursor: 'pointer' }}
                >
                  {copiedId === promo.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <button
                onClick={() => handleTogglePromo(promo)}
                className={`badge ${promo.active ? 'badge-success' : 'badge-danger'}`}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                {promo.active ? 'Active' : 'Disabled'}
              </button>
            </div>

            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
              {promo.type === 'percent' ? `${promo.value}% OFF` : `₹${promo.value} FLAT OFF`}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              {promo.min_order_amount > 0 ? `Minimum order: ₹${Number(promo.min_order_amount).toLocaleString('en-IN')}` : 'No minimum order required'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Used: {promo.usage_count || 0} times</span>
              <button
                onClick={() => handleDeletePromo(promo.id, promo.code)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade" style={{
            maxWidth: '460px',
            width: '100%',
            background: '#12151c',
            border: '1px solid var(--border-gold)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Issue New Promotional Coupon
            </h3>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '12px', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  PROMO CODE (UPPERCASE) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONACO20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="luxury-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    TYPE
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="luxury-select"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    VALUE *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="luxury-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  MINIMUM ORDER AMOUNT (INR ₹)
                </label>
                <input
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  className="luxury-input"
                  placeholder="0 for none"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="secondary-btn">Cancel</button>
                <button type="submit" disabled={saving} className="gold-btn">
                  {saving ? 'Creating...' : 'Activate Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
