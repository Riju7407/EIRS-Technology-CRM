import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiDownload, FiFileText, FiPlus, FiShoppingBag, FiTrash2, FiUsers, FiSave, FiEdit2, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { clientService } from '../services/clientService';
import { quotationService } from '../services/quotationService';
import { itemService } from '../services/itemService';
import { godownService } from '../services/godownService';
import { categoryService } from '../services/categoryService';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const createQuoteNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const nextYearShort = String((year + 1) % 100).padStart(2, '0');
  const currentYearShort = String(year % 100).padStart(2, '0');
  const sequence = Math.floor(100 + Math.random() * 900);
  return `EIRS/${currentYearShort}-${nextYearShort}/${sequence}`;
};

const blankItem = { itemId: '', itemName: '', description: '', quantity: 1, rate: 0, gstTaxRate: 0, discountOnSalesPrice: 0, pricingMode: 'without_tax', category: '', measuringUnit: '' };

const itemSections = ['Basic Details', 'Stock Details', 'Pricing Details', 'Party Wise Prices', 'Custom Fields'];

const initialItemForm = {
  itemType: 'product',
  name: '',
  category: '',
  pricingBasis: '',
  pricingMode: 'without_tax',
  salesPrice: 0,
  purchasePrice: 0,
  gstTaxRate: 0,
  discountOnSalesPrice: 0,
  wholesaleRate: 0,
  measuringUnit: '',
  serviceCode: '',
  itemCode: '',
  hsnCode: '',
  openingStock: 0,
  asOfDate: '',
  description: '',
  godown: '',
  remarks: '',
  partyWisePrices: [{ partyName: '', price: 0 }],
  customFields: [{ label: '', value: '' }],
};

const initialGodownForm = {
  name: '',
  streetAddress: '',
  state: '',
  pincode: '',
  city: '',
};

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

const normalizeNumber = (value) => Number(value || 0);

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
  const [notes, setNotes] = useState('Thank you for your business. This quotation is valid for 7 days.');
  const [items, setItems] = useState([blankItem]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showGodownModal, setShowGodownModal] = useState(false);
  const [activeItemSection, setActiveItemSection] = useState(itemSections[0]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingGodownId, setEditingGodownId] = useState(null);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [godownForm, setGodownForm] = useState(initialGodownForm);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [clientsResponse, itemsResponse, godownsResponse, categoriesResponse] = await Promise.all([
          clientService.getAll({ page: 1, limit: 500 }),
          itemService.getAll({ page: 1, limit: 500 }),
          godownService.getAll({ page: 1, limit: 500 }),
          categoryService.getAll({ page: 1, limit: 500 }),
        ]);

        setClients(Array.isArray(clientsResponse.data.clients) ? clientsResponse.data.clients : []);
        setCatalogItems(Array.isArray(itemsResponse.data.items) ? itemsResponse.data.items : []);
        setGodowns(Array.isArray(godownsResponse.data.godowns) ? godownsResponse.data.godowns : []);
        setCategories(Array.isArray(categoriesResponse.data.categories) ? categoriesResponse.data.categories : []);
      } catch (_) {
        toast.error('Failed to load quotation data');
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client._id === selectedClientId),
    [clients, selectedClientId]
  );

  const itemSummary = useMemo(() => {
    return items.reduce(
      (accumulator, item) => {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const discountPerUnit = Number(item.discountOnSalesPrice || 0);
        const taxRate = Number(item.gstTaxRate || 0);
        const grossAmount = quantity * rate;
        const discountAmount = quantity * discountPerUnit;
        const taxableAmount = Math.max(0, grossAmount - discountAmount);
        const taxAmount = taxableAmount * taxRate / 100;

        accumulator.discount += discountAmount;
        accumulator.tax += taxAmount;
        return accumulator;
      },
      { discount: 0, tax: 0 }
    );
  }, [items]);

  const computed = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
    const total = subtotal - itemSummary.discount + itemSummary.tax;
    return { subtotal, total };
  }, [items, itemSummary]);

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addManualLine = () => {
    setItems((prev) => [...prev, blankItem]);
  };

  const removeItem = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const refreshInventory = async () => {
    const [itemsResponse, godownsResponse, categoriesResponse] = await Promise.all([
      itemService.getAll({ page: 1, limit: 500 }),
      godownService.getAll({ page: 1, limit: 500 }),
      categoryService.getAll({ page: 1, limit: 500 }),
    ]);
    setCatalogItems(Array.isArray(itemsResponse.data.items) ? itemsResponse.data.items : []);
    setGodowns(Array.isArray(godownsResponse.data.godowns) ? godownsResponse.data.godowns : []);
    setCategories(Array.isArray(categoriesResponse.data.categories) ? categoriesResponse.data.categories : []);
  };

  const openCreateItemForm = () => {
    setEditingItemId(null);
    setItemForm({ ...initialItemForm, partyWisePrices: [{ partyName: '', price: 0 }], customFields: [{ label: '', value: '' }] });
    setActiveItemSection(itemSections[0]);
    setShowItemModal(true);
  };

  const openEditItemForm = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      itemType: item.itemType || 'product',
      name: item.name || '',
      category: item.category || '',
      pricingBasis: item.pricingBasis || '',
      pricingMode: item.pricingMode || 'without_tax',
      salesPrice: item.salesPrice || 0,
      purchasePrice: item.purchasePrice || 0,
      gstTaxRate: item.gstTaxRate || 0,
      discountOnSalesPrice: item.discountOnSalesPrice || 0,
      wholesaleRate: item.wholesaleRate || 0,
      measuringUnit: item.measuringUnit || '',
      serviceCode: item.serviceCode || '',
      itemCode: item.itemCode || '',
      hsnCode: item.hsnCode || '',
      openingStock: item.openingStock || 0,
      asOfDate: item.asOfDate ? String(item.asOfDate).slice(0, 10) : '',
      description: item.description || '',
      godown: item.godown?._id || item.godown || '',
      remarks: item.remarks || '',
      partyWisePrices: item.partyWisePrices?.length ? item.partyWisePrices : [{ partyName: '', price: 0 }],
      customFields: item.customFields?.length ? item.customFields : [{ label: '', value: '' }],
    });
    setActiveItemSection(itemSections[0]);
    setShowItemModal(true);
  };

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.itemType === itemForm.itemType),
    [categories, itemForm.itemType]
  );

  const handleItemFormChange = (field, value) => {
    setItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePartyWisePrice = (index, field, value) => {
    setItemForm((prev) => ({
      ...prev,
      partyWisePrices: prev.partyWisePrices.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addPartyWisePriceRow = () => {
    setItemForm((prev) => ({ ...prev, partyWisePrices: [...prev.partyWisePrices, { partyName: '', price: 0 }] }));
  };

  const removePartyWisePriceRow = (index) => {
    setItemForm((prev) => ({
      ...prev,
      partyWisePrices: prev.partyWisePrices.length > 1 ? prev.partyWisePrices.filter((_, rowIndex) => rowIndex !== index) : prev.partyWisePrices,
    }));
  };

  const updateCustomField = (index, field, value) => {
    setItemForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addCustomFieldRow = () => {
    setItemForm((prev) => ({ ...prev, customFields: [...prev.customFields, { label: '', value: '' }] }));
  };

  const removeCustomFieldRow = (index) => {
    setItemForm((prev) => ({
      ...prev,
      customFields: prev.customFields.length > 1 ? prev.customFields.filter((_, rowIndex) => rowIndex !== index) : prev.customFields,
    }));
  };

  const saveItem = async (stayOpen = false) => {
    if (!itemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    const payload = {
      ...itemForm,
      salesPrice: normalizeNumber(itemForm.salesPrice),
      purchasePrice: normalizeNumber(itemForm.purchasePrice),
      gstTaxRate: normalizeNumber(itemForm.gstTaxRate),
      discountOnSalesPrice: normalizeNumber(itemForm.discountOnSalesPrice),
      wholesaleRate: normalizeNumber(itemForm.wholesaleRate),
      openingStock: normalizeNumber(itemForm.openingStock),
      pricingBasis: itemForm.pricingBasis.trim(),
      pricingMode: itemForm.pricingMode,
      partyWisePrices: (itemForm.partyWisePrices || []).filter((row) => row.partyName || row.price),
      customFields: (itemForm.customFields || []).filter((row) => row.label || row.value),
      godown: itemForm.godown || undefined,
      asOfDate: itemForm.asOfDate || undefined,
    };

    try {
      if (editingItemId) {
        await itemService.update(editingItemId, payload);
        toast.success('Item updated successfully');
      } else {
        await itemService.create(payload);
        toast.success('Item created successfully');
      }
      await refreshInventory();
      if (stayOpen) {
        setEditingItemId(null);
        setItemForm({ ...initialItemForm, partyWisePrices: [{ partyName: '', price: 0 }], customFields: [{ label: '', value: '' }] });
        setActiveItemSection(itemSections[0]);
      } else {
        setShowItemModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await itemService.delete(itemId);
      setItems((prev) => prev.filter((row) => row.itemId !== itemId));
      await refreshInventory();
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const openCreateGodownForm = () => {
    setEditingGodownId(null);
    setGodownForm(initialGodownForm);
    setShowGodownModal(true);
  };

  const openEditGodownForm = (godown) => {
    setEditingGodownId(godown._id);
    setGodownForm({
      name: godown.name || '',
      streetAddress: godown.streetAddress || '',
      state: godown.state || '',
      pincode: godown.pincode || '',
      city: godown.city || '',
    });
    setShowGodownModal(true);
  };

  const handleGodownFormChange = (field, value) => {
    setGodownForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveGodown = async () => {
    if (!godownForm.name.trim()) {
      toast.error('Godown name is required');
      return;
    }

    try {
      if (editingGodownId) {
        await godownService.update(editingGodownId, godownForm);
        toast.success('Godown updated successfully');
      } else {
        await godownService.create(godownForm);
        toast.success('Godown created successfully');
      }
      await refreshInventory();
      setShowGodownModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save godown');
    }
  };

  const deleteGodown = async (godownId) => {
    if (!window.confirm('Delete this godown?')) return;
    try {
      await godownService.delete(godownId);
      await refreshInventory();
      toast.success('Godown deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete godown');
    }
  };

  const toggleCatalogItem = (catalogItem, checked) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.itemId === catalogItem._id);
      if (checked) {
        if (existingIndex !== -1) {
          return prev;
        }
        return [
          ...prev,
          {
            itemId: catalogItem._id,
            itemName: catalogItem.name || '',
            description: catalogItem.name || '',
            quantity: 1,
            rate: Number(catalogItem.salesPrice || 0),
            gstTaxRate: Number(catalogItem.gstTaxRate || 0),
            discountOnSalesPrice: Number(catalogItem.discountOnSalesPrice || 0),
            pricingMode: catalogItem.pricingMode || 'without_tax',
            category: catalogItem.category || '',
            measuringUnit: catalogItem.measuringUnit || '',
          },
        ];
      }

      if (existingIndex === -1) {
        return prev;
      }

      return prev.filter((item) => item.itemId !== catalogItem._id);
    });
  };

  const selectedCatalogItemIds = useMemo(() => items.filter((item) => item.itemId).map((item) => item.itemId), [items]);

  const saveAsPurchase = async () => {
    if (!selectedClientId) {
      toast.error('Select a customer before saving quotation');
      return;
    }

    const validItems = items.filter((item) => (item.itemName || item.description) && Number(item.quantity) > 0 && Number(item.rate) >= 0);
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

    const validItems = items.filter((item) => (item.itemName || item.description) && Number(item.quantity) > 0 && Number(item.rate) >= 0);
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
        notes,
        subtotal: Number(computed.subtotal.toFixed(2)),
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
          items: validItems.map((item) => ({
            ...item,
            description: item.itemName || item.description,
          })),
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
    setNotes('Thank you for your business. This quotation is valid for 7 days.');
    setItems([blankItem]);
  };

  const downloadQuotationPdf = async () => {
    if (!selectedClientId) {
      toast.error('Select a customer before downloading quotation PDF');
      return;
    }

    const validItems = items.filter((item) => (item.itemName || item.description) && Number(item.quantity) > 0);
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
          item.itemName || item.description,
          item.description || item.category || '-',
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
          {isAdmin && (
            <Link className="btn btn-secondary" to="/inventory">
              <FiLayers /> Inventory
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
          <h3>Item Catalog</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={openCreateItemForm}>
              <FiPlus /> Add Item
            </button>
            <button className="btn btn-secondary btn-sm" onClick={openCreateGodownForm}>
              <FiLayers /> Add Godown
            </button>
          </div>
        </div>
        <div className="card-body">
          <p style={{ marginTop: 0, marginBottom: 12, color: '#64748b' }}>
            Select catalog items to add them directly into the quotation. Checked items will appear in the quotation PDF.
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Sales Price</th>
                  <th>Stock</th>
                  <th>Godown</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalogItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#64748b' }}>
                      No items found. Add your first item to begin building quotations.
                    </td>
                  </tr>
                ) : (
                  catalogItems.map((catalogItem) => (
                    <tr key={catalogItem._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCatalogItemIds.includes(catalogItem._id)}
                          onChange={(event) => toggleCatalogItem(catalogItem, event.target.checked)}
                        />
                      </td>
                      <td>
                        <strong>{catalogItem.name}</strong>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{catalogItem.itemCode || catalogItem.serviceCode || 'No code'}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{catalogItem.itemType}</td>
                      <td>{catalogItem.category || 'N/A'}</td>
                      <td>Rs {formatRupees(catalogItem.salesPrice)}</td>
                      <td>{formatRupees(catalogItem.openingStock || 0)}</td>
                      <td>{catalogItem.godown?.name || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditItemForm(catalogItem)} title="Edit item">
                            <FiEdit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteItem(catalogItem._id)} title="Delete item">
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
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Godown Management</h3>
          <button className="btn btn-secondary btn-sm" onClick={openCreateGodownForm}>
            <FiPlus /> Add Godown
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Street Address</th>
                <th>City</th>
                <th>State</th>
                <th>Pincode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {godowns.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>
                    No godowns available yet.
                  </td>
                </tr>
              ) : (
                godowns.map((godown) => (
                  <tr key={godown._id}>
                    <td><strong>{godown.name}</strong></td>
                    <td>{godown.streetAddress || 'N/A'}</td>
                    <td>{godown.city || 'N/A'}</td>
                    <td>{godown.state || 'N/A'}</td>
                    <td>{godown.pincode || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditGodownForm(godown)} title="Edit godown">
                          <FiEdit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteGodown(godown._id)} title="Delete godown">
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
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Quotation Items</h3>
          <button className="btn btn-secondary btn-sm" onClick={addManualLine}>
            <FiPlus /> Add Manual Line
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                  <th>Discount</th>
                  <th>Tax</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const lineAmount = Number(item.quantity || 0) * Number(item.rate || 0);
                  const lineDiscount = Number(item.quantity || 0) * Number(item.discountOnSalesPrice || 0);
                  const taxableLineAmount = Math.max(0, lineAmount - lineDiscount);
                  const lineTax = taxableLineAmount * Number(item.gstTaxRate || 0) / 100;
                return (
                  <tr key={index}>
                    <td>
                      <input
                        className="form-control"
                        value={item.itemName || item.description}
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
                      <td style={{ fontWeight: 600 }}>Rs {lineDiscount.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>Rs {lineTax.toLocaleString()} ({Number(item.gstTaxRate || 0)}%)</td>
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
              <label className="form-label">Quotation Notes</label>
              <textarea className="form-control" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>

          <div className="summary-values">
            <div className="summary-row"><span>Subtotal</span><strong>Rs {computed.subtotal.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Item Discount</span><strong>Rs {itemSummary.discount.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Item Tax</span><strong>Rs {itemSummary.tax.toLocaleString()}</strong></div>
            <div className="summary-row total"><span>Grand Total</span><strong>Rs {computed.total.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItemId ? 'Edit Item' : 'Create New Item'}
        size="xl"
        footer={(
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
              Cancel
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => saveItem(true)}>
                Save & New
              </button>
              <button className="btn btn-primary" onClick={() => saveItem(false)}>
                <FiSave /> Save Item
              </button>
            </div>
          </div>
        )}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {itemSections.map((section) => (
            <button
              key={section}
              type="button"
              className={`btn btn-sm ${activeItemSection === section ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveItemSection(section)}
            >
              {section}
            </button>
          ))}
        </div>

        {activeItemSection === 'Basic Details' && (
          <div className="quotation-grid">
            <div className="form-group">
              <label className="form-label">Item Type</label>
              <select className="form-control" value={itemForm.itemType} onChange={(event) => handleItemFormChange('itemType', event.target.value)}>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{itemForm.itemType === 'service' ? 'Service Name' : 'Item Name'}</label>
              <input className="form-control" value={itemForm.name} onChange={(event) => handleItemFormChange('name', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={itemForm.category} onChange={(event) => handleItemFormChange('category', event.target.value)}>
                <option value="">Select category</option>
                {categoryOptions.map((category) => (
                  <option key={category._id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pricing Basis</label>
              <input
                className="form-control"
                placeholder="Example: Retail, MRP, Wholesale"
                value={itemForm.pricingBasis}
                onChange={(event) => handleItemFormChange('pricingBasis', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Mode</label>
              <select className="form-control" value={itemForm.pricingMode} onChange={(event) => handleItemFormChange('pricingMode', event.target.value)}>
                <option value="without_tax">Without Tax</option>
                <option value="with_tax">With Tax</option>
              </select>
            </div>
          </div>
        )}

        {activeItemSection === 'Stock Details' && (
          <div className="quotation-grid">
            <div className="form-group">
              <label className="form-label">Item Code</label>
              <input className="form-control" value={itemForm.itemCode} onChange={(event) => handleItemFormChange('itemCode', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">HSN Code</label>
              <input className="form-control" value={itemForm.hsnCode} onChange={(event) => handleItemFormChange('hsnCode', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Measuring Unit</label>
              <input className="form-control" value={itemForm.measuringUnit} onChange={(event) => handleItemFormChange('measuringUnit', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Godown</label>
              <select className="form-control" value={itemForm.godown} onChange={(event) => handleItemFormChange('godown', event.target.value)}>
                <option value="">Select godown</option>
                {godowns.map((godown) => (
                  <option key={godown._id} value={godown._id}>{godown.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Opening Stock</label>
              <input type="number" min="0" className="form-control" value={itemForm.openingStock} onChange={(event) => handleItemFormChange('openingStock', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">As Of Date</label>
              <input type="date" className="form-control" value={itemForm.asOfDate} onChange={(event) => handleItemFormChange('asOfDate', event.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={itemForm.description} onChange={(event) => handleItemFormChange('description', event.target.value)} />
            </div>
            {itemForm.itemType === 'service' && (
              <div className="form-group">
                <label className="form-label">Service Code</label>
                <input className="form-control" value={itemForm.serviceCode} onChange={(event) => handleItemFormChange('serviceCode', event.target.value)} />
              </div>
            )}
          </div>
        )}

        {activeItemSection === 'Pricing Details' && (
          <div className="quotation-grid">
            <div className="form-group">
              <label className="form-label">Sales Price</label>
              <input type="number" min="0" className="form-control" value={itemForm.salesPrice} onChange={(event) => handleItemFormChange('salesPrice', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Price</label>
              <input type="number" min="0" className="form-control" value={itemForm.purchasePrice} onChange={(event) => handleItemFormChange('purchasePrice', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Tax Rate (%)</label>
              <input type="number" min="0" className="form-control" value={itemForm.gstTaxRate} onChange={(event) => handleItemFormChange('gstTaxRate', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Discount on Sales Price</label>
              <input type="number" min="0" className="form-control" value={itemForm.discountOnSalesPrice} onChange={(event) => handleItemFormChange('discountOnSalesPrice', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Wholesale Rate</label>
              <input type="number" min="0" className="form-control" value={itemForm.wholesaleRate} onChange={(event) => handleItemFormChange('wholesaleRate', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea className="form-control" rows={4} value={itemForm.remarks} onChange={(event) => handleItemFormChange('remarks', event.target.value)} />
            </div>
          </div>
        )}

        {activeItemSection === 'Party Wise Prices' && (
          <div>
            {itemForm.partyWisePrices.map((row, index) => (
              <div key={`party-price-${index}`} className="quotation-grid" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Party Name</label>
                  <input className="form-control" value={row.partyName} onChange={(event) => updatePartyWisePrice(index, 'partyName', event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input type="number" min="0" className="form-control" value={row.price} onChange={(event) => updatePartyWisePrice(index, 'price', Number(event.target.value || 0))} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => removePartyWisePriceRow(index)} disabled={itemForm.partyWisePrices.length === 1}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" type="button" onClick={addPartyWisePriceRow}>
              <FiPlus /> Add Party Price
            </button>
          </div>
        )}

        {activeItemSection === 'Custom Fields' && (
          <div>
            {itemForm.customFields.map((row, index) => (
              <div key={`custom-field-${index}`} className="quotation-grid" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Field Label</label>
                  <input className="form-control" value={row.label} onChange={(event) => updateCustomField(index, 'label', event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Field Value</label>
                  <input className="form-control" value={row.value} onChange={(event) => updateCustomField(index, 'value', event.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => removeCustomFieldRow(index)} disabled={itemForm.customFields.length === 1}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" type="button" onClick={addCustomFieldRow}>
              <FiPlus /> Add Custom Field
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showGodownModal}
        onClose={() => setShowGodownModal(false)}
        title={editingGodownId ? 'Edit Godown' : 'Add Godown'}
        size="lg"
        footer={(
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setShowGodownModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveGodown}>
              <FiSave /> Save Godown
            </button>
          </div>
        )}
      >
        <div className="quotation-grid">
          <div className="form-group">
            <label className="form-label">Godown Name</label>
            <input className="form-control" value={godownForm.name} onChange={(event) => handleGodownFormChange('name', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input className="form-control" value={godownForm.streetAddress} onChange={(event) => handleGodownFormChange('streetAddress', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-control" value={godownForm.state} onChange={(event) => handleGodownFormChange('state', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-control" value={godownForm.pincode} onChange={(event) => handleGodownFormChange('pincode', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-control" value={godownForm.city} onChange={(event) => handleGodownFormChange('city', event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillQuotationPage;
