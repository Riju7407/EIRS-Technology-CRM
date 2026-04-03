import React, { useEffect, useState } from 'react';
import { FiDownload, FiTrash2, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { quotationService } from '../services/quotationService';
import Spinner from '../components/common/Spinner';

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

const SavedQuotationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const limit = 10;

  useEffect(() => {
    loadQuotations();
  }, [page, status, search]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const { data } = await quotationService.getAll({
        page,
        limit,
        status: status || undefined,
        search: search || undefined,
      });
      setQuotations(data.quotations);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load quotations');
      console.error(error);
    }
    setLoading(false);
  };

  const generatePDF = async (quotation) => {
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
    pdf.text(`QUOTATION NO- ${quotation.quoteNumber}`, pageWidth - 240, 116);

    pdf.setFont('helvetica', 'bold');
    pdf.text('NAME-', 40, 145);
    pdf.text('MOB. NO.-', 320, 145);
    pdf.text(format(quotation.createdAt, 'dd-MM-yyyy'), pageWidth - 90, 145);
    pdf.text('ADDRESS-', 40, 162);
    pdf.text('QUOTATION DATE', 320, 162);

    pdf.setFont('helvetica', 'normal');
    pdf.text(quotation.clientName || '-', 85, 145);
    pdf.text(quotation.clientPhone || '-', 380, 145);
    pdf.text(quotation.clientAddress || '-', 95, 162);

    const tableData = quotation.items.map((item, index) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.rate || 0);
      return [
        String(index + 1),
        item.description,
        quotation.notes || '-',
        String(quantity),
        formatRupees(price),
        formatRupees(quantity * price),
      ];
    });

    autoTable(pdf, {
      startY: 178,
      head: [['S NO.', 'PRODUCT', 'DESCRIPTION', 'QTY', 'PRICE', 'AMOUNT']],
      body: tableData,
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
    pdf.text(formatRupees(quotation.total), pageWidth - 40, summaryY, { align: 'right' });

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

    pdf.save(`${quotation.quoteNumber}.pdf`);
    toast.success('Quotation PDF downloaded');
  };

  const handleDownload = async (quotation) => {
    try {
      await generatePDF(quotation);
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await quotationService.delete(id);
        toast.success('Quotation deleted successfully');
        loadQuotations();
      } catch (error) {
        toast.error('Failed to delete quotation');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await quotationService.updateStatus(id, newStatus);
      toast.success('Status updated successfully');
      loadQuotations();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading && quotations.length === 0) {
    return <Spinner text="Loading quotations..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Saved Quotations</h1>
          <p>Manage and download all saved quotations</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by quote number or customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ flex: 1, minWidth: 250 }}
          />
          <select
            className="form-control"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{ minWidth: 150 }}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Quote No.</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>
                    No quotations found
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation._id}>
                    <td>
                      <strong>{quotation.quoteNumber}</strong>
                    </td>
                    <td>{quotation.clientName}</td>
                    <td>Rs {formatRupees(quotation.total)}</td>
                    <td>
                      <select
                        value={quotation.status}
                        onChange={(e) => handleStatusChange(quotation._id, e.target.value)}
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                      </select>
                    </td>
                    <td>{format(new Date(quotation.createdAt), 'dd MMM yyyy')}</td>
                    <td>{format(new Date(quotation.expiryDate), 'dd MMM yyyy')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => handleDownload(quotation)}
                          title="Download PDF"
                        >
                          <FiDownload size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => handleDelete(quotation._id)}
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {quotations.length > 0 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              Page {page} of {totalPages} ({quotations.length} quotations)
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedQuotationsPage;
