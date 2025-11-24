import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  min: config.database.poolMin,
  max: config.database.poolMax,
  // Set timezone for all connections
  options: `-c timezone=${config.database.timezone}`
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Set timezone on pool initialization
pool.on('connect', async (client) => {
  try {
    await client.query(`SET timezone = '${config.database.timezone}'`);
  } catch (error) {
    console.error('Error setting timezone:', error.message);
  }
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', { text, error: error.message });
    throw error;
  }
};

export const getClient = () => pool.connect();
