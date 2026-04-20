import React, { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { websiteSyncService } from '../services/websiteSyncService';

const WebsiteUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
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

    load();
  }, [search]);

  const adminCount = useMemo(() => users.filter((item) => item.isAdmin).length, [users]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Users</h1>
          <p>Users synced from EIRS website to CRM</p>
        </div>
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
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6}>
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
    </div>
  );
};

export default WebsiteUsersPage;
