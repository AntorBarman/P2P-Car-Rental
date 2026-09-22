const { Pool } = require('pg');
require('dotenv').config();

// ✅ Check if DATABASE_URL is available, otherwise use individual variables
const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Supabase cloud connection
      },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      database: process.env.DB_NAME || 'udrive_bd',
      user: process.env.DB_USER || 'postgres',
      // 🔒 Force password to be explicitly parsed as a string to fix SASL error
      password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '',
      ssl: {
        rejectUnauthorized: false, // Required for Supabase cloud connection
      },
    };

const pool = new Pool({
  ...connectionConfig,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database successfully!');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};