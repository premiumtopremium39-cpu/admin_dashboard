import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Minus,
  Save,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getOptimizedImageUrl, FALLBACK_GARMENT_IMAGES } from '../utils/imageOptimizer';

export default function InventoryCounter({ products = [], onRefresh }) {
  const [localStock, setLocalStock] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', error: false });

  // Initialize or get current stock value
  const getStock = (p) => {
    return localStock[p.id] !== undefined ? localStock[p.id] : (p.stock || 0);
  };

  const handleAdjust = (productId, delta, currentVal) => {
    const newVal = Math.max(0, (localStock[productId] ?? currentVal) + delta);
    setLocalStock(prev => ({ ...prev, [productId]: newVal }));
  };

  const handleInputChange = (productId, value) => {
    const parsed = parseInt(value, 10);
    setLocalStock(prev => ({ ...prev, [productId]: isNaN(parsed) ? 0 : Math.max(0, parsed) }));
  };

  const handleSaveStock = async (product) => {
    const updatedQty = localStock[product.id];
    if (updatedQty === undefined) return;

    setUpdatingId(product.id);
    setFeedback({ text: '', error: false });

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: updatedQty })
        .eq('id', product.id);

      if (error) throw error;

      setFeedback({ text: `Stock successfully adjusted to ${updatedQty} units for "${product.title}"`, error: false });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setFeedback({ text: `Stock update failed: ${err.message}`, error: true });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVariantStockChange = async (product, colorIdx, newQty) => {
    try {
      const updatedColors = [...(product.colors || [])];
      updatedColors[colorIdx] = {
        ...updatedColors[colorIdx],
        stock: Math.max(0, newQty)
      };

      const newTotal = updatedColors.reduce((sum, c) => sum + Number(c.stock || 0), 0);

      const { error } = await supabase
        .from('products')
        .update({
          colors: updatedColors,
          stock: newTotal > 0 ? newTotal : product.stock
        })
        .eq('id', product.id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Variant stock update error: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Stat bar */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-gold)'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Live Stock Level Controls
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Adjust total warehouse count or individual color variant inventory in real time.
            </p>
          </div>
        </div>

        {feedback.text && (
          <div style={{
            fontSize: '13px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: feedback.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: feedback.error ? '#f87171' : '#34d399',
            border: `1px solid ${feedback.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
          }}>
            {feedback.text}
          </div>
        )}
      </div>

      {/* Inventory Items List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {products.map((p) => {
          const currentStock = getStock(p);
          const hasModified = localStock[p.id] !== undefined && localStock[p.id] !== p.stock;

          return (
            <div
              key={p.id}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '16px',
                border: currentStock <= 5 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-subtle)',
                background: currentStock <= 5 ? 'rgba(30, 18, 22, 0.6)' : 'rgba(18, 21, 28, 0.7)'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <img
                  src={getOptimizedImageUrl(p.image, 400)}
                  alt={p.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_GARMENT_IMAGES[p.id] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400';
                  }}
                  style={{
                    width: '64px',
                    height: '76px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    background: '#0a0c10',
                    border: '1px solid var(--border-subtle)'
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gold)', fontWeight: 600 }}>
                    ₹{Number(p.price).toLocaleString('en-IN')} • {p.category}
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <span className={`badge ${currentStock <= 5 ? 'badge-danger' : 'badge-gold'}`}>
                      {currentStock <= 0 ? 'Out of Stock' : `${currentStock} Total In Stock`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Master Counter Controls */}
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Total Units:
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleAdjust(p.id, -1, p.stock)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => handleInputChange(p.id, e.target.value)}
                    style={{
                      width: '60px',
                      height: '32px',
                      textAlign: 'center',
                      background: '#12151c',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '6px',
                      color: 'var(--text-gold)',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}
                  />

                  <button
                    onClick={() => handleAdjust(p.id, 1, p.stock)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                  </button>

                  <button
                    onClick={() => handleSaveStock(p)}
                    disabled={!hasModified || updatingId === p.id}
                    className="gold-btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      opacity: hasModified ? 1 : 0.4,
                      cursor: hasModified ? 'pointer' : 'default'
                    }}
                  >
                    <Save size={13} />
                    <span>{updatingId === p.id ? 'Syncing...' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* Color Breakdown per variant */}
              {Array.isArray(p.colors) && p.colors.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Stock by Color Variant
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {p.colors.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.02)',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: c.hex || '#ffffff',
                            border: '1px solid rgba(255,255,255,0.3)'
                          }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleVariantStockChange(p, idx, (c.stock || 0) - 1)}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.05)',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center', color: '#fff' }}>
                            {c.stock ?? 0}
                          </span>
                          <button
                            onClick={() => handleVariantStockChange(p, idx, (c.stock || 0) + 1)}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.05)',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
