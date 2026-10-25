import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Sparkles, AlertCircle, Key } from 'lucide-react';

export default function LoginView() {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await signInWithPassword(email.trim(), password);
    } catch (err) {
      console.error('Sign in error:', err);
      setErrorMsg(err.message || 'Invalid administrative credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAdmin = (adminEmail) => {
    setEmail(adminEmail);
    setPassword('Admin@123456');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #161a24 0%, #080a0e 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative luxury background elements */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,120,73,0.04) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel animate-fade" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 25px rgba(212,175,55,0.08)',
        borderRadius: '20px',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '58px',
            height: '58px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            marginBottom: '16px',
            color: 'var(--accent-gold)'
          }}>
            <Shield size={28} />
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '6px' }}>
            EDEN & THREADS
          </h2>
          <p style={{ color: 'var(--accent-gold)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700 }}>
            Executive Command Console
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>
              ADMINISTRATIVE EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="luxury-input"
                style={{ paddingLeft: '40px' }}
                placeholder="admin@edenthreads.luxury"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                SECURITY PASSPHRASE
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="luxury-input"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="gold-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px' }}
          >
            {loading ? (
              <span>Authenticating Secure Channel...</span>
            ) : (
              <>
                <span>Access Management System</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick helper note for admin login */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            <Key size={13} />
            <span>Preset Authorized Accounts:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fillQuickAdmin('admin@edenthreads.luxury')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-gold)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              admin@edenthreads.luxury
            </button>
            <button
              type="button"
              onClick={() => fillQuickAdmin('edenandthreadlogin@gmail.com')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-gold)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              edenandthreadlogin@gmail.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
