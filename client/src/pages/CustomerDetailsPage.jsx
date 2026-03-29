import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiFileText, FiSearch, FiShoppingBag, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import { clientService } from '../services/clientService';

const getAddress = (address = {}) => {
  const parts = [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'N/A';
};

const CustomerDetailsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await clientService.getAll({ page: 1, limit: 500, search: filters.search, status: filters.status });
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (_) {
      toast.error('Failed to load customer details');
    }
    setLoading(false);
  }, [filters.search, filters.status]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((client) => client.status === 'active').length;
    const leads = clients.filter((client) => ['lead', 'prospect'].includes(client.status)).length;
    return { total, active, leads };
  }, [clients]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customer Details</h1>
          <p>View and manage complete customer records in one place</p>
        </div>
        <div className="client-actions">
          <Link className="btn btn-secondary" to="/purchase-history">
            <FiShoppingBag /> Purchase History
          </Link>
          <Link className="btn btn-primary" to="/bill-quotation">
            <FiFileText /> Create Quotation
          </Link>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiUsers color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats.total}</h4>
            <p>Total Customers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiUsers color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{stats.active}</h4>
            <p>Active Customers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiUsers color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{stats.leads}</h4>
            <p>Leads And Prospects</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by name, phone, email, company"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
        </div>
        <select
          className="form-control"
          style={{ maxWidth: 180 }}
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="lead">Lead</option>
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading customer details..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Total Purchase</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length ? clients.map((client) => (
                  <tr key={client._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{client.firstName} {client.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.tags?.join(', ') || 'No tags'}</div>
                    </td>
                    <td>
                      <div>{client.phone}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.email}</div>
                    </td>
                    <td>{client.company || 'N/A'}</td>
                    <td style={{ minWidth: 260 }}>{getAddress(client.address)}</td>
                    <td><StatusBadge value={client.status} /></td>
                    <td style={{ textTransform: 'capitalize' }}>{client.source?.replace('_', ' ') || 'other'}</td>
                    <td style={{ fontWeight: 600 }}>Rs {Number(client.totalPurchaseValue || 0).toLocaleString()}</td>
                    <td>
                      <Link className="btn btn-secondary btn-icon btn-sm" to={`/clients/${client._id}`} title="View details">
                        <FiEye size={14} />
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <h3>No customer records found</h3>
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

export default CustomerDetailsPage;
