import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiMessageSquare, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { clientService } from '../services/clientService';
import { followUpService } from '../services/followUpService';
import { interactionService } from '../services/interactionService';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import { format } from 'date-fns';

const DashboardPage = () => {
  const [clientStats, setClientStats] = useState(null);
  const [followStats, setFollowStats] = useState(null);
  const [interStats, setInterStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cs, fs, is] = await Promise.all([
          clientService.getStats(),
          followUpService.getStats(),
          interactionService.getStats(),
        ]);
        setClientStats(cs.data);
        setFollowStats(fs.data);
        setInterStats(is.data);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner text="Loading dashboard..." />;

  return (
    <div>
      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiUsers color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{clientStats?.stats?.total ?? '—'}</h4>
            <p>Total Clients</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiUsers color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{clientStats?.stats?.active ?? '—'}</h4>
            <p>Active Clients</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiClock color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{followStats?.stats?.scheduled ?? '—'}</h4>
            <p>Scheduled Follow-Ups</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>
            <FiAlertTriangle color="var(--danger)" />
          </div>
          <div className="stat-info">
            <h4>{followStats?.stats?.overdue ?? '—'}</h4>
            <p>Overdue Follow-Ups</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe' }}>
            <FiMessageSquare color="var(--secondary)" />
          </div>
          <div className="stat-info">
            <h4>{interStats?.stats?.open ?? '—'}</h4>
            <p>Open Interactions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiCheckCircle color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{followStats?.stats?.completed ?? '—'}</h4>
            <p>Completed Follow-Ups</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Clients */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Clients</h3>
            <Link to="/clients" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {clientStats?.recentClients?.length ? (
                  clientStats.recentClients.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <Link to={`/clients/${c._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                          {c.firstName} {c.lastName}
                        </Link>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                      </td>
                      <td><StatusBadge value={c.status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {format(new Date(c.createdAt), 'dd MMM yyyy')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No clients yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Follow-Ups */}
        <div className="card">
          <div className="card-header">
            <h3>Today's Follow-Ups</h3>
            <Link to="/followups" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: '0 20px' }}>
            {followStats?.upcomingToday?.length ? (
              followStats.upcomingToday.map((f) => (
                <div key={f._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 500 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {f.client?.firstName} {f.client?.lastName} &bull; {f.client?.phone}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`label-tag label-${f.label === 'Payment Due' ? 'payment' : f.label === 'Scheduled Call' ? 'call' : f.label === 'Market Follow-up' ? 'market' : 'general'}`}>
                      {f.label}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                No follow-ups scheduled for today
              </div>
            )}
          </div>
        </div>

        {/* Follow-Up Label Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Follow-Up Labels</h3>
          </div>
          <div className="card-body">
            {followStats?.byLabel?.length ? (
              followStats.byLabel.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item._id}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 80, height: 6, borderRadius: 3,
                      background: 'var(--border)', overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min((item.count / (followStats.byLabel[0]?.count || 1)) * 100, 100)}%`,
                        height: '100%', background: 'var(--primary)', borderRadius: 3,
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', minWidth: 20 }}>{item.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data yet</p>
            )}
          </div>
        </div>

        {/* Interaction Stats */}
        <div className="card">
          <div className="card-header">
            <h3>Interactions by Type</h3>
            <Link to="/interactions" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="card-body">
            {interStats?.byType?.length ? (
              interStats.byType.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{item._id}</span>
                  <span className="badge badge-primary">{item.count}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No interactions yet</p>
            )}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>{interStats?.stats?.open ?? 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Open</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{interStats?.stats?.resolved ?? 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resolved</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>{interStats?.stats?.escalated ?? 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Escalated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
