import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiDownload, FiFileText, FiPlus, FiShoppingBag, FiTrash2, FiUsers, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { clientService } from '../services/clientService';
import { quotationService } from '../services/quotationService';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';

const createQuoteNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const nextYearShort = String((year + 1) % 100).padStart(2, '0');
  const currentYearShort = String(year % 100).padStart(2, '0');
  const sequence = Math.floor(100 + Math.random() * 900);
  return `EIRS/${currentYearShort}-${nextYearShort}/${sequence}`;
};

const blankItem = { description: '', quantity: 1, rate: 0 };

const COMPANY = {
  name: 'EIRS TECHNOLOGY',
  address: '568/168 BARABIRWA LDA COLONY BARABIRWA KANPUR ROAD NEAR PICADLY HOTEL',
  mob: '9250448391, 9455304151',
  gstin: '09LSWPS0858P1Z4',
  email: 'eirstech@gmail.com',
  ifsc: 'SBIN0016730',
  accountNo: '39855113661',
  bank: 'State Bank of India, KANPUR ROAD, LUCKNOW',
};

const BRAND_PARTNER_LOGOS = [
  'https://res.cloudinary.com/dfitjwwws/image/upload/q_auto/f_auto/v1771049898/essl_yqrq00.png',
  'https://res.cloudinary.com/dfitjwwws/image/upload/q_auto/f_auto/v1771049857/secureye_sdesva.png',
  'https://res.cloudinary.com/dfitjwwws/image/upload/q_auto/f_auto/v1771049791/matrix_hg8ewh.png',
  'https://res.cloudinary.com/dfitjwwws/image/upload/q_auto/f_auto/v1771049710/beelet_lxbfh3.png',
  'https://res.cloudinary.com/dfitjwwws/image/upload/q_auto/f_auto/v1771049649/hikvision_i8oipb.png',
  'https://res.cloudinary.com/dfitjwwws/image/upload/q_auto/f_auto/v1771049516/cp_plus_xgmoke.png',
  'https://res.cloudinary.com/dfitjwwws/image/upload/q_auto/f_auto/v1771049612/dahua_ftbmkx.png',
];

const formatRupees = (value) => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// Helper function to fetch image from URL and convert to data URL
const fetchImageAsDataURL = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

const BillQuotationPage = () => {
  const { isAdmin } = useAuth();
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

  const saveQuotation = async () => {
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
      const quotationData = {
        quoteNumber,
        clientId: selectedClientId,
        items: validItems,
        discount: Number(discount || 0),
        taxPercent: Number(taxPercent || 0),
        notes,
        subtotal: Number(computed.subtotal.toFixed(2)),
        taxAmount: Number(computed.taxAmount.toFixed(2)),
        total: Number(computed.total.toFixed(2)),
        pdfData: {
          quoteNumber,
          clientName: selectedClient ? `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() : '',
          clientPhone: selectedClient?.phone,
          clientAddress: [
            selectedClient?.address?.street,
            selectedClient?.address?.city,
            selectedClient?.address?.state,
            selectedClient?.address?.zipCode,
          ]
            .filter(Boolean)
            .join(', '),
          items: validItems,
          discount,
          taxPercent,
          notes,
          total: computed.total,
        },
      };

      await quotationService.create(quotationData);
      toast.success('Quotation saved successfully');
      resetQuote();
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

  const downloadQuotationPdf = async () => {
    if (!selectedClientId) {
      toast.error('Select a customer before downloading quotation PDF');
      return;
    }

    const validItems = items.filter((item) => item.description && Number(item.quantity) > 0);
    if (!validItems.length) {
      toast.error('Add at least one item before downloading PDF');
      return;
    }

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    // Add watermark
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(30); // Reduced from 60
    pdf.setTextColor(230, 230, 230); // Very light gray
    
    // Add watermark text at 45-degree angle, repeated across the page with larger gaps
    for (let x = -pageWidth; x < pageWidth * 2; x += 300) { // Increased gap from 200 to 300
      for (let y = -100; y < pageHeight + 100; y += 220) { // Increased gap from 150 to 220
        pdf.text('EIRS Technology', x, y, { angle: 45 });
      }
    }
    
    // Reset color for main content
    pdf.setTextColor(0, 0, 0);

    // Add colored header background
    pdf.setFillColor(41, 128, 185); // Professional blue
    pdf.rect(0, 30, pageWidth, 45, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255); // White text
    pdf.text('QUOTATION', centerX, 48, { align: 'center' });

    // Display company name in white for better visibility
    pdf.setTextColor(255, 255, 255); // White color
    pdf.setFontSize(14);
    pdf.text(COMPANY.name, centerX, 70, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text(COMPANY.address, centerX, 88, { align: 'center' });

    pdf.setFontSize(9.5);
    pdf.text(`MOB- ${COMPANY.mob}`, 40, 100);
    pdf.text(`GSTIN- ${COMPANY.gstin}`, pageWidth - 210, 100);
    pdf.text(`EMAIL- ${COMPANY.email}`, 40, 116);
    pdf.text(`QUOTATION NO- ${quoteNumber}`, pageWidth - 240, 116);

    const clientName = selectedClient
      ? `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim()
      : '';
    const clientAddress = [
      selectedClient?.address?.street,
      selectedClient?.address?.city,
      selectedClient?.address?.state,
      selectedClient?.address?.zipCode,
      selectedClient?.address?.country,
    ]
      .filter(Boolean)
      .join(', ');

    pdf.setFont('helvetica', 'bold');
    pdf.text('NAME-', 40, 145);
    pdf.text('MOB. NO.-', 320, 145);
    pdf.text(format(new Date(), 'dd-MM-yyyy'), pageWidth - 90, 145);
    pdf.text('ADDRESS-', 40, 162);
    pdf.text('QUOTATION DATE', 320, 162);

    pdf.setFont('helvetica', 'normal');
    pdf.text(clientName || '-', 85, 145);
    pdf.text(selectedClient?.phone || '-', 380, 145);
    pdf.text(clientAddress || '-', 95, 162);

    autoTable(pdf, {
      startY: 178,
      head: [['S NO.', 'PRODUCT', 'DESCRIPTION', 'QTY', 'PRICE', 'AMOUNT']],
      body: validItems.map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.rate || 0);
        return [
          String(index + 1),
          item.description,
          notes || '-',
          String(quantity),
          formatRupees(price),
          formatRupees(quantity * price),
        ];
      }),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, lineColor: [35, 35, 35], lineWidth: 0.3 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 130 },
        2: { cellWidth: 120 },
        3: { cellWidth: 45, halign: 'right' },
        4: { cellWidth: 70, halign: 'right' },
        5: { cellWidth: 75, halign: 'right' },
      },
      margin: { left: 40, right: 40 },
    });

    const tableEndY = pdf.lastAutoTable?.finalY || 300;
    const summaryY = tableEndY + 18;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 128, 185); // Blue color
    pdf.text('SUBTOTAL', 40, summaryY);
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text(formatRupees(computed.total), pageWidth - 40, summaryY, { align: 'right' });

    const detailTop = summaryY + 28;
    const boxWidth = (pageWidth - 100) / 2;
    const leftX = 40;
    const rightX = leftX + boxWidth + 20;
    const boxHeight = 160;
    
    // Add colored backgrounds to boxes
    pdf.setFillColor(230, 240, 250); // Very light blue
    pdf.rect(leftX, detailTop, boxWidth, boxHeight, 'F');
    pdf.rect(rightX, detailTop, boxWidth, boxHeight, 'F');
    
    // Draw borders
    pdf.setDrawColor(41, 128, 185); // Blue borders
    pdf.setLineWidth(1);
    pdf.rect(leftX, detailTop, boxWidth, boxHeight);
    pdf.rect(rightX, detailTop, boxWidth, boxHeight);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(41, 128, 185); // Blue text
    pdf.text('TERM AND CONDITION', leftX + boxWidth / 2, detailTop + 16, { align: 'center' });
    pdf.text('BANK DETAIL', rightX + boxWidth / 2, detailTop + 16, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0); // Black text
    const terms = [
      '1. Goods once sold will not be taken or exchanged.',
      '2. All disputes are subject to Lucknow jurisdiction only.',
      "3. We don't take personal warranty of any item.",
      '4. All warranty and replacement is done by authorized company.',
    ];
    let termY = detailTop + 34;
    terms.forEach((line) => {
      pdf.text(line, leftX + 8, termY, { maxWidth: boxWidth - 16 });
      termY += 18;
    });

    pdf.text(`Name: ${COMPANY.name}`, rightX + 8, detailTop + 36, { maxWidth: boxWidth - 16 });
    pdf.text(`IFSC Code: ${COMPANY.ifsc}`, rightX + 8, detailTop + 54);
    pdf.text(`Account No. ${COMPANY.accountNo}`, rightX + 8, detailTop + 72);
    pdf.text(`Bank: ${COMPANY.bank}`, rightX + 8, detailTop + 90, { maxWidth: boxWidth - 16 });

    pdf.setFont('helvetica', 'bold');
    pdf.text('Signatory for', pageWidth - 140, detailTop + 130);
    pdf.text(COMPANY.name, pageWidth - 140, detailTop + 146);

    const footerStart = detailTop + boxHeight + 22;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 128, 185); // Blue color
    pdf.text('BRAND PARTNER', centerX, footerStart, { align: 'center' });
    
    // Add brand partner logos
    const logoY = footerStart + 12;
    const logoHeight = 30;
    const logoWidth = 40;
    const totalLogosWidth = BRAND_PARTNER_LOGOS.length * logoWidth + (BRAND_PARTNER_LOGOS.length - 1) * 8; // 8pt gap
    const startX = centerX - totalLogosWidth / 2;
    
    for (let i = 0; i < BRAND_PARTNER_LOGOS.length; i++) {
      const imageDataUrl = await fetchImageAsDataURL(BRAND_PARTNER_LOGOS[i]);
      if (imageDataUrl) {
        try {
          const xPos = startX + i * (logoWidth + 8);
          pdf.addImage(imageDataUrl, 'PNG', xPos, logoY, logoWidth, logoHeight);
        } catch (error) {
          console.error(`Error adding image ${i}:`, error);
        }
      }
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 128, 185); // Blue color
    pdf.text('OTHER BRANCHES', centerX, footerStart + 55, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.text('OFFICE NO. 9 BHAIRAV COMPLEX, ALAMBAGH BUS STOP, LUCKNOW, UP-226005', centerX, footerStart + 73, { align: 'center' });
    pdf.text('OFFICE-3 - SHOP NO 260, LEKHRAJ MARKET-3 INDIRA NAGAR LUCKNOW NEAR LEKHRAJ METRO STATION', centerX, footerStart + 87, { align: 'center' });

    pdf.save(`${quoteNumber}.pdf`);
    toast.success('Quotation PDF downloaded');
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
          {isAdmin && (
            <Link className="btn btn-secondary" to="/saved-quotations">
              <FiFileText /> Saved Quotations
            </Link>
          )}
          <button className="btn btn-secondary" onClick={resetQuote}>New Quote</button>
          <button className="btn btn-secondary" onClick={() => window.print()}>Print</button>
          <button className="btn btn-secondary" onClick={downloadQuotationPdf}>
            <FiDownload /> Download PDF
          </button>
          <button className="btn btn-primary" onClick={saveQuotation} disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : 'Save Quotation'}
          </button>
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
