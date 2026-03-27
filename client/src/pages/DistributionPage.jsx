import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckSquare, FiEdit2, FiPlus, FiSearch, FiTarget, FiTrash2, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { distributionService } from '../services/distributionService';
import { prospectService } from '../services/prospectService';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  prospect: '',
  assignedTo: '',
  status: 'assigned',
  priority: 'medium',
  dueDate: '',
  notes: '',
};

const DistributionPage = () => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 10 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes, prospectsRes, employeesRes] = await Promise.all([
        distributionService.getAll(filters),
        distributionService.getStats(),
        prospectService.getAll({ page: 1, limit: 1000 }),
        employeeService.getAll({ page: 1, limit: 1000, status: 'active' }),
      ]);
      const distributionList = Array.isArray(listRes?.data?.distributions) ? listRes.data.distributions : [];
      setItems(distributionList);
      setTotal(Number(listRes?.data?.total) || 0);
      setTotalPages(Number(listRes?.data?.totalPages) || 1);
      setStats(statsRes?.data?.stats || null);
      setProspects(Array.isArray(prospectsRes?.data?.prospects) ? prospectsRes.data.prospects : []);
      setEmployees(Array.isArray(employeesRes?.data?.employees) ? employeesRes.data.employees : []);
    } catch (_) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setStats(null);
      setProspects([]);
      setEmployees([]);
      toast.error('Failed to load distribution data');
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
      prospect: item.prospect?._id || item.prospect || '',
      assignedTo: item.assignedTo?._id || item.assignedTo || '',
      status: item.status || 'assigned',
      priority: item.priority || 'medium',
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        prospect: formData.prospect,
        assignedTo: formData.assignedTo,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes,
      };

      if (editData?._id) {
        await distributionService.update(editData._id, payload);
        toast.success('Lead assignment updated successfully');
      } else {
        await distributionService.create(payload);
        toast.success('Lead assigned successfully');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  const handleDelete = async (id, assignmentId) => {
    if (!window.confirm(`Delete assignment "${assignmentId}"?`)) return;
    try {
      await distributionService.delete(id);
      toast.success('Assignment deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const distributionList = Array.isArray(items) ? items : [];
  const prospectOptions = useMemo(
    () => prospects.map((prospect) => ({
      value: prospect._id,
      label: `${prospect.firstName} ${prospect.lastName} (${prospect.email})`,
    })),
    [prospects]
  );
  const employeeOptions = useMemo(
    () => employees.map((employee) => ({
      value: employee._id,
      label: `${employee.name} (${employee.role})`,
    })),
    [employees]
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Distribution Management</h1>
          <p>Prospect Distribution (Efficiently distribute leads to your team and track assignment history.)</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> Assign Lead
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiTarget color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.total ?? 0}</h4>
            <p>Total Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-light)' }}>
            <FiUsers color="var(--info)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.active ?? 0}</h4>
            <p>Active Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiCheckSquare color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.completed ?? 0}</h4>
            <p>Completed Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiTarget color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.todayAssignments ?? 0}</h4>
            <p>Assigned Today</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by assignment, prospect, or employee..."
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
          {['assigned', 'in_progress', 'contacted', 'converted', 'closed'].map((status) => (
            <option key={status} value={status}>{status}</option>
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
                    <th>Assignment ID</th>
                    <th>Prospect</th>
                    <th>Assigned To</th>
                    <th>Assigned By</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {distributionList.length ? distributionList.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600 }}>{item.assignmentId}</td>
                      <td>
                        <div>{item.prospect?.firstName} {item.prospect?.lastName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.prospect?.email || '—'}</div>
                      </td>
                      <td>
                        <div>{item.assignedTo?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.assignedTo?.role || ''}</div>
                      </td>
                      <td>{item.assignedBy?.name || '—'}</td>
                      <td><span className={`badge ${item.status === 'converted' || item.status === 'closed' ? 'badge-success' : item.status === 'contacted' ? 'badge-info' : item.status === 'in_progress' ? 'badge-warning' : 'badge-primary'}`}>{item.status.replace('_', ' ')}</span></td>
                      <td><span className={`badge ${item.priority === 'high' ? 'badge-danger' : item.priority === 'medium' ? 'badge-warning' : 'badge-secondary'}`}>{item.priority}</span></td>
                      <td>{item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {isAdmin && (
                            <>
                              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(item)} title="Edit">
                                <FiEdit2 size={14} />
                              </button>
                              <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(item._id, item.assignmentId)} title="Delete">
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8}><div className="empty-state"><h3>No assignments found</h3></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>Showing {distributionList.length} of {total} assignments</span>
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
        title={editData ? 'Edit Lead Assignment' : 'Assign Prospect Lead'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="distribution-form" className="btn btn-primary">{editData ? 'Update' : 'Assign'}</button>
          </>
        }
      >
        <form id="distribution-form" onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prospect</label>
              <select className="form-control" required value={formData.prospect} onChange={(e) => setFormData((p) => ({ ...p, prospect: e.target.value }))}>
                <option value="">Select Prospect</option>
                {prospectOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign To Employee</label>
              <select className="form-control" required value={formData.assignedTo} onChange={(e) => setFormData((p) => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">Select Employee</option>
                {employeeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}>
                {['assigned', 'in_progress', 'contacted', 'converted', 'closed'].map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={formData.priority} onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))}>
                {['low', 'medium', 'high'].map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-control" value={formData.dueDate} onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))} />
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

export default DistributionPage;
