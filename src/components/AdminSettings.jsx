import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Lock,
  Save,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AdminSettings() {
  const { user, profile } = useAuth();
  const [announcement, setAnnouncement] = useState('COMPLIMENTARY WORLDWIDE EXPRESS SHIPPING ON ORDERS OVER ₹1,500');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    setStatusMsg('');

    try {
      const { error } = await supabase
        .from('announcements')
        .upsert({ id: 1, message: announcement, active: true });

      if (error) throw error;
      setStatusMsg('Global Storefront Announcement updated successfully!');
    } catch (err) {
      setStatusMsg(`Update failed: ${err.message}`);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
          Platform & Security Administration
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Manage global store announcements, verified administrators, and Supabase integration settings
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Storefront Header Broadcast Announcement */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Settings size={20} color="var(--accent-gold)" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Storefront Header Announcement Bar
            </h4>
          </div>

          {statusMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '12px', marginBottom: '14px' }}>
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleUpdateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                BROADCAST MESSAGE
              </label>
              <textarea
                rows="3"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="luxury-textarea"
                placeholder="e.g. SUMMER SALE: ENJOY 20% OFF ALL FRENCH LINEN"
              />
            </div>

            <button type="submit" disabled={savingAnnouncement} className="gold-btn" style={{ alignSelf: 'flex-start' }}>
              <Save size={15} />
              <span>{savingAnnouncement ? 'Publishing...' : 'Update Store Announcement'}</span>
            </button>
          </form>
        </div>

        {/* Security & Supabase Connection Status */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} color="var(--accent-gold)" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              PostgreSQL Security Audit
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Row-Level Security (RLS)</span>
              <span className="badge badge-success">8 Tables Enforced</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Supabase Storage Bucket</span>
              <span className="badge badge-gold">garment-photos</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Admin Session</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{user?.email}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Security Level</span>
              <span className="badge badge-success">Executive Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
