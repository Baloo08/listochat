import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/whatsapp_saas',
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
