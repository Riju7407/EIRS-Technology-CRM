import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { websiteSyncService } from '../services/websiteSyncService';

const initialForm = {
  name: '',
  email: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  isAdmin: false,
};

const WebsiteUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        websiteSyncService.getUsers({ page: 1, limit: 500, search }),
        websiteSyncService.getStats(),
      ]);
      setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      setStats(statsRes.data?.stats || null);
    } catch (_) {
      toast.error('Failed to load website users');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const adminCount = useMemo(() => users.filter((item) => item.isAdmin).length, [users]);

  const openCreate = () => {
    setEditData(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditData(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      isAdmin: Boolean(user.isAdmin),
    });
    setShowForm(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      if (editData?._id) {
        await websiteSyncService.updateUser(editData._id, formData);
        toast.success('Website user updated');
      } else {
        await websiteSyncService.createUser(formData);
        toast.success('Website user created');
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save website user');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete website user "${name}"?`)) return;
    try {
      await websiteSyncService.deleteUser(id);
      toast.success('Website user deleted');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete website user');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Users</h1>
          <p>Users synced from EIRS website to CRM</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add User
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiUser color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.users ?? users.length}</h4>
            <p>Total Website Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiUser color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{adminCount}</h4>
            <p>Admin Accounts</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by name, email, phone, address"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading website users..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? users.map((user) => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phoneNumber || 'N/A'}</td>
                    <td>{[user.address, user.city, user.state, user.pincode].filter(Boolean).join(', ') || 'N/A'}</td>
                    <td>{user.isAdmin ? 'Admin' : 'Customer'}</td>
                    <td>{user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(user)} title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(user._id, user.name)} title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <h3>No website users found</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editData ? 'Edit Website User' : 'Add Website User'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="website-user-form" className="btn btn-primary">
              {editData ? 'Update User' : 'Create User'}
            </button>
          </>
        }
      >
        <form id="website-user-form" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                required
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                required
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                value={formData.phoneNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, phoneNumber: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                className="form-control"
                value={formData.pincode}
                onChange={(event) => setFormData((prev) => ({ ...prev, pincode: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-control"
                value={formData.city}
                onChange={(event) => setFormData((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                className="form-control"
                value={formData.state}
                onChange={(event) => setFormData((prev) => ({ ...prev, state: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.address}
              onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-control"
              value={formData.isAdmin ? 'admin' : 'customer'}
              onChange={(event) => setFormData((prev) => ({ ...prev, isAdmin: event.target.value === 'admin' }))}
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WebsiteUsersPage;
