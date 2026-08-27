import crypto from 'crypto';
import { query } from './pool.js';

export async function runMigrations() {
  console.log('Running database migrations...');
  
  const tables = `
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      custom_domain VARCHAR(255) UNIQUE,
      ai_provider VARCHAR(50) DEFAULT 'gemini',
      ai_api_key_encrypted TEXT,
      ai_model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
      evolution_instance VARCHAR(255),
      whatsapp_number VARCHAR(50),
      plan VARCHAR(50) DEFAULT 'starter',
      active BOOLEAN DEFAULT true,
      settings_json JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255),
      role VARCHAR(50) DEFAULT 'admin',
      avatar_url TEXT,
      provider VARCHAR(50) DEFAULT 'local',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, email)
    );

    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      price_display VARCHAR(100),
      duration VARCHAR(50) NOT NULL,
      estimated_minutes INT,
      category VARCHAR(100),
      notes TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(50) NOT NULL,
      service VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      details TEXT,
      vehicle_model VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      config_json JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(255) PRIMARY KEY,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      remote_jid VARCHAR(255) NOT NULL,
      push_name VARCHAR(255),
      from_me BOOLEAN NOT NULL DEFAULT false,
      message_text TEXT NOT NULL,
      ai_response BOOLEAN DEFAULT false,
      status VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id VARCHAR(255) PRIMARY KEY,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      recipient VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      trigger_type VARCHAR(100) NOT NULL,
      status VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      store_enabled BOOLEAN DEFAULT false,
      store_name VARCHAR(255) NOT NULL,
      store_slug VARCHAR(255) UNIQUE NOT NULL,
      store_description TEXT,
      store_logo_url TEXT,
      store_banner_url TEXT,
      store_theme JSONB,
      currency VARCHAR(10) DEFAULT 'CRC',
      accept_sinpe BOOLEAN DEFAULT true,
      sinpe_phone VARCHAR(50),
      sinpe_name VARCHAR(255),
      accept_transfer BOOLEAN DEFAULT true,
      bank_account_info TEXT,
      accept_cash_on_delivery BOOLEAN DEFAULT false,
      delivery_enabled BOOLEAN DEFAULT false,
      delivery_fee NUMERIC(10, 2) DEFAULT 0,
      pickup_enabled BOOLEAN DEFAULT true,
      whatsapp_checkout BOOLEAN DEFAULT true,
      min_order_amount NUMERIC(10, 2) DEFAULT 0,
      store_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      compare_at_price NUMERIC(10, 2),
      cost_price NUMERIC(10, 2),
      currency VARCHAR(10) DEFAULT 'CRC',
      category VARCHAR(100),
      tags TEXT[],
      stock INT DEFAULT 0,
      track_stock BOOLEAN DEFAULT true,
      sku VARCHAR(100),
      weight_grams INT,
      featured BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      sort_order INT DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, slug)
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt_text VARCHAR(255),
      sort_order INT DEFAULT 0,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      price_override NUMERIC(10, 2),
      stock INT DEFAULT 0,
      attributes JSONB,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      session_id VARCHAR(255),
      whatsapp_id VARCHAR(100),
      customer_name VARCHAR(255),
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      quantity INT DEFAULT 1,
      unit_price NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      order_number SERIAL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      customer_address TEXT,
      whatsapp_jid VARCHAR(255),
      source VARCHAR(50) DEFAULT 'store',
      subtotal NUMERIC(10, 2) NOT NULL,
      delivery_fee NUMERIC(10, 2) DEFAULT 0,
      discount NUMERIC(10, 2) DEFAULT 0,
      total NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'CRC',
      status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_reference VARCHAR(255),
      notes TEXT,
      delivery_method VARCHAR(50) NOT NULL,
      estimated_delivery TIMESTAMP WITH TIME ZONE,
      chat_message_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      variant_name VARCHAR(255),
      quantity INT DEFAULT 1,
      unit_price NUMERIC(10, 2) NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_id ON chat_messages(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_carts_tenant_id ON carts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_store_settings_tenant_id ON store_settings(tenant_id);
  `;

  await query(tables);

  const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@betico.cr';
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'BeticoAdmin2026!';

  const checkAdmin = await query(`SELECT id FROM users WHERE email = $1`, [superAdminEmail]);
  if (checkAdmin.rows.length === 0) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(superAdminPassword, salt, 1000, 64, 'sha512').toString('hex');
    const fullHash = `${salt}:${hash}`;

    const tenantRes = await query(`
      INSERT INTO tenants (name, slug, active, plan) 
      VALUES ('Betico Superadmin', 'superadmin', true, 'enterprise') 
      RETURNING id
    `);
    const tenantId = tenantRes.rows[0].id;

    await query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role)
      VALUES ($1, 'Super Admin', $2, $3, 'superadmin')
    `, [tenantId, superAdminEmail, fullHash]);
    console.log('Superadmin user created successfully.');
  }

  console.log('Migrations completed successfully.');
}
