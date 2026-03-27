import API from '../api/axios';

export const prospectService = {
  getAll: (params) => API.get('/prospects', { params }),
  create: (data) => API.post('/prospects', data),
  update: (id, data) => API.put(`/prospects/${id}`, data),
  delete: (id) => API.delete(`/prospects/${id}`),
  getStats: () => API.get('/prospects/stats'),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/prospects/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportExcel: () => API.get('/prospects/export', { responseType: 'blob' }),
};
