import React, { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiEdit2, FiPlus, FiSearch, FiTrash2, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  region: '',
  status: 'active',
  notes: '',
};

const EmployeesPage = () => {
  const { isAdmin } = useAuth();
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
      const [listRes, statsRes] = await Promise.all([
        employeeService.getAll(filters),
        employeeService.getStats(),
      ]);
      const employeeList = Array.isArray(listRes?.data?.employees) ? listRes.data.employees : [];
      setEmployees(employeeList);
      setTotal(Number(listRes?.data?.total) || 0);
      setTotalPages(Number(listRes?.data?.totalPages) || 1);
      setStats(statsRes.data.stats);
    } catch (_) {
      toast.error('Failed to load employees');
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
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      role: item.role || '',
      department: item.department || '',
      region: item.region || '',
      status: item.status || 'active',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData?._id) {
        await employeeService.update(editData._id, formData);
        toast.success('Employee updated successfully');
      } else {
        await employeeService.create(formData);
        toast.success('Employee added successfully');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete employee "${name}"?`)) return;
    try {
      await employeeService.delete(id);
      toast.success('Employee deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const employeeList = Array.isArray(employees) ? employees : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>Manage team members, assignments, and availability</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add Employee
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiUsers color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.total ?? 0}</h4>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiCheckCircle color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.active ?? 0}</h4>
            <p>Available Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiClock color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.onLeave ?? 0}</h4>
            <p>On Leave</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search employees..."
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
          {['active', 'on-leave', 'inactive'].map((status) => (
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeList.length ? employeeList.map((employee) => (
                    <tr key={employee._id}>
                      <td style={{ fontWeight: 600 }}>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.phone || '—'}</td>
                      <td>{employee.role}</td>
                      <td>{employee.region || '—'}</td>
                      <td><span className={`badge ${employee.status === 'active' ? 'badge-success' : employee.status === 'on-leave' ? 'badge-warning' : 'badge-secondary'}`}>{employee.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(employee)} title="Edit">
                            <FiEdit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(employee._id, employee.name)} title="Delete">
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}><div className="empty-state"><h3>No employees found</h3></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>Showing {employeeList.length} of {total} employees</span>
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
        title={editData ? 'Edit Employee' : 'Add Employee'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="employee-form" className="btn btn-primary">{editData ? 'Update' : 'Create'}</button>
          </>
        }
      >
        <form id="employee-form" onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-control" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-control" required value={formData.role} onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" value={formData.department} onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <input className="form-control" value={formData.region} onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}>
              {['active', 'on-leave', 'inactive'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
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

export default EmployeesPage;
