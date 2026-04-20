import API from '../api/axios';

export const websiteSyncService = {
  getStats: () => API.get('/website-sync/stats'),
  getUsers: (params) => API.get('/website-sync/users', { params }),
  getOrders: (params) => API.get('/website-sync/orders', { params }),
  getBookings: (params) => API.get('/website-sync/bookings', { params }),
  getContacts: (params) => API.get('/website-sync/contacts', { params }),
};
