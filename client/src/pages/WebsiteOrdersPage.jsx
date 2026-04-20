import React, { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiShoppingBag } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import { websiteSyncService } from '../services/websiteSyncService';

const WebsiteOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ordersRes, statsRes] = await Promise.all([
          websiteSyncService.getOrders({ page: 1, limit: 500, search, status }),
          websiteSyncService.getStats(),
        ]);
        setOrders(Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);
        setStats(statsRes.data?.stats || null);
      } catch (_) {
        toast.error('Failed to load website orders');
      }
      setLoading(false);
    };

    load();
  }, [search, status]);

  const revenue = useMemo(
    () => orders.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    [orders]
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Orders</h1>
          <p>Orders synced from EIRS website checkout</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiShoppingBag color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.orders ?? orders.length}</h4>
            <p>Total Website Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiShoppingBag color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>Rs {Math.round(revenue).toLocaleString()}</h4>
            <p>Visible Order Value</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by order id, customer, phone, email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select className="form-control" style={{ maxWidth: 180 }} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading website orders..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.externalOrderId}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.paymentMethod || 'N/A'}</div>
                    </td>
                    <td>
                      <div>{order.customerName || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.customerEmail || order.customerPhone || 'N/A'}</div>
                    </td>
                    <td>{Array.isArray(order.items) ? order.items.length : 0}</td>
                    <td style={{ fontWeight: 600 }}>Rs {Number(order.totalPrice || 0).toLocaleString()}</td>
                    <td><StatusBadge value={String(order.status || '').toLowerCase()} /></td>
                    <td><StatusBadge value={String(order.paymentStatus || '').toLowerCase()} /></td>
                    <td>{order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <h3>No website orders found</h3>
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

export default WebsiteOrdersPage;
