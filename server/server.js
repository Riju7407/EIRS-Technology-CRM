const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const bootstrapAdminFromEnv = require('./config/bootstrapAdmin');
const errorHandler = require('./middleware/errorHandler');

// Load env vars from .env file if it exists
// First try local .env file
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Fallback to environment variables (Vercel/Railway runtime env)
  dotenv.config();
}

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these variables in your Vercel dashboard or .env file');
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

const app = express();

// Enhanced CORS for Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.0.147:3000',
      'https://eirs-technology-crm.vercel.app',
      'https://crm.eirstechnology.com',
      /^https:\/\/.*\.vercel\.app$/
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    )) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Explicit preflight handler - MUST be before body parsers
app.options('*', cors(corsOptions));

// Additional safety: explicit OPTIONS handler for API routes
app.options('/api/*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Determine the correct path for client build
// Works both locally and on Render/Vercel
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
app.use('/api/prospects', require('./routes/prospectRoutes'));
app.use('/api/service-management', require('./routes/prospectRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/distribution', require('./routes/distributionRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/website-sync', require('./routes/websiteSyncRoutes'));

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

let server;
let started = false;

const startServer = async () => {
  if (started) return;
  started = true;

  await connectDB();

  const hasAdminBootstrapCredentials = Boolean(
    String(process.env.ADMIN_EMAIL || '').trim() &&
    String(process.env.ADMIN_PASSWORD || '').trim()
  );

  const shouldBootstrapAdmin =
    process.env.ENABLE_ADMIN_BOOTSTRAP === 'true' ||
    hasAdminBootstrapCredentials;

  if (shouldBootstrapAdmin) {
    await bootstrapAdminFromEnv();
  } else {
    console.warn('Admin bootstrap skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to enable CRM sync login');
  }

  // In Vercel serverless runtime, do not bind a listening socket.
  if (process.env.VERCEL) {
    console.log('EIRS CRM running in Vercel serverless mode');
    return;
  }

  server = app.listen(PORT, () => {
    console.log(`EIRS CRM Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error(`Server startup failed: ${err.message}`);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

module.exports = app;
