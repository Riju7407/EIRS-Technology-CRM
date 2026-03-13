import API from '../api/axios';

export const interactionService = {
  getAll: (params) => API.get('/interactions', { params }),
  getById: (id) => API.get(`/interactions/${id}`),
  create: (data) => API.post('/interactions', data),
  update: (id, data) => API.put(`/interactions/${id}`, data),
  delete: (id) => API.delete(`/interactions/${id}`),
  getClientInteractions: (clientId) => API.get(`/interactions/client/${clientId}`),
  getStats: () => API.get('/interactions/stats'),
};
