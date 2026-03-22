import { useEffect, useState } from 'react';
import { Briefcase, Send, CheckCircle, Clock, TrendingUp, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [stats, setStats] = useState({ matches: 0, applied: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      try {
        const { data: matches } = await supabase
          .from('job_matches')
          .select('id')
          .eq('user_id', userId)
          .gte('score', 60);

        const { data: applications } = await supabase
          .from('applications')
          .select('*, jobs(title, company)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        setStats({
          matches: matches ? matches.length : 0,
          applied: applications ? applications.length : 0,
        });
        if (applications) setRecentApps(applications);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    sent:          { label: 'Sent',          className: 'badge badge-success', icon: <CheckCircle size={12} /> },
    pending:       { label: 'Pending',       className: 'badge badge-warning', icon: <Clock size={12} /> },
    sending:       { label: 'Sending',       className: 'badge badge-primary', icon: <Send size={12} /> },
    failed:        { label: 'Failed',        className: 'badge badge-error',   icon: <XCircle size={12} /> },
    blocked_fraud: { label: '🚫 Fraud',      className: 'badge badge-error',   icon: <XCircle size={12} /> },
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your job match and application status</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-glow)' }}>
            <Briefcase size={24} color="var(--primary)" />
          </div>
          <div>
            {loading
              ? <div className="skeleton" style={{ width: 48, height: 32, marginBottom: 6 }} />
              : <div className="stat-num">{stats.matches}</div>
            }
            <div className="stat-label">Matched Jobs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-glow)' }}>
            <Send size={24} color="var(--accent)" />
          </div>
          <div>
            {loading
              ? <div className="skeleton" style={{ width: 48, height: 32, marginBottom: 6 }} />
              : <div className="stat-num">{stats.applied}</div>
            }
            <div className="stat-label">Applications Sent</div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Applications</h3>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : recentApps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p style={{ fontWeight: 600, color: 'var(--text)' }}>No applications yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.4rem' }}>Enable Auto-Apply in Settings to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentApps.map(app => {
              const st = statusConfig[app.status] || statusConfig['pending'];
              return (
                <div key={app.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  background: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.jobs?.title || 'Unknown Job'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {app.jobs?.company || 'Unknown Company'}
                    </div>
                  </div>
                  <span className={st.className} style={{ flexShrink: 0, marginLeft: '0.75rem' }}>
                    {st.icon} {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
