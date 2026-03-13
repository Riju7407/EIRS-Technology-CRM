import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { interactionService } from '../services/interactionService';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import InteractionForm from '../components/interactions/InteractionForm';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const sentimentColor = { positive: 'var(--success)', neutral: 'var(--text-secondary)', negative: 'var(--danger)' };

const InteractionsPage = () => {
  const { isAdmin } = useAuth();
  const [interactions, setInteractions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ type: '', status: '', priority: '', search: '', page: 1, limit: 10 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, sRes] = await Promise.all([
        interactionService.getAll(filters),
        interactionService.getStats(),
      ]);
      setInteractions(iRes.data.interactions);
      setTotal(iRes.data.total);
      setTotalPages(iRes.data.totalPages);
      setStats(sRes.data);
    } catch (_) {
      toast.error('Failed to load interactions');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interaction log?')) return;
    try {
      await interactionService.delete(id);
      toast.success('Interaction deleted');
      fetchData();
    } catch (_) {
      toast.error('Delete failed');
    }
  };

  const handleResolve = async (id) => {
    try {
      await interactionService.update(id, { status: 'resolved' });
      toast.success('Marked as resolved');
      fetchData();
    } catch (_) {
      toast.error('Update failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Interaction Logs</h1>
          <p>Track client queries, complaints, and conversation history</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>
          <FiPlus /> Log Interaction
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', marginBottom: 20 }}>
          {[
            { label: 'Total', value: stats.stats.total, color: 'var(--primary)' },
            { label: 'Open', value: stats.stats.open, color: 'var(--danger)' },
            { label: 'Resolved', value: stats.stats.resolved, color: 'var(--success)' },
            { label: 'Escalated', value: stats.stats.escalated, color: 'var(--warning)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card" style={{ padding: '14px 16px' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search subject or description..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <select className="form-control filter-select" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value, page: 1 }))}>
          <option value="">All Types</option>
          {['query', 'complaint', 'feedback', 'call', 'email', 'meeting', 'note', 'other'].map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select className="form-control filter-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Statuses</option>
          {['open', 'in-progress', 'resolved', 'closed', 'escalated'].map((s) => (
            <option key={s} value={s}>{s.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
          ))}
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
                    <th>Subject</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Channel</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Sentiment</th>
                    <th>Logged By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interactions.length ? (
                    interactions.map((inter) => (
                      <tr key={inter._id}>
                        <td>
                          <div style={{ fontWeight: 500, maxWidth: 200 }}>{inter.subject}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {inter.description?.substring(0, 60)}...
                          </div>
                        </td>
                        <td>
                          <Link to={`/clients/${inter.client?._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
                            {inter.client?.firstName} {inter.client?.lastName}
                          </Link>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{inter.type}</span>
                        </td>
                        <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{inter.channel?.replace('_', ' ')}</td>
                        <td><StatusBadge value={inter.priority} /></td>
                        <td><StatusBadge value={inter.status} /></td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: sentimentColor[inter.sentiment] }}>
                            {inter.sentiment}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>{inter.loggedBy?.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {format(new Date(inter.createdAt), 'dd MMM yyyy')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {inter.status === 'open' && (
                              <button className="btn btn-success btn-icon btn-sm" title="Resolve" onClick={() => handleResolve(inter._id)}>
                                ✓
                              </button>
                            )}
                            <button className="btn btn-secondary btn-icon btn-sm" title="Edit" onClick={() => { setEditData(inter); setShowForm(true); }}>
                              <FiEdit2 size={13} />
                            </button>
                            {isAdmin && (
                              <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(inter._id)}>
                                <FiTrash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-state">
                          <h3>No interactions logged</h3>
                          <p>Log your first client interaction to begin tracking</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>Showing {interactions.length} of {total} interactions</span>
              <div className="pagination-controls">
                <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
                <span style={{ padding: '5px 10px', fontSize: 13 }}>Page {filters.page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={filters.page >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <InteractionForm isOpen={showForm} onClose={() => setShowForm(false)} editData={editData} onSaved={fetchData} />
    </div>
  );
};

export default InteractionsPage;
