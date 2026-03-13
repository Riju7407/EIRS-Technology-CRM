const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Determine the correct path for client build
// Works both locally and on Render
const clientBuildPath = path.resolve(__dirname, '../client/dist');

// Serve static files from client build if it exists
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  console.log(`Serving static files from ${clientBuildPath}`);
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/followups', require('./routes/followUpRoutes'));
app.use('/api/interactions', require('./routes/interactionRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EIRS CRM API is running', timestamp: new Date() });
});

// Serve index.html for SPA routing (must be before error handler)
if (fs.existsSync(clientBuildPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error Handler Middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`EIRS CRM Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
