import axios from '../api/axios';

const BASE_URL = '/quotations';

export const quotationService = {
  // Create a new quotation
  create: (data) => axios.post(BASE_URL, data),

  // Get all quotations with filters
  getAll: (params) => axios.get(BASE_URL, { params }),

  // Get a specific quotation
  getById: (id) => axios.get(`${BASE_URL}/${id}`),

  // Update quotation status
  updateStatus: (id, status) => axios.patch(`${BASE_URL}/${id}/status`, { status }),

  // Download quotation PDF
  downloadPdf: (id) => axios.get(`${BASE_URL}/${id}/download`, { responseType: 'blob' }),

  // Delete a quotation
  delete: (id) => axios.delete(`${BASE_URL}/${id}`),
};
