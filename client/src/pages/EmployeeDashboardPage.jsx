import React, { useEffect, useState } from 'react';
import { FiBriefcase, FiCalendar, FiClock, FiMail, FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { employeeService } from '../services/employeeService';

const EmployeeDashboardPage = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await employeeService.getMe();
        setEmployee(data.employee || null);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <Spinner text="Loading employee dashboard..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employee Dashboard</h1>
          <p>Your personal profile and account status</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiUser color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{employee?.name || '—'}</h4>
            <p>Employee Name</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiBriefcase color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{employee?.role || '—'}</h4>
            <p>Job Role</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiClock color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{employee?.status || '—'}</h4>
            <p>Status</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>My Profile</h3>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <div className="form-control" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiMail /> {employee?.email || '—'}
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Joined At</label>
              <div className="form-control" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiCalendar /> {employee?.joinedAt ? new Date(employee.joinedAt).toLocaleDateString() : '—'}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Account Status</label>
              <div className="form-control">{employee?.status || '—'}</div>
            </div>
          </div>

          <div className="card" style={{ margin: 0, background: 'var(--background-secondary)' }}>
            <div className="card-body">
              <h3 style={{ marginTop: 0 }}>What you can do here</h3>
              <p style={{ marginBottom: 0, color: 'var(--text-muted)' }}>
                This account is linked to your employee record. Use this dashboard to verify your profile details and sign out when you are done.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;