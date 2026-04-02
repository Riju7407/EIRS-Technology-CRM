import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiFileText, FiPlus, FiSearch, FiShoppingBag, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import { clientService } from '../services/clientService';

const defaultPurchase = {
  clientId: '',
  product: '',
  amount: '',
  invoiceNumber: '',
  status: 'completed',
  notes: '',
};

const PurchaseHistoryPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [purchase, setPurchase] = useState(defaultPurchase);
  const [filters, setFilters] = useState({ search: '', status: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await clientService.getAll({ page: 1, limit: 500 });
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (_) {
      toast.error('Failed to load purchase history');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const purchases = useMemo(() => {
    const rows = [];

    clients.forEach((client) => {
      (client.purchaseHistory || []).forEach((item, index) => {
        rows.push({
          id: `${client._id}-${index}`,
          clientId: client._id,
          clientName: `${client.firstName} ${client.lastName}`,
          company: client.company || 'N/A',
          product: item.product,
          amount: Number(item.amount || 0),
          invoiceNumber: item.invoiceNumber || 'N/A',
          date: item.date,
          status: item.status,
          notes: item.notes || '',
        });
      });
    });

    return rows
      .filter((item) => {
        const query = filters.search.toLowerCase().trim();
        const bySearch = query
          ? [item.clientName, item.product, item.invoiceNumber, item.company].join(' ').toLowerCase().includes(query)
          : true;
        const byStatus = filters.status ? item.status === filters.status : true;
        return bySearch && byStatus;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [clients, filters.search, filters.status]);

  const stats = useMemo(() => {
    const totalAmount = purchases.reduce((sum, item) => sum + item.amount, 0);
    const pending = purchases.filter((item) => item.status === 'pending').length;
    const completed = purchases.filter((item) => item.status === 'completed').length;
    return { totalAmount, pending, completed };
  }, [purchases]);

  const resetForm = () => {
    setPurchase(defaultPurchase);
    setShowModal(false);
  };

  const handleStatusChange = async (itemId, newStatus) => {
    const [clientId, index] = itemId.split('-');
    setUpdatingStatus(itemId);
    try {
      await clientService.updatePurchaseStatus(clientId, index, newStatus);
      toast.success('Purchase status updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
    setUpdatingStatus(null);
  };

  const savePurchase = async (event) => {
    event.preventDefault();
    if (!purchase.clientId) {
      toast.error('Select a customer first');
      return;
    }

    setSaving(true);
    try {
      await clientService.addPurchase(purchase.clientId, {
        product: purchase.product,
        amount: Number(purchase.amount || 0),
        invoiceNumber: purchase.invoiceNumber,
        status: purchase.status,
        notes: purchase.notes,
      });
      toast.success('Purchase entry added');
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add purchase');
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Purchase History</h1>
          <p>Track all customer purchases, invoices, and payment states</p>
        </div>
        <div className="client-actions">
          <Link className="btn btn-secondary" to="/customer-details">
            <FiUsers /> Customer Details
          </Link>
          <Link className="btn btn-secondary" to="/bill-quotation">
            <FiFileText /> New Quotation
          </Link>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Add Purchase
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiShoppingBag color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>Rs {Math.round(stats.totalAmount).toLocaleString()}</h4>
            <p>Total Purchase Value</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiShoppingBag color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{stats.completed}</h4>
            <p>Completed Purchases</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FiShoppingBag color="var(--warning)" />
          </div>
          <div className="stat-info">
            <h4>{stats.pending}</h4>
            <p>Pending Payments</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by customer, product, invoice, company"
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
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading purchase history..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length ? purchases.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.clientName}</td>
                    <td>{item.company}</td>
                    <td>{item.product}</td>
                    <td style={{ fontWeight: 600 }}>Rs {item.amount.toLocaleString()}</td>
                    <td>{item.invoiceNumber}</td>
                    <td>{item.date ? format(new Date(item.date), 'dd MMM yyyy') : 'N/A'}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ minWidth: 100, padding: '4px 8px', fontSize: '0.875rem' }}
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        disabled={updatingStatus === item.id}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{item.notes || 'N/A'}</td>
                    <td>
                      <Link className="btn btn-secondary btn-icon btn-sm" to={`/clients/${item.clientId}`} title="Open customer profile">
                        <FiEye size={14} />
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <h3>No purchases found</h3>
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
        isOpen={showModal}
        onClose={resetForm}
        title="Add Purchase Entry"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            <button type="submit" form="purchase-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Purchase'}
            </button>
          </>
        }
      >
        <form id="purchase-form" onSubmit={savePurchase}>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className="form-control"
              value={purchase.clientId}
              onChange={(event) => setPurchase((prev) => ({ ...prev, clientId: event.target.value }))}
              required
            >
              <option value="">Select customer</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>{client.firstName} {client.lastName} ({client.phone})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product</label>
              <input
                className="form-control"
                value={purchase.product}
                onChange={(event) => setPurchase((prev) => ({ ...prev, product: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={purchase.amount}
                onChange={(event) => setPurchase((prev) => ({ ...prev, amount: event.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Invoice Number</label>
              <input
                className="form-control"
                value={purchase.invoiceNumber}
                onChange={(event) => setPurchase((prev) => ({ ...prev, invoiceNumber: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={purchase.status}
                onChange={(event) => setPurchase((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              rows={3}
              className="form-control"
              value={purchase.notes}
              onChange={(event) => setPurchase((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseHistoryPage;
