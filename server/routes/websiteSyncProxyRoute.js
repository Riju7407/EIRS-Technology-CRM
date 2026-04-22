/**
 * Website Sync Integration Routes for EIRS-CRM
 * This router proxies requests to the main EIRS server /api/website-sync endpoints
 */

const express = require('express');
const axios = require('axios');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Main server API URL
const MAIN_SERVER_URL = process.env.MAIN_SERVER_URL || 'https://eirs-technology-production.up.railway.app';

// Middleware to ensure user is admin
router.use(protect, authorize('admin'));

/**
 * GET /api/website-sync/stats
 * Fetch website data statistics from main server
 */
router.get('/stats', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVER_URL}/api/website-sync/stats`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Failed to fetch stats';
    res.status(status).json({ success: false, message });
  }
});

/**
 * GET /api/website-sync/users
 * List all website users
 */
router.get('/users', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVER_URL}/api/website-sync/users`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Failed to fetch users';
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/website-sync/users
 * Create a new website user
 */
router.post('/users', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVER_URL}/api/website-sync/users`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to create user';
    res.status(status).json({ success: false, message });
  }
});

/**
 * PUT /api/website-sync/users/:id
 * Update a website user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVER_URL}/api/website-sync/users/${req.params.id}`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to update user';
    res.status(status).json({ success: false, message });
  }
});

/**
 * DELETE /api/website-sync/users/:id
 * Delete a website user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${MAIN_SERVER_URL}/api/website-sync/users/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to delete user';
    res.status(status).json({ success: false, message });
  }
});

/**
 * GET /api/website-sync/orders
 * List all website orders
 */
router.get('/orders', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVER_URL}/api/website-sync/orders`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Failed to fetch orders';
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/website-sync/orders
 * Create a new website order
 */
router.post('/orders', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVER_URL}/api/website-sync/orders`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to create order';
    res.status(status).json({ success: false, message });
  }
});

/**
 * PUT /api/website-sync/orders/:id
 * Update a website order
 */
router.put('/orders/:id', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVER_URL}/api/website-sync/orders/${req.params.id}`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to update order';
    res.status(status).json({ success: false, message });
  }
});

/**
 * DELETE /api/website-sync/orders/:id
 * Delete a website order
 */
router.delete('/orders/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${MAIN_SERVER_URL}/api/website-sync/orders/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to delete order';
    res.status(status).json({ success: false, message });
  }
});

/**
 * GET /api/website-sync/bookings
 * List all website service bookings
 */
router.get('/bookings', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVER_URL}/api/website-sync/bookings`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Failed to fetch bookings';
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/website-sync/bookings
 * Create a new website service booking
 */
router.post('/bookings', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVER_URL}/api/website-sync/bookings`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to create booking';
    res.status(status).json({ success: false, message });
  }
});

/**
 * PUT /api/website-sync/bookings/:id
 * Update a website service booking
 */
router.put('/bookings/:id', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVER_URL}/api/website-sync/bookings/${req.params.id}`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to update booking';
    res.status(status).json({ success: false, message });
  }
});

/**
 * DELETE /api/website-sync/bookings/:id
 * Delete a website service booking
 */
router.delete('/bookings/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${MAIN_SERVER_URL}/api/website-sync/bookings/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to delete booking';
    res.status(status).json({ success: false, message });
  }
});

/**
 * GET /api/website-sync/contacts
 * List all website contacts
 */
router.get('/contacts', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVER_URL}/api/website-sync/contacts`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Failed to fetch contacts';
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/website-sync/contacts
 * Create a new website contact
 */
router.post('/contacts', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVER_URL}/api/website-sync/contacts`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to create contact';
    res.status(status).json({ success: false, message });
  }
});

/**
 * PUT /api/website-sync/contacts/:id
 * Update a website contact
 */
router.put('/contacts/:id', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVER_URL}/api/website-sync/contacts/${req.params.id}`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to update contact';
    res.status(status).json({ success: false, message });
  }
});

/**
 * DELETE /api/website-sync/contacts/:id
 * Delete a website contact
 */
router.delete('/contacts/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${MAIN_SERVER_URL}/api/website-sync/contacts/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.message || error.message || 'Failed to delete contact';
    res.status(status).json({ success: false, message });
  }
});

module.exports = router;
