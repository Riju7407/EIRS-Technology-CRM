import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiEdit2, FiPlus, FiSearch, FiTrash2, FiTrendingUp, FiUpload, FiUserCheck, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { prospectService } from '../services/prospectService';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  stage: 'new',
  source: 'other',
  estimatedValue: '',
  notes: '',
};

const ProspectsPage = () => {
  const { isAdmin } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState({ search: '', stage: '', source: '', page: 1, limit: 10 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        prospectService.getAll(filters),
        prospectService.getStats(),
      ]);
      const prospectsList = Array.isArray(listRes?.data?.prospects) ? listRes.data.prospects : [];
      setProspects(prospectsList);
      setTotal(Number(listRes?.data?.total) || 0);
      setTotalPages(Number(listRes?.data?.totalPages) || 1);
      setStats(statsRes.data.stats);
    } catch (_) {
      toast.error('Failed to load service requests');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditData(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditData(item);
    setFormData({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
      company: item.company || '',
      stage: item.stage || 'new',
      source: item.source || 'other',
      estimatedValue: item.estimatedValue || '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        estimatedValue: Number(formData.estimatedValue || 0),
      };

      if (editData?._id) {
        await prospectService.update(editData._id, payload);
        toast.success('Service request updated successfully');
      } else {
        await prospectService.create(payload);
        toast.success('Service request added successfully');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service request');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete service request "${name}"?`)) return;
    try {
      await prospectService.delete(id);
      toast.success('Service request deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

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
      const { data } = await prospectService.importExcel(file);
      const { summary } = data;
      toast.success(
        `Import complete: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`
      );
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Excel import failed');
    }
    setFileLoading(false);
  };

  const handleExcelDownload = async () => {
    if (fileLoading) return;

    setFileLoading(true);
    try {
      const response = await prospectService.exportExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `prospects-${new Date().toISOString().slice(0, 10)}.xlsx`;

      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Service requests Excel downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Excel download failed');
    }
    setFileLoading(false);
  };

  const prospectsList = Array.isArray(prospects) ? prospects : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Service Management</h1>
          <p>Manage pipeline-stage service opportunities and delivery readiness (website enquiries appear with source: website)</p>
        </div>
        <div className="client-actions">
          <Link className="btn btn-secondary" to="/distribution">Distribution</Link>
          <Link className="btn btn-secondary" to="/bill-quotation">Bill Quotation</Link>
          <Link className="btn btn-secondary" to="/purchase-history">Purchase History</Link>
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
            <FiPlus /> Add Service Request
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiUsers color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.total ?? 0}</h4>
            <p>Total Service Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiUserCheck color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.qualified ?? 0}</h4>
            <p>Qualified Leads</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiTrendingUp color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.negotiation ?? 0}</h4>
            <p>In Negotiation</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search service requests..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="form-control filter-select"
          value={filters.stage}
          onChange={(e) => setFilters((p) => ({ ...p, stage: e.target.value, page: 1 }))}
        >
          <option value="">All Stages</option>
          {['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
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
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Stage</th>
                    <th>Source</th>
                    <th>Estimated Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prospectsList.length ? prospectsList.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600 }}>{item.firstName} {item.lastName}</td>
                      <td>
                        <div>{item.email}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.phone}</div>
                      </td>
                      <td>{item.company || '—'}</td>
                      <td><span className="badge badge-info">{item.stage}</span></td>
                      <td style={{ textTransform: 'capitalize' }}>{item.source?.replace('_', ' ')}</td>
                      <td>₹{Number(item.estimatedValue || 0).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(item)} title="Edit">
                            <FiEdit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(item._id, `${item.firstName} ${item.lastName}`)} title="Delete">
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}><div className="empty-state"><h3>No service requests found</h3></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>Showing {prospectsList.length} of {total} service requests</span>
              <div className="pagination-controls">
                <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
                <span style={{ padding: '5px 10px', fontSize: 13 }}>Page {filters.page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={filters.page >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editData ? 'Edit Service Request' : 'Add Service Request'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="prospect-form" className="btn btn-primary">{editData ? 'Update' : 'Create'}</button>
          </>
        }
      >
        <form id="prospect-form" onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-control" required value={formData.firstName} onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-control" required value={formData.lastName} onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" required value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-control" value={formData.company} onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Value</label>
              <input type="number" className="form-control" min="0" value={formData.estimatedValue} onChange={(e) => setFormData((p) => ({ ...p, estimatedValue: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stage</label>
              <select className="form-control" value={formData.stage} onChange={(e) => setFormData((p) => ({ ...p, stage: e.target.value }))}>
                {['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-control" value={formData.source} onChange={(e) => setFormData((p) => ({ ...p, source: e.target.value }))}>
                {['referral', 'website', 'social_media', 'cold_call', 'market', 'other'].map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProspectsPage;
