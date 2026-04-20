import API from '../api/axios';

export const websiteSyncService = {
  getStats: () => API.get('/website-sync/stats'),
  getUsers: (params) => API.get('/website-sync/users', { params }),
  getOrders: (params) => API.get('/website-sync/orders', { params }),
  getBookings: (params) => API.get('/website-sync/bookings', { params }),
  getContacts: (params) => API.get('/website-sync/contacts', { params }),

  createUser: (payload) => API.post('/website-sync/users', payload),
  updateUser: (id, payload) => API.put(`/website-sync/users/${id}`, payload),
  deleteUser: (id) => API.delete(`/website-sync/users/${id}`),

  createOrder: (payload) => API.post('/website-sync/orders', payload),
  updateOrder: (id, payload) => API.put(`/website-sync/orders/${id}`, payload),
  deleteOrder: (id) => API.delete(`/website-sync/orders/${id}`),

  createBooking: (payload) => API.post('/website-sync/bookings', payload),
  updateBooking: (id, payload) => API.put(`/website-sync/bookings/${id}`, payload),
  deleteBooking: (id) => API.delete(`/website-sync/bookings/${id}`),

  createContact: (payload) => API.post('/website-sync/contacts', payload),
  updateContact: (id, payload) => API.put(`/website-sync/contacts/${id}`, payload),
  deleteContact: (id) => API.delete(`/website-sync/contacts/${id}`),
};
