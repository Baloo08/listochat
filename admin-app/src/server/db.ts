import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Parse DATE (OID 1082) as plain string 'YYYY-MM-DD' to prevent UTC date-shifting
pg.types.setTypeParser(1082, (val: string) => val);
// Parse TIME (OID 1083) as clean 'HH:MM'
pg.types.setTypeParser(1083, (val: string) => val ? val.slice(0, 5) : val);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://saas:BeticoDB2026@betico_postgres:5432/whatsapp_saas?sslmode=disable',
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Admin DB] Error inesperado en el pool de PostgreSQL:', err);
});

// Enforce Costa Rica (UTC-6) timezone across all pooled connections
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'America/Costa_Rica'").catch((err) => {
    console.error('[Admin DB] Error al establecer zona horaria Costa Rica:', err);
  });
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[Admin DB] Consulta lenta (${duration}ms):`, text.substring(0, 100));
    }
    return res;
  } catch (error) {
    console.error(`[Admin DB] Error en consulta:`, text.substring(0, 100), error);
    throw error;
  }
}
