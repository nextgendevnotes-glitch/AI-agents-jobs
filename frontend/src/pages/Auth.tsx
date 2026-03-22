import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, Eye, EyeOff, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { session } = useAuth();

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  if (session) return <Navigate to="/" replace />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } },
        });
        if (error) throw error;
        setMessage('Account created! Please check your email to verify before signing in.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(p => !p);
    setError(null);
    setMessage(null);
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Ambient glow blobs ── */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60vw', height: '60vw', maxWidth: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,128,255,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '55vw', height: '55vw', maxWidth: 550,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Left branding panel (desktop only) ── */}
      <div style={{
        flex: 1,
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 3rem',
        background: 'linear-gradient(145deg, rgba(79,128,255,0.08) 0%, rgba(124,58,237,0.06) 100%)',
        borderRight: '1px solid var(--border)',
        position: 'relative', zIndex: 1,
      }} className="auth-left-panel">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', boxShadow: '0 0 24px rgba(79,128,255,0.35)',
          }}>🤖</div>
          <span style={{
            fontSize: '1.25rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>AI Job Matcher</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
          Your AI-powered<br />
          <span style={{ background: 'linear-gradient(135deg, var(--primary), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Job Hunt Agent
          </span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 400 }}>
          Upload your resume once. Our AI matches you with relevant jobs from LinkedIn, Indeed, Glassdoor and more — then automatically applies on your behalf.
        </p>

        {/* Feature bullets */}
        {[
          'Resume parsing & AI profile creation',
          'Real-time job matching across all platforms',
          'Auto-apply with human-quality cover letters',
          'Track every application in one dashboard',
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--accent-glow)', border: '1.5px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CheckCircle size={13} color="var(--accent)" />
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* ── Right: Auth Form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.25rem', position: 'relative', zIndex: 1,
        minWidth: 0,
      }}>
        <div style={{
          width: '100%', maxWidth: 440,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(1.75rem, 5vw, 2.5rem)',
          boxShadow: 'var(--shadow)',
        }}>
          {/* Logo (mobile only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }} className="auth-mobile-logo">
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            }}>🤖</div>
            <span style={{
              fontSize: '1.05rem', fontWeight: 800,
              background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>AI Job Matcher</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              {isLogin ? 'Welcome back 👋' : 'Create your account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isLogin
                ? 'Sign in to manage your AI-powered job applications.'
                : 'Join thousands getting jobs automatically applied for them.'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
              padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)',
              color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5,
            }}>
              <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {message && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
              padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-glow)', border: '1px solid rgba(16,185,129,0.3)',
              color: 'var(--accent)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5,
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Name (sign up only) */}
            {!isLogin && (
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required={!isLogin}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                autoComplete="email"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="form-control"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', padding: '0.25rem',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.25rem', justifyContent: 'center' }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> {isLogin ? 'Signing in…' : 'Creating account…'}</>
                : <><Sparkles size={16} /> {isLogin ? 'Sign In' : 'Create Account'}</>
              }
            </button>
          </form>

          {/* Switch mode */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <div style={{
              height: 1, background: 'var(--border)', marginBottom: '1.25rem', position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'var(--surface)', padding: '0 0.75rem',
                fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 500,
              }}>OR</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={switchMode}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Responsive: show/hide panel */}
      <style>{`
        @media (min-width: 900px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
