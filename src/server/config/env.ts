import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-default-key-change-in-prod',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/whatsapp_saas',
  BASE_DOMAIN: process.env.BASE_DOMAIN || 'localhost',
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || 'global-api-key',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
