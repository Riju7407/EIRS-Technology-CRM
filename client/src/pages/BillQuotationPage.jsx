import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiFileText, FiPlus, FiShoppingBag, FiTrash2, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { clientService } from '../services/clientService';
import Spinner from '../components/common/Spinner';

const createQuoteNumber = () => {
  const datePart = format(new Date(), 'yyyyMMdd');
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `Q-${datePart}-${randomPart}`;
};

const blankItem = { description: '', quantity: 1, rate: 0 };

const BillQuotationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [quoteNumber, setQuoteNumber] = useState(createQuoteNumber());
  const [selectedClientId, setSelectedClientId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);
  const [notes, setNotes] = useState('Thank you for your business. This quotation is valid for 7 days.');
  const [items, setItems] = useState([blankItem]);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const { data } = await clientService.getAll({ page: 1, limit: 500 });
        setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (_) {
        toast.error('Failed to load customers for quotation');
      }
      setLoading(false);
    };

    loadClients();
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client._id === selectedClientId),
    [clients, selectedClientId]
  );

  const computed = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
    const safeDiscount = Math.max(0, Number(discount || 0));
    const taxableAmount = Math.max(0, subtotal - safeDiscount);
    const taxAmount = (taxableAmount * Number(taxPercent || 0)) / 100;
    const total = taxableAmount + taxAmount;
    return { subtotal, safeDiscount, taxableAmount, taxAmount, total };
  }, [discount, items, taxPercent]);

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, blankItem]);
  };

  const removeItem = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const saveAsPurchase = async () => {
    if (!selectedClientId) {
      toast.error('Select a customer before saving quotation');
      return;
    }

    const validItems = items.filter((item) => item.description && Number(item.quantity) > 0 && Number(item.rate) >= 0);
    if (!validItems.length) {
      toast.error('Add at least one valid quotation item');
      return;
    }

    setSaving(true);
    try {
      await clientService.addPurchase(selectedClientId, {
        product: `Quotation ${quoteNumber} (${validItems.length} items)`,
        amount: Number(computed.total.toFixed(2)),
        invoiceNumber: quoteNumber,
        status: 'pending',
        notes,
      });
      toast.success('Quotation saved into purchase history');
      navigate('/purchase-history');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save quotation');
    }
    setSaving(false);
  };

  const resetQuote = () => {
    setQuoteNumber(createQuoteNumber());
    setSelectedClientId('');
    setDiscount(0);
    setTaxPercent(18);
    setNotes('Thank you for your business. This quotation is valid for 7 days.');
    setItems([blankItem]);
  };

  if (loading) {
    return <Spinner text="Loading quotation module..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bill Quotation</h1>
          <p>Create professional quotations and convert them to purchase records</p>
        </div>
        <div className="client-actions">
          <Link className="btn btn-secondary" to="/customer-details">
            <FiUsers /> Customer Details
          </Link>
          <Link className="btn btn-secondary" to="/purchase-history">
            <FiShoppingBag /> Purchase History
          </Link>
          <button className="btn btn-secondary" onClick={resetQuote}>New Quote</button>
          <button className="btn btn-secondary" onClick={() => window.print()}>Print</button>
          <button className="btn btn-primary" onClick={saveAsPurchase} disabled={saving}>
            {saving ? 'Saving...' : 'Save As Purchase'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body quotation-grid">
          <div className="form-group">
            <label className="form-label">Quotation Number</label>
            <input className="form-control" value={quoteNumber} onChange={(event) => setQuoteNumber(event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Quotation Date</label>
            <input className="form-control" value={format(new Date(), 'dd MMM yyyy')} readOnly />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Customer</label>
            <select className="form-control" value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>
              <option value="">Select customer</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>{client.firstName} {client.lastName} ({client.phone})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedClient && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>Customer Details</h3>
            <span className="badge badge-primary">Complete Profile</span>
          </div>
          <div className="card-body quotation-grid">
            <div><strong>Name:</strong> {selectedClient.firstName} {selectedClient.lastName}</div>
            <div><strong>Company:</strong> {selectedClient.company || 'N/A'}</div>
            <div><strong>Email:</strong> {selectedClient.email}</div>
            <div><strong>Phone:</strong> {selectedClient.phone}</div>
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Address:</strong> {[selectedClient.address?.street, selectedClient.address?.city, selectedClient.address?.state, selectedClient.address?.zipCode, selectedClient.address?.country].filter(Boolean).join(', ') || 'N/A'}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Quotation Items</h3>
          <button className="btn btn-secondary btn-sm" onClick={addItem}>
            <FiPlus /> Add Item
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const lineAmount = Number(item.quantity || 0) * Number(item.rate || 0);
                return (
                  <tr key={index}>
                    <td>
                      <input
                        className="form-control"
                        value={item.description}
                        onChange={(event) => updateItem(index, 'description', event.target.value)}
                        placeholder="Service or product description"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, 'quantity', Number(event.target.value || 0))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={item.rate}
                        onChange={(event) => updateItem(index, 'rate', Number(event.target.value || 0))}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>Rs {lineAmount.toLocaleString()}</td>
                    <td>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(index)} title="Remove item">
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Quotation Summary</h3>
          <span className="badge badge-info">
            <FiFileText style={{ marginRight: 4 }} /> {quoteNumber}
          </span>
        </div>
        <div className="card-body quotation-summary">
          <div className="summary-controls">
            <div className="form-group">
              <label className="form-label">Discount (Rs)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={discount}
                onChange={(event) => setDiscount(Number(event.target.value || 0))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tax (%)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={taxPercent}
                onChange={(event) => setTaxPercent(Number(event.target.value || 0))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quotation Notes</label>
              <textarea className="form-control" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>

          <div className="summary-values">
            <div className="summary-row"><span>Subtotal</span><strong>Rs {computed.subtotal.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Discount</span><strong>Rs {computed.safeDiscount.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Tax</span><strong>Rs {computed.taxAmount.toLocaleString()}</strong></div>
            <div className="summary-row total"><span>Grand Total</span><strong>Rs {computed.total.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillQuotationPage;
