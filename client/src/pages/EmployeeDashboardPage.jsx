import React, { useEffect, useMemo, useState } from 'react';
import { FiBriefcase, FiCalendar, FiClock, FiEdit2, FiMail, FiMapPin, FiPhone, FiSave, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { employeeService } from '../services/employeeService';
import { distributionService } from '../services/distributionService';
import { useAuth } from '../context/AuthContext';

const defaultProfileForm = {
  name: '',
  email: '',
  phone: '',
  department: '',
  region: '',
  notes: '',
  currentPassword: '',
  newPassword: '',
};

const allowedStatuses = ['assigned', 'in_progress', 'contacted', 'converted', 'closed'];

const EmployeeDashboardPage = () => {
  const { user, updateUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState(defaultProfileForm);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [profileRes, assignmentsRes] = await Promise.all([
        employeeService.getMe(),
        distributionService.getMy({ page: 1, limit: 100 }),
      ]);

      const employeeData = profileRes?.data?.employee || null;
      const assignmentList = Array.isArray(assignmentsRes?.data?.distributions) ? assignmentsRes.data.distributions : [];

      setEmployee(employeeData);
      setAssignments(assignmentList);
      setProfileForm({
        name: employeeData?.name || user?.name || '',
        email: employeeData?.email || user?.email || '',
        phone: employeeData?.phone || '',
        department: employeeData?.department || '',
        region: employeeData?.region || '',
        notes: employeeData?.notes || '',
        currentPassword: '',
        newPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load employee dashboard');
      setAssignments([]);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => ({
    total: assignments.length,
    active: assignments.filter((item) => ['assigned', 'in_progress', 'contacted'].includes(item.status)).length,
    completed: assignments.filter((item) => ['converted', 'closed'].includes(item.status)).length,
  }), [assignments]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        department: profileForm.department,
        region: profileForm.region,
        notes: profileForm.notes,
      };

      if (profileForm.newPassword) {
        payload.currentPassword = profileForm.currentPassword;
        payload.newPassword = profileForm.newPassword;
      }

      const { data } = await employeeService.updateMe(payload);
      const updatedEmployee = data?.employee || null;
      const updatedUser = data?.user || null;

      if (updatedEmployee) setEmployee(updatedEmployee);
      if (updatedUser) updateUser(updatedUser);

      setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      toast.success('Profile updated successfully');
      setShowProfileForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleStatusChange = async (assignmentId, nextStatus) => {
    setStatusSavingId(assignmentId);
    try {
      const { data } = await distributionService.updateMy(assignmentId, { status: nextStatus });
      const updated = data?.distribution;
      setAssignments((prev) => prev.map((item) => (item._id === assignmentId ? updated : item)));
      toast.success('Assignment status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusSavingId('');
    }
  };

  if (loading) {
    return <Spinner text="Loading employee dashboard..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employee Dashboard</h1>
          <p>View your assigned work and update your profile</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowProfileForm(true)}>
          <FiEdit2 /> Edit Profile
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiBriefcase color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats.total}</h4>
            <p>Total Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiClock color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{stats.active}</h4>
            <p>Active Work</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiCalendar color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{stats.completed}</h4>
            <p>Completed</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>My Profile</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowProfileForm(true)}>
            <FiEdit2 size={14} /> Edit
          </button>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <div className="form-control" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiMail /> {employee?.email || user?.email || '—'}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone</label>
              <div className="form-control" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiPhone /> {employee?.phone || '—'}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Department</label>
              <div className="form-control">{employee?.department || '—'}</div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Region</label>
              <div className="form-control" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiMapPin /> {employee?.region || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Assigned Work</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Service Request</th>
                <th>Current Status</th>
                <th>Priority</th>
                <th>Assigned On</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length ? assignments.map((item) => (
                <tr key={item._id}>
                  <td style={{ fontWeight: 600 }}>{item.assignmentId}</td>
                  <td>
                    <div>{item.prospect?.firstName} {item.prospect?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.prospect?.company || item.prospect?.email || '—'}</div>
                  </td>
                  <td>{String(item.status || '').replace('_', ' ')}</td>
                  <td>{String(item.priority || '').charAt(0).toUpperCase() + String(item.priority || '').slice(1)}</td>
                  <td>{item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <select
                      className="form-control"
                      value={item.status}
                      disabled={statusSavingId === item._id}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    >
                      {allowedStatuses.map((status) => (
                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <h3>No assignments yet</h3>
                      <p>Assignments will appear here when an admin allocates work to you.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showProfileForm}
        onClose={() => setShowProfileForm(false)}
        title="Edit My Profile"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowProfileForm(false)}>Cancel</button>
            <button type="submit" form="employee-profile-form" className="btn btn-primary" disabled={savingProfile}>
              <FiSave /> {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="employee-profile-form" onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-control" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" value={profileForm.department} onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Region</label>
              <input className="form-control" value={profileForm.region} onChange={(e) => setProfileForm((prev) => ({ ...prev, region: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} value={profileForm.notes} onChange={(e) => setProfileForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" value={profileForm.currentPassword} onChange={(e) => setProfileForm((prev) => ({ ...prev, currentPassword: e.target.value }))} placeholder="Required only when changing password" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" value={profileForm.newPassword} onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))} placeholder="Leave blank to keep current password" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboardPage;