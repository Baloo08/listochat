import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text: string, params?: any[]) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error, 'Query:', text);
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export const testConnection = async () => {
  try {
    const res = await query('SELECT NOW()');
    console.log('Database connected successfully:', res.rows[0]);
    return true;
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    return false;
  }
};

export default pool;
