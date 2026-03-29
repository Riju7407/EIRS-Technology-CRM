import API from '../api/axios';

export const prospectService = {
  getAll: (params) => API.get('/service-management', { params }),
  create: (data) => API.post('/service-management', data),
  update: (id, data) => API.put(`/service-management/${id}`, data),
  delete: (id) => API.delete(`/service-management/${id}`),
  getStats: () => API.get('/service-management/stats'),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/service-management/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportExcel: () => API.get('/service-management/export', { responseType: 'blob' }),
};
