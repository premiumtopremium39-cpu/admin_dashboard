import React, { useState } from 'react';
import {
  Star,
  Trash2,
  CheckCircle,
  Filter,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export default function ClientReviewsManagement({ reviews = [], products = [], onRefresh }) {
  const [filterRating, setFilterRating] = useState('All');
  const [selectedProductId, setSelectedProductId] = useState('All'); // 'All' or specific product id

  const handleDeleteReview = async (id, author) => {
    if (!window.confirm(`Are you sure you want to delete this review by "${author}"? It will be removed immediately from both Supabase and the main storefront.`)) return;

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Delete review failed: ${err.message}`);
    }
  };

  const handleToggleVerified = async (review) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ verified: !review.verified })
        .eq('id', review.id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const getProductObj = (productId) => {
    return products.find(prod => String(prod.id) === String(productId)) || null;
  };

  // Group review counts per product
  const productReviewCounts = products.reduce((acc, p) => {
    acc[p.id] = reviews.filter(r => String(r.product_id) === String(p.id)).length;
    return acc;
  }, {});

  // Filter reviews by rating AND selected product
  const filteredReviews = reviews.filter((r) => {
    if (filterRating !== 'All' && String(r.rating) !== String(filterRating)) return false;
    if (selectedProductId !== 'All' && String(r.product_id) !== String(selectedProductId)) return false;
    return true;
  });

  const selectedProduct = selectedProductId !== 'All' ? getProductObj(selectedProductId) : null;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Top Moderation Control Bar */}
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
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-gold)'
          }}>
            <Star size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Client Feedback Moderation & Garment Catalog
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Inspect customer feedback per garment, moderate ratings, and delete unsatisfactory entries in real-time.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="luxury-select"
            style={{ width: '150px', height: '38px', fontSize: '12px' }}
          >
            <option value="All">All Star Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars & Lower</option>
          </select>
        </div>
      </div>

      {/* 2. Interactive Product Cards Grid (Click to Filter by Garment) */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} /> FILTER REVIEWS BY GARMENT ({products.length} PRODUCTS)
          </div>
          {selectedProductId !== 'All' && (
            <button
              onClick={() => setSelectedProductId('All')}
              style={{
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid var(--border-gold)',
                color: 'var(--text-gold)',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Show All Products ({reviews.length} reviews)
            </button>
          )}
        </div>

        {/* Horizontal scrollable / grid of product cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '12px'
        }}>
          {/* "All Garments" Tile */}
          <div
            onClick={() => setSelectedProductId('All')}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: selectedProductId === 'All' ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              backgroundColor: selectedProductId === 'All' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-gold)'
            }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>All Garments</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{reviews.length} total reviews</div>
            </div>
          </div>

          {/* Individual Products Tiles */}
          {products.map((p) => {
            const isSelected = String(selectedProductId) === String(p.id);
            const count = productReviewCounts[p.id] || 0;
            const imgSrc = getOptimizedImageUrl(p.image, 100);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#1a1f26',
                  flexShrink: 0,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <img
                    src={imgSrc}
                    alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=100';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isSelected ? 'var(--text-gold)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: '11px', color: count > 0 ? 'var(--accent-gold)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={11} fill={count > 0 ? 'var(--accent-gold)' : 'none'} /> {count} {count === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Filtered Customer Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Showing {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}
            {selectedProduct && <span> for <strong style={{ color: 'var(--text-gold)' }}>{selectedProduct.title}</strong></span>}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>No customer reviews found for this selection.</p>
            {selectedProductId !== 'All' && (
              <button
                onClick={() => setSelectedProductId('All')}
                className="secondary-btn"
                style={{ fontSize: '12px', marginTop: '8px' }}
              >
                Reset Filter to All Garments
              </button>
            )}
          </div>
        ) : (
          filteredReviews.map((r) => {
            const prod = getProductObj(r.product_id);
            const prodImg = prod ? getOptimizedImageUrl(prod.image, 100) : null;

            return (
              <div
                key={r.id}
                className="glass-panel"
                style={{
                  padding: '20px 24px',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: '4px solid var(--accent-gold)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    {/* Garment thumbnail preview */}
                    {prodImg && (
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#1a1f26',
                        flexShrink: 0,
                        border: '1px solid var(--border-gold)'
                      }}>
                        <img
                          src={prodImg}
                          alt={prod?.title || ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=100';
                          }}
                        />
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={15}
                              fill={star <= r.rating ? 'var(--accent-gold)' : 'none'}
                              color={star <= r.rating ? 'var(--accent-gold)' : 'var(--text-muted)'}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                          "{r.title}"
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-gold)', fontWeight: 600 }}>
                        {prod ? prod.title : `Product #${r.product_id}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleToggleVerified(r)}
                      className={`badge ${r.verified ? 'badge-success' : 'badge-warning'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Toggle verified buyer status"
                    >
                      {r.verified ? 'Verified Purchaser' : 'Pending Verification'}
                    </button>

                    <button
                      onClick={() => handleDeleteReview(r.id, r.author)}
                      className="danger-btn"
                      style={{ padding: '7px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      title="Permanently delete unsatisfactory review (Reflects immediately on main storefront)"
                    >
                      <Trash2 size={13} /> Delete Review
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', margin: '4px 0' }}>
                  "{r.comment}"
                </p>

                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    Review by <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.author}</span>
                    {r.created_at && ` • ${new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>
                    Product ID: {r.product_id}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
