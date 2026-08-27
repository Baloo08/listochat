import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'betico_jwt_secret_64_chars_super_safe_key_cr_2026',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://saas:BeticoDB2026@betico_postgres:5432/whatsapp_saas?sslmode=disable',
  REDIS_URL: process.env.REDIS_URL || 'redis://default:BeticoRedis2026@betico_redis:6379',
  BASE_DOMAIN: process.env.BASE_DOMAIN || '2.25.103.200',
  APP_URL: process.env.APP_URL || 'http://2.25.103.200',
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'http://betico_evolution:8080',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'e8a1b2c3d4e5f60718293a4b5c6d7e8f',
  SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL || 'admin@betico.cr',
  SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD || 'BeticoAdmin2026!',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  NODE_ENV: process.env.NODE_ENV || 'production',
};
