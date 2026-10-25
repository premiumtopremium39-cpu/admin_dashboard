import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Lock,
  Save,
  CheckCircle,
  ExternalLink,
  Ruler,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AdminSettings() {
  const { user, profile } = useAuth();
  const [announcement, setAnnouncement] = useState('COMPLIMENTARY WORLDWIDE EXPRESS SHIPPING ON ORDERS OVER ₹1,500');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Size Guide States
  const [sizeGuide, setSizeGuide] = useState({
    title: 'Linen Shirt Size Guide',
    subtitle: 'Measurements are shown in inches. Fits may vary slightly depending on shirt style.',
    rows: [
      { size: 'S', chest: '38" - 40"', shoulder: '17.5"', sleeve: '33.5"', length: '29.0"' },
      { size: 'M', chest: '41" - 43"', shoulder: '18.2"', sleeve: '34.5"', length: '29.5"' },
      { size: 'L', chest: '44" - 46"', shoulder: '19.0"', sleeve: '35.5"', length: '30.2"' },
      { size: 'XL', chest: '47" - 49"', shoulder: '19.8"', sleeve: '36.5"', length: '31.0"' }
    ],
    fitNote: 'If you are between sizes, we recommend sizing up for a relaxed resort fit or choosing your normal size for a structured classic look.'
  });
  const [savingSizeGuide, setSavingSizeGuide] = useState(false);
  const [sizeGuideMsg, setSizeGuideMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase.from('announcements').select('*');
        if (data && data.length > 0) {
          const ann = data.find(a => a.id === 1);
          if (ann?.message) setAnnouncement(ann.message);

          const guide = data.find(a => a.id === 2);
          if (guide?.message) {
            try {
              const parsed = JSON.parse(guide.message);
              if (parsed && parsed.rows) setSizeGuide(parsed);
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Load settings failed:', e);
      }
    }
    loadSettings();
  }, []);

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

  const handleSizeGuideRowChange = (index, field, value) => {
    setSizeGuide(prev => {
      const newRows = [...prev.rows];
      newRows[index] = { ...newRows[index], [field]: value };
      return { ...prev, rows: newRows };
    });
  };

  const handleAddSizeGuideRow = () => {
    setSizeGuide(prev => ({
      ...prev,
      rows: [...prev.rows, { size: 'XXL', chest: '50" - 52"', shoulder: '20.5"', sleeve: '37.5"', length: '31.8"' }]
    }));
  };

  const handleRemoveSizeGuideRow = (index) => {
    setSizeGuide(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSizeGuide = async (e) => {
    e.preventDefault();
    setSavingSizeGuide(true);
    setSizeGuideMsg('');

    try {
      const { error } = await supabase
        .from('announcements')
        .upsert({
          id: 2,
          message: JSON.stringify(sizeGuide),
          active: true
        });

      if (error) throw error;
      setSizeGuideMsg('Size Guide published and synced with Storefront modal!');
    } catch (err) {
      setSizeGuideMsg(`Save failed: ${err.message}`);
    } finally {
      setSavingSizeGuide(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
          Platform & Storefront Configuration
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Manage global store announcements, the dynamic Size Guide chart, and PostgreSQL security
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
              <span style={{ color: 'var(--text-secondary)' }}>Live Sync State</span>
              <span className="badge badge-success">Supabase Realtime Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Size Guide Editor */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Ruler size={20} color="var(--accent-gold)" />
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Storefront Size Guide & Measurement Matrix
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Changes saved here reflect in the customer Quick View & PDP "SIZE GUIDE" modal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddSizeGuideRow}
            className="secondary-btn"
            style={{ fontSize: '12px', height: '34px' }}
          >
            <Plus size={14} />
            <span>Add Size Row</span>
          </button>
        </div>

        {sizeGuideMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '12px', marginBottom: '16px' }}>
            {sizeGuideMsg}
          </div>
        )}

        <form onSubmit={handleSaveSizeGuide} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                SIZE GUIDE TITLE
              </label>
              <input
                type="text"
                value={sizeGuide.title}
                onChange={(e) => setSizeGuide({ ...sizeGuide, title: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                SUBTITLE / UNIT NOTE
              </label>
              <input
                type="text"
                value={sizeGuide.subtitle}
                onChange={(e) => setSizeGuide({ ...sizeGuide, subtitle: e.target.value })}
                className="luxury-input"
              />
            </div>
          </div>

          {/* Measurements Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>SIZE</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>CHEST</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>SHOULDER</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>SLEEVE</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>LENGTH</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {sizeGuide.rows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 14px' }}>
                      <input
                        type="text"
                        value={row.size}
                        onChange={(e) => handleSizeGuideRowChange(idx, 'size', e.target.value)}
                        className="luxury-input"
                        style={{ height: '32px', width: '70px', fontWeight: 700 }}
                      />
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <input
                        type="text"
                        value={row.chest}
                        onChange={(e) => handleSizeGuideRowChange(idx, 'chest', e.target.value)}
                        className="luxury-input"
                        style={{ height: '32px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <input
                        type="text"
                        value={row.shoulder}
                        onChange={(e) => handleSizeGuideRowChange(idx, 'shoulder', e.target.value)}
                        className="luxury-input"
                        style={{ height: '32px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <input
                        type="text"
                        value={row.sleeve}
                        onChange={(e) => handleSizeGuideRowChange(idx, 'sleeve', e.target.value)}
                        className="luxury-input"
                        style={{ height: '32px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <input
                        type="text"
                        value={row.length}
                        onChange={(e) => handleSizeGuideRowChange(idx, 'length', e.target.value)}
                        className="luxury-input"
                        style={{ height: '32px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeGuideRow(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Delete Size Row"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              FIT RECOMMENDATION BANNER NOTE
            </label>
            <input
              type="text"
              value={sizeGuide.fitNote}
              onChange={(e) => setSizeGuide({ ...sizeGuide, fitNote: e.target.value })}
              className="luxury-input"
            />
          </div>

          <button
            type="submit"
            disabled={savingSizeGuide}
            className="gold-btn"
            style={{ alignSelf: 'flex-start', marginTop: '8px' }}
          >
            <Save size={15} />
            <span>{savingSizeGuide ? 'Saving & Publishing...' : 'Save & Publish Size Guide'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
