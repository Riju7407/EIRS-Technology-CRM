import React, { useEffect, useState } from 'react';
import { FiMail, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { websiteSyncService } from '../services/websiteSyncService';

const WebsiteContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [contactsRes, statsRes] = await Promise.all([
          websiteSyncService.getContacts({ page: 1, limit: 500, search }),
          websiteSyncService.getStats(),
        ]);
        setContacts(Array.isArray(contactsRes.data?.contacts) ? contactsRes.data.contacts : []);
        setStats(statsRes.data?.stats || null);
      } catch (_) {
        toast.error('Failed to load website contacts');
      }
      setLoading(false);
    };

    load();
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Contact Enquiries</h1>
          <p>Contact form submissions synced from website</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiMail color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.contacts ?? contacts.length}</h4>
            <p>Total Contact Requests</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by name, email, phone, subject"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading website contacts..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length ? contacts.map((contact) => (
                  <tr key={contact._id}>
                    <td style={{ fontWeight: 600 }}>{contact.name || 'N/A'}</td>
                    <td>
                      <div>{contact.email || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.phoneNumber || 'N/A'}</div>
                    </td>
                    <td>{contact.subject || 'N/A'}</td>
                    <td style={{ minWidth: 280 }}>{contact.message || 'N/A'}</td>
                    <td>{contact.createdAt ? format(new Date(contact.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <h3>No website contact requests found</h3>
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

export default WebsiteContactsPage;
