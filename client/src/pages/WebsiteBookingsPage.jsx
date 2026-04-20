import React, { useEffect, useState } from 'react';
import { FiCalendar, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { websiteSyncService } from '../services/websiteSyncService';

const WebsiteBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bookingsRes, statsRes] = await Promise.all([
          websiteSyncService.getBookings({ page: 1, limit: 500, search }),
          websiteSyncService.getStats(),
        ]);
        setBookings(Array.isArray(bookingsRes.data?.bookings) ? bookingsRes.data.bookings : []);
        setStats(statsRes.data?.stats || null);
      } catch (_) {
        toast.error('Failed to load service bookings');
      }
      setLoading(false);
    };

    load();
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Service Bookings</h1>
          <p>Service booking requests synced from website</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiCalendar color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.bookings ?? bookings.length}</h4>
            <p>Total Website Bookings</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by service, customer, phone, email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading website bookings..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Preferred Date</th>
                  <th>Address</th>
                  <th>Booked At</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length ? bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.serviceName || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rs {Number(booking.servicePrice || 0).toLocaleString()}</div>
                    </td>
                    <td>{booking.customerName || 'N/A'}</td>
                    <td>{booking.phoneNumber || 'N/A'}</td>
                    <td>{booking.email || 'N/A'}</td>
                    <td>{booking.preferredDate ? format(new Date(booking.preferredDate), 'dd MMM yyyy') : 'N/A'}</td>
                    <td>{booking.address || 'N/A'}</td>
                    <td>{booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <h3>No website bookings found</h3>
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

export default WebsiteBookingsPage;
