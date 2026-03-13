import API from '../api/axios';

export const clientService = {
  getAll: (params) => API.get('/clients', { params }),
  getById: (id) => API.get(`/clients/${id}`),
  create: (data) => API.post('/clients', data),
  update: (id, data) => API.put(`/clients/${id}`, data),
  delete: (id) => API.delete(`/clients/${id}`),
  addPurchase: (id, data) => API.post(`/clients/${id}/purchase`, data),
  getStats: () => API.get('/clients/stats'),
};
