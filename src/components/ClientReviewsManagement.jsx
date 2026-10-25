import React, { useState } from 'react';
import {
  Star,
  Trash2,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ClientReviewsManagement({ reviews = [], products = [], onRefresh }) {
  const [filterRating, setFilterRating] = useState('All');

  const handleDeleteReview = async (id, author) => {
    if (!window.confirm(`Permanently remove review by "${author}"?`)) return;

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

  const getProductTitle = (productId) => {
    const p = products.find(prod => String(prod.id) === String(productId));
    return p ? p.title : `Product #${productId}`;
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'All') return true;
    return String(r.rating) === String(filterRating);
  });

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
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
            <Star size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Client Testimonials & Feedback Moderation
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Approve verified purchaser credentials and maintain brand integrity
            </p>
          </div>
        </div>

        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="luxury-select"
          style={{ width: '160px', height: '40px' }}
        >
          <option value="All">All Star Ratings</option>
          <option value="5">5 Stars Only</option>
          <option value="4">4 Stars Only</option>
          <option value="3">3 Stars & Lower</option>
        </select>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredReviews.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No customer reviews found matching filter.
          </div>
        ) : (
          filteredReviews.map((r) => (
            <div
              key={r.id}
              className="glass-panel"
              style={{
                padding: '20px 24px',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                      "{r.title}"
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-gold)', fontWeight: 600 }}>
                    {getProductTitle(r.product_id)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => handleToggleVerified(r)}
                    className={`badge ${r.verified ? 'badge-success' : 'badge-warning'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {r.verified ? 'Verified Purchaser' : 'Pending Verification'}
                  </button>

                  <button
                    onClick={() => handleDeleteReview(r.id, r.author)}
                    className="danger-btn"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{r.comment}"
              </p>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                Review by <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.author}</span>
                {r.created_at && ` • ${new Date(r.created_at).toLocaleDateString()}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
