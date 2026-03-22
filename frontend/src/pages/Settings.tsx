import { useState, useEffect } from 'react';
import { Save, Zap, Moon, Sun, KeyRound, ExternalLink, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userId = session?.user?.id;

  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [smtpPass, setSmtpPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('auto_apply_enabled, smtp_app_password')
        .eq('user_id', userId)
        .single();
      setAutoApplyEnabled(data?.auto_apply_enabled || false);
      setSmtpPass(data?.smtp_app_password || '');
    }
    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          auto_apply_enabled: autoApplyEnabled,
          smtp_app_password: smtpPass || null,
        }, { onConflict: 'user_id' });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  type SwitchProps = { checked: boolean; onChange: () => void };
  const Toggle = ({ checked, onChange }: SwitchProps) => (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="switch-track" />
      <span className="switch-thumb" />
    </label>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure your automation and email preferences</p>
      </div>

      <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Appearance ── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Shield size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Appearance</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {theme === 'dark' ? <Moon size={18} color="var(--text-muted)" /> : <Sun size={18} color="var(--text-muted)" />}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Dark Mode</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Your preference is saved automatically</div>
              </div>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>
        </div>

        {/* ── Auto Apply ── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Zap size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Automation</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Auto Apply to Matched Jobs</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: 1.5 }}>
                AI automatically drafts and sends applications for jobs matching 70%+. Limit: 20/day.
              </div>
            </div>
            <Toggle checked={autoApplyEnabled} onChange={() => setAutoApplyEnabled(p => !p)} />
          </div>
        </div>

        {/* ── Gmail App Password ── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <KeyRound size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Email Sender Identity</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            To send job applications directly from <strong>your own email address</strong>, follow the steps below to generate a Gmail App Password. Companies will see <strong>your name and email</strong> — not the platform's.
          </p>

          {/* Step-by-step guide */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-subtle)',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem',
            }}>
              How to get your Gmail App Password
            </div>

            {[
              {
                step: '1',
                title: 'Enable 2-Step Verification',
                desc: 'App Passwords only work when 2-Factor Authentication is active on your Google account.',
                link: 'https://myaccount.google.com/security',
                linkText: 'Open Google Security Settings →',
              },
              {
                step: '2',
                title: 'Open App Passwords page',
                desc: 'Search "App Passwords" in your Google Account settings, or click the link below.',
                link: 'https://myaccount.google.com/apppasswords',
                linkText: 'Open App Passwords →',
              },
              {
                step: '3',
                title: 'Create a new App Password',
                desc: 'Under "App name" type "AI Job Matcher", then click Create. Google will show a 16-character code.',
                link: null,
                linkText: null,
              },
              {
                step: '4',
                title: 'Paste the code below',
                desc: 'Copy the 16-character code (spaces are OK) and paste it into the field below, then click Save Settings.',
                link: null,
                linkText: null,
              },
            ].map(({ step, title, desc, link, linkText }) => (
              <div key={step} style={{
                display: 'flex', gap: '1rem', marginBottom: '1rem',
                padding: '0.875rem', background: 'var(--surface-alt)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700,
                }}>
                  {step}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{desc}</div>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.4rem' }}>
                      {linkText} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>  {/* end step-by-step guide */}

          <div className="form-group">
            <label>Gmail App Password (16-character code from Google)</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                value={smtpPass}
                onChange={e => setSmtpPass(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                style={{ paddingRight: '2.75rem', letterSpacing: smtpPass && !showPass ? '0.2em' : 'normal' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {smtpPass && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.4rem' }}>
                <CheckCircle size={13} /> App Password saved
              </div>
            )}
          </div>
        </div>

        {/* ── Save Button ── */}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '0.85rem', fontSize: '0.925rem' }}
        >
          {saving ? (
            <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</>
          ) : saved ? (
            <><CheckCircle size={16} /> Saved Successfully!</>
          ) : (
            <><Save size={16} /> Save Settings</>
          )}
        </button>
      </div>
    </div>
  );
}
