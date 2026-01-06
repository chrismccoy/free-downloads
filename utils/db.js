/**
 * Database Connection Utility
 *
 * Initializes the Knex.js instance using the configuration
 * defined in knexfile.js.
 */

const knex = require('knex');
const config = require('../knexfile');

// Environment
const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

// Initialize connection
const db = knex(dbConfig);

module.exports = db;
