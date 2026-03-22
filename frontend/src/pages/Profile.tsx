import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  UploadCloud, Edit2, Save, Loader2, Sparkles,
  User as UserIcon, Briefcase, GraduationCap,
  FileText, CheckCircle, X, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="card" style={{ marginBottom: '1rem' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      paddingBottom: '1rem', marginBottom: '1.25rem',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ color: 'var(--primary)', display: 'flex' }}>{icon}</div>
      <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, editing, input }: { label: string; value: React.ReactNode; editing: boolean; input: React.ReactNode }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{
      display: 'block', fontSize: '0.72rem', fontWeight: 700,
      color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem',
    }}>{label}</label>
    {editing ? input : (
      <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500, wordBreak: 'break-word' }}>
        {value || <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontWeight: 400 }}>Not found</span>}
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Profile() {
  const { user } = useAuth();
  const userId = user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    resume_name: '', resume_email: '', resume_phone: '', address: '',
    country: '', city: '', experience_years: 0, skills: '',
    preferred_roles: '', additional_info: '', education: '', companies: '',
  });

  useEffect(() => { if (userId) fetchProfile(); }, [userId]);

  const fetchProfile = async (quiet = false) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles').select('*').eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) { setProfile(data); syncEditForm(data); if (analyzing) { setAnalyzing(false); setMessage({ type: 'success', text: 'AI successfully created your job profile!' }); } return true; }
      return false;
    } catch (error) { if (!quiet) console.error(error); return false; }
  };

  const syncEditForm = (data: any) => {
    setEditForm({
      resume_name: data.resume_name || '', resume_email: data.resume_email || '',
      resume_phone: data.resume_phone || '', address: data.address || '',
      country: data.country || '', city: data.city || '',
      experience_years: data.experience_years || 0,
      additional_info: data.additional_info || '',
      skills: data.skills?.join(', ') || '',
      preferred_roles: data.preferred_roles?.join(', ') || '',
      education: typeof data.education === 'string' ? data.education : JSON.stringify(data.education || [], null, 2),
      companies: typeof data.companies === 'string' ? data.companies : JSON.stringify(data.companies || [], null, 2),
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userId) return;
    setUploading(true); setMessage(null);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userId', userId);
    try {
      await axios.post(`${API_URL}/users/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploading(false); setAnalyzing(true);
      let attempts = 0;
      const iv = setInterval(async () => {
        const found = await fetchProfile(true);
        attempts++;
        if (found || attempts > 12) { clearInterval(iv); if (!found) { setAnalyzing(false); setMessage({ type: 'error', text: 'AI analysis took too long. Refresh the page in a moment.' }); } }
      }, 2500);
    } catch (error: any) {
      setUploading(false);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Upload failed' });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        user_id: userId, ...editForm,
        skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_roles: editForm.preferred_roles.split(',').map(s => s.trim()).filter(Boolean),
        education: editForm.education.trim().startsWith('[') ? JSON.parse(editForm.education) : editForm.education,
        companies: editForm.companies.trim().startsWith('[') ? JSON.parse(editForm.companies) : editForm.companies,
      };
      const { data, error } = await supabase.from('user_profiles').upsert(payload).select().single();
      if (error) throw error;
      if (data) setProfile(data);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally { setSaving(false); }
  };

  const formatJSON = (data: any) => {
    if (!data || data.length === 0) return null;
    if (typeof data === 'string') return data;
    try { return data.map((d: any) => Object.values(d).filter(Boolean).join(' · ')).join('\n'); }
    catch { return JSON.stringify(data); }
  };

  const in_ = (field: keyof typeof editForm, placeholder = '') => (
    <input
      className="form-control"
      value={editForm[field] as string}
      onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
      placeholder={placeholder}
    />
  );

  const ta_ = (field: keyof typeof editForm, rows = 3, placeholder = '') => (
    <textarea
      className="form-control"
      rows={rows}
      value={editForm[field] as string}
      onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
      placeholder={placeholder}
    />
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Your AI Job Profile</h2>
          <p>Manage your extracted resume data and job preferences</p>
        </div>
        {profile && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isEditing ? (
              <>
                <button className="btn btn-ghost" onClick={() => { setIsEditing(false); syncEditForm(profile); }}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={16} /> Save Profile</>}
                </button>
              </>
            ) : (
              <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Flash Message */}
      {message && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.875rem 1.125rem', borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          background: message.type === 'success' ? 'var(--accent-glow)' : 'rgba(248,81,73,0.12)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(248,81,73,0.3)'}`,
          color: message.type === 'success' ? 'var(--accent)' : 'var(--error)',
          fontSize: '0.875rem', fontWeight: 500,
        }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '1.5rem' }}>

        {/* ── Upload Card ── */}
        <SectionCard icon={<UploadCloud size={18} />} title="Upload Resume">
          <form onSubmit={handleUpload}>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', padding: '2rem 1rem', borderRadius: 'var(--radius-md)',
              border: `2px dashed ${file ? 'var(--primary)' : 'var(--border)'}`,
              background: file ? 'var(--primary-glow)' : 'var(--surface-alt)',
              cursor: 'pointer', transition: 'var(--transition)', marginBottom: '1rem',
              position: 'relative',
            }}>
              <input
                type="file"
                accept=".pdf,.docx,.doc,image/png,image/jpeg,image/jpg"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <UploadCloud size={32} color={file ? 'var(--primary)' : 'var(--text-subtle)'} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: file ? 'var(--primary)' : 'var(--text)' }}>
                  {file ? file.name : 'Click or drag resume here'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  PDF, Word (.docx), PNG, JPG supported
                </div>
              </div>
            </label>

            <button className="btn btn-primary" type="submit" disabled={!file || uploading || analyzing}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.925rem' }}>
              {uploading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Uploading…</>
               : analyzing ? <><Sparkles size={16} /> AI is parsing your resume…</>
               : <><Sparkles size={16} /> Extract AI Data</>}
            </button>
          </form>

          {/* AI Loading animation */}
          {analyzing && (
            <div style={{
              marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--primary-glow)', border: '1px solid rgba(79,128,255,0.25)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <Loader2 size={20} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>AI Analysis in Progress</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Extracting skills, experience, education and contact details from your resume…</div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Profile Sections ── */}
        {!profile && !analyzing ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>No profile data yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.4rem' }}>Upload your resume above and the AI will automatically build your job profile</p>
          </div>
        ) : profile && (
          <>
            {/* Contact & Location */}
            <SectionCard icon={<UserIcon size={18} />} title="Contact & Location">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                <Field label="Full Name" value={profile.resume_name} editing={isEditing}
                  input={in_('resume_name', 'Your full name')} />
                <Field label="Email" value={profile.resume_email} editing={isEditing}
                  input={in_('resume_email', 'your@email.com')} />
                <Field label="Phone" value={profile.resume_phone} editing={isEditing}
                  input={in_('resume_phone', '+91 99999 00000')} />
                <Field label="Address" value={profile.address} editing={isEditing}
                  input={in_('address', 'Street, City')} />
                <Field label="Country" value={profile.country} editing={isEditing}
                  input={in_('country', 'India')} />
                <Field label="City" value={profile.city} editing={isEditing}
                  input={in_('city', 'Ahmedabad')} />
              </div>
            </SectionCard>

            {/* Experience */}
            <SectionCard icon={<Briefcase size={18} />} title="Work Experience">
              <Field label="Total Years" value={`${profile.experience_years} Years`} editing={isEditing}
                input={
                  <input type="number" className="form-control" style={{ maxWidth: 120 }}
                    value={editForm.experience_years}
                    onChange={e => setEditForm({ ...editForm, experience_years: parseInt(e.target.value) || 0 })} />
                } />
              <Field label="Company History" editing={isEditing}
                value={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {profile.companies?.map((c: any, i: number) => (
                      <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', borderLeft: '3px solid var(--primary)' }}>
                        <strong>{c.name}</strong> · {c.title} · <span style={{ color: 'var(--text-muted)' }}>{c.duration}</span>
                      </div>
                    )) || formatJSON(profile.companies) || 'Not specified'}
                  </div>
                }
                input={ta_('companies', 4, '[{"name":"Company","title":"Role","duration":"2 yrs"}]')} />
            </SectionCard>

            {/* Education */}
            <SectionCard icon={<GraduationCap size={18} />} title="Education">
              <Field label="Education Background" editing={isEditing}
                value={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {profile.education?.map((e: any, i: number) => (
                      <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', borderLeft: '3px solid var(--accent)' }}>
                        <strong>{e.degree}</strong> · {e.school} · <span style={{ color: 'var(--text-muted)' }}>{e.year}</span>
                      </div>
                    )) || formatJSON(profile.education) || 'Not specified'}
                  </div>
                }
                input={ta_('education', 4, '[{"degree":"B.Tech","school":"University","year":"2020"}]')} />
            </SectionCard>

            {/* Skills & Roles */}
            <SectionCard icon={<Plus size={18} />} title="Skills & Target Roles">
              <Field label="Skills" editing={isEditing}
                value={
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.skills?.length > 0
                      ? profile.skills.map((s: string, i: number) => (
                          <span key={i} className="badge badge-muted" style={{ borderRadius: 'var(--radius-sm)' }}>{s}</span>
                        ))
                      : <span style={{ color: 'var(--text-subtle)', fontSize: '0.875rem' }}>No skills found</span>
                    }
                  </div>
                }
                input={ta_('skills', 2, 'Microsoft Excel, Record Management, MIS…')} />

              <Field label="Target Roles" editing={isEditing}
                value={
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.preferred_roles?.length > 0
                      ? profile.preferred_roles.map((r: string, i: number) => (
                          <span key={i} className="badge badge-primary">{r}</span>
                        ))
                      : <span style={{ color: 'var(--text-subtle)', fontSize: '0.875rem' }}>No roles detected</span>
                    }
                  </div>
                }
                input={ta_('preferred_roles', 2, 'MIS Executive, Data Analyst, Office Manager…')} />
            </SectionCard>

            {/* AI Preferences */}
            <SectionCard icon={<FileText size={18} />} title="Custom AI Instructions">
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.875rem', lineHeight: 1.6 }}>
                Add extra preferences to help the AI match you with 100% precision — e.g. "Only remote jobs", "Minimum ₹50K salary", "No travel required".
              </p>
              {isEditing ? (
                ta_('additional_info', 5, 'Only looking for hybrid / remote roles. Prefer companies under 500 employees. Minimum 3+ years required roles only…')
              ) : (
                <div style={{
                  padding: '1rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-glow)', border: '1px solid rgba(79,128,255,0.2)',
                  fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.7, minHeight: 80,
                  whiteSpace: 'pre-wrap',
                }}>
                  {profile.additional_info || (
                    <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                      No custom instructions saved yet. Click "Edit Profile" to add your preferences.
                    </span>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Auto-Apply Status Banner */}
            {profile.auto_apply_enabled && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-glow)', border: '1px solid rgba(16,185,129,0.3)',
                color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem',
              }}>
                <CheckCircle size={18} /> Auto-Apply is Active — AI will apply to matched jobs automatically
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
