import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch, FiUpload, FiDownload } from 'react-icons/fi';
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
  const [fileLoading, setFileLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', source: '', page: 1, limit: 10 });
  const fileInputRef = useRef(null);

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

  const triggerUpload = () => {
    if (fileLoading) return;
    fileInputRef.current?.click();
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (!isExcel) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setFileLoading(true);
    try {
      const { data } = await clientService.importExcel(file);
      const { summary } = data;
      toast.success(
        `Import complete: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`
      );
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Excel import failed');
    }
    setFileLoading(false);
  };

  const handleExcelDownload = async () => {
    if (fileLoading) return;

    setFileLoading(true);
    try {
      const response = await clientService.exportExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `clients-${new Date().toISOString().slice(0, 10)}.xlsx`;

      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Client Excel downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Excel download failed');
    }
    setFileLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Client Management</h1>
          <p>Manage and track all your customer records (website orders sync here as source: website)</p>
        </div>
        <div className="client-actions">
          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleExcelUpload}
              />
              <button className="btn btn-secondary" onClick={triggerUpload} disabled={fileLoading}>
                <FiUpload /> Upload Excel
              </button>
              <button className="btn btn-secondary" onClick={handleExcelDownload} disabled={fileLoading}>
                <FiDownload /> Download Excel
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> Add Client
          </button>
        </div>
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
        <select
          className="form-control filter-select"
          value={filters.source}
          onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value, page: 1 }))}
        >
          <option value="">All Sources</option>
          {['website', 'referral', 'social_media', 'cold_call', 'market', 'other'].map((source) => (
            <option key={source} value={source}>{source.replace('_', ' ')}</option>
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
