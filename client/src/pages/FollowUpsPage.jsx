import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { followUpService } from '../services/followUpService';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import FollowUpForm from '../components/followups/FollowUpForm';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const getLabelClass = (label) => {
  const map = {
    'Pending Response': 'label-pending', 'Payment Due': 'label-payment',
    'Scheduled Call': 'label-call', 'Market Follow-up': 'label-market',
    'Urgent': 'label-urgent',
  };
  return map[label] || 'label-general';
};

const FollowUpsPage = () => {
  const { isAdmin } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ status: '', label: '', priority: '', page: 1, limit: 10 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        followUpService.getAll(filters),
        followUpService.getStats(),
      ]);
      setFollowUps(fRes.data.followUps);
      setTotal(fRes.data.total);
      setTotalPages(fRes.data.totalPages);
      setStats(sRes.data);
    } catch (_) {
      toast.error('Failed to load follow-ups');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkComplete = async (id) => {
    try {
      await followUpService.update(id, { status: 'completed' });
      toast.success('Follow-up marked as completed');
      fetchData();
    } catch (_) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this follow-up?')) return;
    try {
      await followUpService.delete(id);
      toast.success('Follow-up deleted');
      fetchData();
    } catch (_) {
      toast.error('Delete failed');
    }
  };

  const LABELS = [
    'Pending Response', 'Payment Due', 'Scheduled Call', 'Market Follow-up',
    'Urgent', 'New Lead', 'Proposal Sent', 'Negotiation', 'Contract Review', 'Onboarding', 'General',
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Follow-Up Scheduling</h1>
          <p>Manage and track all scheduled follow-ups with clients</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>
          <FiPlus /> Schedule Follow-Up
        </button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', marginBottom: 20 }}>
          {[
            { label: 'Scheduled', value: stats.stats.scheduled, color: 'var(--info)' },
            { label: 'Overdue', value: stats.stats.overdue, color: 'var(--danger)' },
            { label: 'Completed', value: stats.stats.completed, color: 'var(--success)' },
            { label: 'Pending Response', value: stats.stats.pending, color: 'var(--warning)' },
            { label: 'Payment Due', value: stats.stats.paymentDue, color: 'var(--danger)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card" style={{ padding: '14px 16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <select className="form-control filter-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Statuses</option>
          {['scheduled', 'in-progress', 'completed', 'cancelled', 'overdue', 'rescheduled'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.replace('-', ' ').slice(1)}</option>
          ))}
        </select>
        <select className="form-control filter-select" value={filters.label} onChange={(e) => setFilters((p) => ({ ...p, label: e.target.value, page: 1 }))}>
          <option value="">All Labels</option>
          {LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="form-control filter-select" value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value, page: 1 }))}>
          <option value="">All Priorities</option>
          {['low', 'medium', 'high', 'critical'].map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Client</th>
                    <th>Label</th>
                    <th>Schedule</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.length ? (
                    followUps.map((f) => (
                      <tr key={f._id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{f.title}</div>
                          {f.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.description.substring(0, 50)}...</div>}
                        </td>
                        <td>
                          <Link to={`/clients/${f.client?._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
                            {f.client?.firstName} {f.client?.lastName}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.client?.phone}</div>
                        </td>
                        <td>
                          <span className={`label-tag ${getLabelClass(f.label)}`}>{f.label}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500, color: f.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>
                            {format(new Date(f.scheduledDate), 'dd MMM yyyy')}
                          </div>
                          {f.scheduledTime && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.scheduledTime}</div>}
                        </td>
                        <td><StatusBadge value={f.priority} /></td>
                        <td><StatusBadge value={f.status} /></td>
                        <td style={{ fontSize: 12 }}>{f.assignedTo?.name || f.scheduledBy?.name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {f.status !== 'completed' && f.status !== 'cancelled' && (
                              <button className="btn btn-success btn-icon btn-sm" title="Mark Complete" onClick={() => handleMarkComplete(f._id)}>
                                <FiCheck size={13} />
                              </button>
                            )}
                            <button className="btn btn-secondary btn-icon btn-sm" title="Edit" onClick={() => { setEditData(f); setShowForm(true); }}>
                              <FiEdit2 size={13} />
                            </button>
                            {isAdmin && (
                              <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(f._id)}>
                                <FiTrash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <h3>No follow-ups found</h3>
                          <p>Schedule your first follow-up to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>Showing {followUps.length} of {total} follow-ups</span>
              <div className="pagination-controls">
                <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
                <span style={{ padding: '5px 10px', fontSize: 13 }}>Page {filters.page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={filters.page >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <FollowUpForm isOpen={showForm} onClose={() => setShowForm(false)} editData={editData} onSaved={fetchData} />
    </div>
  );
};

export default FollowUpsPage;
