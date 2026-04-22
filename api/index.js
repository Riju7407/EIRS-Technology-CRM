/**
 * Vercel Serverless API Handler
 * This file serves as the entry point for all API requests on Vercel
 * It imports the Express app from the server and exports it as a handler
 */

const app = require('../server/server');

module.exports = app;
