import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiPlus, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { clientService } from '../services/clientService';
import { interactionService } from '../services/interactionService';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import ClientForm from '../components/clients/ClientForm';
import InteractionForm from '../components/interactions/InteractionForm';
import FollowUpForm from '../components/followups/FollowUpForm';
import { format } from 'date-fns';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, iRes] = await Promise.all([
        clientService.getById(id),
        interactionService.getClientInteractions(id),
      ]);
      setClient(cRes.data.client);
      setInteractions(iRes.data.interactions);
    } catch (_) {
      toast.error('Failed to load client data');
      navigate('/clients');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  if (loading) return <Spinner text="Loading client profile..." />;
  if (!client) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/clients" className="btn btn-secondary btn-icon">
          <FiArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{client.firstName} {client.lastName}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{client.company || 'Individual Client'}</p>
        </div>
        <StatusBadge value={client.status} />
        <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
          <FiEdit2 size={14} /> Edit
        </button>
        <button className="btn btn-primary" onClick={() => setShowFollowUp(true)}>
          <FiPlus size={14} /> Follow-Up
        </button>
        <button className="btn btn-secondary" onClick={() => setShowInteraction(true)}>
          <FiPlus size={14} /> Log Interaction
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Contact Info */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Contact Information</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FiMail color="var(--primary)" />
                  <span style={{ fontSize: 14 }}>{client.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FiPhone color="var(--primary)" />
                  <span style={{ fontSize: 14 }}>{client.phone}</span>
                </div>
                {client.alternatePhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiPhone color="var(--text-muted)" />
                    <span style={{ fontSize: 14 }}>{client.alternatePhone}</span>
                  </div>
                )}
                {(client.address?.city || client.address?.state) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiMapPin color="var(--primary)" />
                    <span style={{ fontSize: 14 }}>
                      {[client.address.city, client.address.state, client.address.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Client Details</h3></div>
            <div className="card-body">
              {[
                { label: 'Status', value: <StatusBadge value={client.status} /> },
                { label: 'Source', value: client.source?.replace('_', ' ') },
                { label: 'Assigned To', value: client.assignedTo?.name || 'Unassigned' },
                { label: 'Total Purchases', value: client.totalPurchaseValue > 0 ? `₹${client.totalPurchaseValue.toLocaleString()}` : '₹0' },
                { label: 'Added On', value: format(new Date(client.createdAt), 'dd MMM yyyy') },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {client.tags?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3>Tags</h3></div>
              <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {client.tags.map((tag) => (
                  <span key={tag} className="badge badge-primary">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Purchase History + Interactions */}
        <div>
          {/* Purchase History */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3>Purchase History</h3>
              <span className="badge badge-primary">{client.purchaseHistory?.length || 0}</span>
            </div>
            {client.purchaseHistory?.length ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Product</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {client.purchaseHistory.map((p, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{p.product}</div>
                          {p.invoiceNumber && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{p.invoiceNumber}</div>}
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{p.amount?.toLocaleString()}</td>
                        <td style={{ fontSize: 12 }}>{format(new Date(p.date), 'dd MMM yyyy')}</td>
                        <td><StatusBadge value={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><p>No purchase history</p></div>
            )}
          </div>

          {/* Interaction Log */}
          <div className="card">
            <div className="card-header">
              <h3>Interaction History</h3>
              <span className="badge badge-purple">{interactions.length}</span>
            </div>
            <div className="card-body" style={{ padding: '0 20px' }}>
              {interactions.length ? (
                interactions.map((inter) => (
                  <div key={inter._id} className="interaction-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{inter.subject}</div>
                      <StatusBadge value={inter.status} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                      {inter.description}
                    </div>
                    <div className="interaction-meta">
                      <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{inter.type}</span>
                      <span>via {inter.channel?.replace('_', ' ')}</span>
                      <span>by {inter.loggedBy?.name}</span>
                      <span>{format(new Date(inter.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                      {inter.sentiment && (
                        <span style={{
                          color: inter.sentiment === 'positive' ? 'var(--success)' : inter.sentiment === 'negative' ? 'var(--danger)' : 'var(--text-secondary)',
                          fontWeight: 600, textTransform: 'capitalize'
                        }}>
                          {inter.sentiment}
                        </span>
                      )}
                    </div>
                    {inter.resolution && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--success-light)', borderRadius: 6, fontSize: 13 }}>
                        <strong>Resolution:</strong> {inter.resolution}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No interactions logged yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClientForm isOpen={showEdit} onClose={() => setShowEdit(false)} editData={client} onSaved={loadData} />
      <InteractionForm isOpen={showInteraction} onClose={() => setShowInteraction(false)} preselectedClient={id} onSaved={loadData} />
      <FollowUpForm isOpen={showFollowUp} onClose={() => setShowFollowUp(false)} preselectedClient={id} onSaved={() => {}} />
    </div>
  );
};

export default ClientDetailPage;
