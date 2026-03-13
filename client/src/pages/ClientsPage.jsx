import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { clientService } from '../services/clientService';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import ClientForm from '../components/clients/ClientForm';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const ClientsPage = () => {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 10 });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await clientService.getAll(filters);
      setClients(data.clients);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (_) {
      toast.error('Failed to load clients');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    try {
      await clientService.delete(id);
      toast.success('Client deleted');
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openCreate = () => { setEditData(null); setShowForm(true); };
  const openEdit = (client) => { setEditData(client); setShowForm(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Client Management</h1>
          <p>Manage and track all your customer records</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search clients..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="form-control filter-select"
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
        >
          <option value="">All Statuses</option>
          {['lead', 'prospect', 'active', 'inactive', 'churned'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
                    <th>Client</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Total Value</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length ? (
                    clients.map((c) => (
                      <tr key={c._id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                        </td>
                        <td>{c.phone}</td>
                        <td>{c.company || '—'}</td>
                        <td><StatusBadge value={c.status} /></td>
                        <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{c.source?.replace('_', ' ')}</td>
                        <td style={{ fontWeight: 600 }}>
                          {c.totalPurchaseValue > 0 ? `₹${c.totalPurchaseValue.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {format(new Date(c.createdAt), 'dd MMM yyyy')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <Link to={`/clients/${c._id}`} className="btn btn-secondary btn-icon btn-sm" title="View">
                              <FiEye size={14} />
                            </Link>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(c)} title="Edit">
                              <FiEdit2 size={14} />
                            </button>
                            {isAdmin && (
                              <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(c._id, `${c.firstName} ${c.lastName}`)} title="Delete">
                                <FiTrash2 size={14} />
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
                          <h3>No clients found</h3>
                          <p>Add your first client to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>Showing {clients.length} of {total} clients</span>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </button>
                <span style={{ padding: '5px 10px', fontSize: 13 }}>
                  Page {filters.page} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ClientForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        editData={editData}
        onSaved={fetchClients}
      />
    </div>
  );
};

export default ClientsPage;
