import crypto from 'crypto';
import { query } from './pool.js';
import { hashPassword } from './users.repo.js';

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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      details JSONB,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedule_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      schedule_mode VARCHAR(50) NOT NULL DEFAULT 'jornada',
      config_json JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      remote_jid VARCHAR(100) NOT NULL,
      is_human_mode BOOLEAN DEFAULT FALSE,
      human_mode_until TIMESTAMP WITH TIME ZONE,
      unread BOOLEAN DEFAULT FALSE,
      notes TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tenant_id, remote_jid)
    );

    CREATE TABLE IF NOT EXISTS ai_command_logs (
      id TEXT PRIMARY KEY DEFAULT 'cmd_' || gen_random_uuid()::text,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      remote_jid VARCHAR(100) NOT NULL,
      command_type VARCHAR(50) NOT NULL,
      payload JSONB,
      status VARCHAR(50) NOT NULL,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tenant_payment_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL DEFAULT 'TILOPAY',
      is_enabled BOOLEAN DEFAULT false,
      environment VARCHAR(20) DEFAULT 'SANDBOX',
      api_key_encrypted TEXT,
      api_user VARCHAR(150),
      api_password_encrypted TEXT,
      capture_mode VARCHAR(50) DEFAULT 'IMMEDIATE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, provider)
    );

    CREATE TABLE IF NOT EXISTS tenant_whatsapp_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      instance_name VARCHAR(150),
      api_url VARCHAR(255),
      api_key_encrypted TEXT,
      is_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id)
    );

    CREATE TABLE IF NOT EXISTS payment_config_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      changed_by VARCHAR(100),
      field_changed VARCHAR(100) NOT NULL,
      old_value_masked VARCHAR(255),
      new_value_masked VARCHAR(255),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_drivers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      vehicle_type VARCHAR(50) DEFAULT 'moto',
      plate_number VARCHAR(50),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS access_pin VARCHAR(20);
    UPDATE delivery_drivers SET access_pin = '1234' WHERE access_pin IS NULL OR access_pin = '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_mode VARCHAR(50) DEFAULT 'retail';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_modules JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS restaurant_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS delivery_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS correos_cr_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS local_delivery_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_schedule JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS custom_stages JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS notification_templates JSONB;
    ALTER TABLE services ADD COLUMN IF NOT EXISTS parallel_slots INT DEFAULT 1;
    ALTER TABLE schedule_settings ADD COLUMN IF NOT EXISTS global_parallel_slots INT DEFAULT 1;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS consumption_mode VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_location JSONB;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES delivery_drivers(id) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS waze_url TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel_origin VARCHAR(50) DEFAULT 'WEB_STORE';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link_token UUID UNIQUE;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tilopay_transaction_id VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tilopay_auth_code VARCHAR(100);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_variables JSONB;
    ALTER TABLE services ADD COLUMN IF NOT EXISTS custom_variables JSONB;
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_variables JSONB;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_variables JSONB;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1_sent BOOLEAN DEFAULT FALSE;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_2_sent BOOLEAN DEFAULT FALSE;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reminder_config JSONB;

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      tags TEXT[] DEFAULT '{}',
      total_orders INT DEFAULT 0,
      total_spent NUMERIC(10, 2) DEFAULT 0,
      last_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, phone)
    );

    CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      message_template TEXT NOT NULL,
      media_url TEXT,
      target_segment VARCHAR(50) DEFAULT 'all',
      target_tag VARCHAR(100),
      total_recipients INT DEFAULT 0,
      sent_count INT DEFAULT 0,
      failed_count INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      filename VARCHAR(255) PRIMARY KEY,
      mime_type VARCHAR(100),
      data_base64 TEXT NOT NULL,
      size INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50),
      address TEXT,
      phone VARCHAR(50),
      sinpe_phone VARCHAR(50),
      sinpe_name VARCHAR(100),
      latitude NUMERIC,
      longitude NUMERIC,
      is_main BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS platform_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      value_encrypted TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      phone VARCHAR(50),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS superadmin_instances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      instance_type VARCHAR(50) UNIQUE NOT NULL,
      instance_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(50),
      status VARCHAR(50) DEFAULT 'disconnected',
      qr_code TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS internal_notes TEXT;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE;
    
    CREATE TABLE IF NOT EXISTS tenant_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'CRC',
      payment_method VARCHAR(50) DEFAULT 'sinpe',
      reference VARCHAR(255),
      proof_url TEXT,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'approved',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_monthly_price NUMERIC(10, 2) DEFAULT 29;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(10) DEFAULT 'CRC';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 days');
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 days');
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_proof TEXT;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_ref VARCHAR(255);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(10, 2);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_notes TEXT;

    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS target_contacts JSONB;

    CREATE TABLE IF NOT EXISTS specialists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      specialty VARCHAR(255),
      access_pin VARCHAR(20) NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tenant_ai_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      month_year VARCHAR(7) NOT NULL,
      tokens_used BIGINT DEFAULT 0,
      requests_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, month_year)
    );

    CREATE TABLE IF NOT EXISTS tenant_websites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      website_enabled BOOLEAN DEFAULT true,
      headline VARCHAR(255) DEFAULT 'Bienvenido a nuestro sitio oficial',
      subheadline TEXT DEFAULT 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.',
      about_title VARCHAR(255) DEFAULT 'Conoce Nuestra Historia',
      about_text TEXT DEFAULT 'Somos un negocio apasionado por brindar el mejor servicio y productos de primera categoría. Nuestro compromiso es tu satisfacción total.',
      about_image_url TEXT,
      banner_image_url TEXT,
      logo_url TEXT,
      primary_color VARCHAR(50) DEFAULT '#2563eb',
      accent_color VARCHAR(50) DEFAULT '#f59e0b',
      font_family VARCHAR(50) DEFAULT 'Inter',
      show_store_button BOOLEAN DEFAULT true,
      show_booking_button BOOLEAN DEFAULT true,
      store_button_text VARCHAR(100) DEFAULT 'Ver Menú y Productos',
      booking_button_text VARCHAR(100) DEFAULT 'Agendar Cita en Línea',
      features_json JSONB DEFAULT '[{"title":"Calidad Garantizada","desc":"Productos y servicios seleccionados con los más altos estándares."},{"title":"Atención Rápida","desc":"Respuestas y pedidos inmediatos con asistencia 24/7."},{"title":"Pagos Seguros","desc":"Aceptamos SINPE Móvil, transferencias y tarjetas."}]'::jsonb,
      testimonials_json JSONB DEFAULT '[{"name":"Cliente Satisfecho","comment":"¡Excelente servicio y atención rápida! 100% recomendado.","rating":5}]'::jsonb,
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      contact_address TEXT,
      instagram_url VARCHAR(255),
      facebook_url VARCHAR(255),
      show_about_section BOOLEAN DEFAULT true,
      show_features_section BOOLEAN DEFAULT true,
      show_products_section BOOLEAN DEFAULT true,
      show_services_section BOOLEAN DEFAULT true,
      show_testimonials_section BOOLEAN DEFAULT true,
      show_contact_section BOOLEAN DEFAULT true,
      header_layout VARCHAR(50) DEFAULT 'split',
      overlay_color VARCHAR(50) DEFAULT '#0f172a',
      overlay_opacity INT DEFAULT 0,
      show_whatsapp_button BOOLEAN DEFAULT true,
      whatsapp_button_text VARCHAR(100) DEFAULT 'WhatsApp Directo',
      logo_white_url TEXT,
      button_style VARCHAR(50) DEFAULT 'rounded',
      button_hover_effect BOOLEAN DEFAULT true,
      button_text_color VARCHAR(50) DEFAULT '#ffffff',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_about_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_features_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_products_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_services_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_testimonials_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_contact_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS header_layout VARCHAR(50) DEFAULT 'split';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS overlay_color VARCHAR(50) DEFAULT '#0f172a';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS overlay_opacity INT DEFAULT 0;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_whatsapp_button BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS whatsapp_button_text VARCHAR(100) DEFAULT 'WhatsApp Directo';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS logo_white_url TEXT;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS button_style VARCHAR(50) DEFAULT 'rounded';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS button_hover_effect BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(50) DEFAULT '#ffffff';

    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL;
    ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS human_mode_until TIMESTAMP WITH TIME ZONE;

    CREATE INDEX IF NOT EXISTS idx_tenant_websites_tenant ON tenant_websites(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_month ON tenant_ai_usage(tenant_id, month_year);
    CREATE INDEX IF NOT EXISTS idx_specialists_tenant ON specialists(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_specialist ON appointments(specialist_id);
    CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
    CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON whatsapp_campaigns(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_uploaded_files_filename ON uploaded_files(filename);
    CREATE INDEX IF NOT EXISTS idx_delivery_drivers_tenant ON delivery_drivers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_settings_tenant ON schedule_settings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant ON chat_sessions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_id ON chat_messages(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_carts_tenant_id ON carts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_store_settings_tenant_id ON store_settings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_otp ON password_reset_tokens(otp_code);
    CREATE INDEX IF NOT EXISTS idx_ai_cmd_logs_tenant ON ai_command_logs(tenant_id, status);
    CREATE INDEX IF NOT EXISTS idx_ai_cmd_logs_jid ON ai_command_logs(remote_jid);
    CREATE INDEX IF NOT EXISTS idx_tenant_payment_configs_tenant ON tenant_payment_configs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_configs_tenant ON tenant_whatsapp_configs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_payment_audit_tenant ON payment_config_audit_log(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_token ON orders(payment_link_token);
  `;

  await query(tables);

  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'admin@betico.cr').toLowerCase().trim();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'BeticoAdmin2026!';
  const modernHash = hashPassword(superAdminPassword);

  const checkAdmin = await query(`SELECT id, tenant_id FROM users WHERE LOWER(email) = LOWER($1)`, [superAdminEmail]);
  if (checkAdmin.rows.length === 0) {
    let tenantRes = await query(`SELECT id FROM tenants WHERE slug = 'superadmin'`);
    let tenantId;
    if (tenantRes.rows.length === 0) {
      const created = await query(`
        INSERT INTO tenants (name, slug, active, plan) 
        VALUES ('Betico Superadmin', 'superadmin', true, 'enterprise') 
        RETURNING id
      `);
      tenantId = created.rows[0].id;
    } else {
      tenantId = tenantRes.rows[0].id;
    }

    await query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, active)
      VALUES ($1, 'Super Admin', $2, $3, 'superadmin', true)
    `, [tenantId, superAdminEmail, modernHash]);
    console.log('Superadmin user created successfully.');
  } else {
    // Ensure superadmin password hash is updated and account is active
    await query(`
      UPDATE users 
      SET password_hash = $1, active = true, role = 'superadmin', updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER($2)
    `, [modernHash, superAdminEmail]);
    console.log('Superadmin user credentials synchronized.');
  }

  // Seed default platform settings for LocalAI & Deployments if empty
  const defaultPlatformSettings = [
    { key: 'localai_url', value: process.env.LOCALAI_URL || 'https://beticoia-localai.qvtdko.easypanel.host/v1' },
    { key: 'localai_model', value: 'gpt-4o' },
    { key: 'localai_enabled', value: 'true' },
    { key: 'master_ai_provider', value: 'gemini' },
    { key: 'master_ai_model', value: 'gemini-2.5-flash' },
    { key: 'quota_starter_tokens', value: '25000' },
    { key: 'quota_pro_tokens', value: '100000' },
    { key: 'quota_business_tokens', value: '300000' },
    { key: 'deploy_webhook_app', value: 'http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b' },
    { key: 'deploy_webhook_localai', value: 'http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e' }
  ];

  for (const s of defaultPlatformSettings) {
    await query(`
      INSERT INTO platform_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = CASE 
        WHEN platform_settings.value = 'http://localhost:8080/v1' THEN EXCLUDED.value 
        ELSE platform_settings.value 
      END
    `, [s.key, s.value]);
  }

  // Ensure localhost default is upgraded to Easypanel URL
  await query(`
    UPDATE platform_settings 
    SET value = 'https://beticoia-localai.qvtdko.easypanel.host/v1' 
    WHERE key = 'localai_url' AND (value = 'http://localhost:8080/v1' OR value IS NULL OR value = '')
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS courts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL DEFAULT 'Cancha 1',
      sport_type VARCHAR(100) NOT NULL DEFAULT 'futbol',
      custom_sport_type VARCHAR(100),
      description TEXT,
      surface VARCHAR(100),
      is_indoor BOOLEAN DEFAULT false,
      has_lighting BOOLEAN DEFAULT false,
      base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_display VARCHAR(100),
      duration_minutes INT NOT NULL DEFAULT 60,
      team_size INT DEFAULT 5,
      max_extra_players INT DEFAULT 2,
      extra_player_fee NUMERIC(10,2) DEFAULT 0,
      active BOOLEAN DEFAULT true,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS court_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      time TIME NOT NULL,
      duration_minutes INT NOT NULL DEFAULT 60,
      booking_mode VARCHAR(20) NOT NULL DEFAULT 'full',
      match_status VARCHAR(20) DEFAULT 'confirmed',
      match_expiry_hours NUMERIC(4,1) DEFAULT 1,
      team_a_name VARCHAR(255) DEFAULT 'Equipo A',
      team_a_captain VARCHAR(255) NOT NULL,
      team_a_phone VARCHAR(50) NOT NULL,
      team_a_players INT DEFAULT 5,
      team_a_extra_players INT DEFAULT 0,
      team_a_paid BOOLEAN DEFAULT false,
      team_b_name VARCHAR(255),
      team_b_captain VARCHAR(255),
      team_b_phone VARCHAR(50),
      team_b_players INT DEFAULT 5,
      team_b_extra_players INT DEFAULT 0,
      team_b_paid BOOLEAN DEFAULT false,
      total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_per_team NUMERIC(10,2),
      payment_mode VARCHAR(20) DEFAULT 'both',
      sport_type VARCHAR(100),
      skill_level VARCHAR(50),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_courts_tenant ON courts(tenant_id, active);
    CREATE INDEX IF NOT EXISTS idx_cb_tenant_date ON court_bookings(tenant_id, date, time);
    CREATE INDEX IF NOT EXISTS idx_cb_open_matches ON court_bookings(match_status, date) WHERE match_status = 'open';
  `);

  // Add courts button columns to tenant_websites
  await query(`
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_courts_button BOOLEAN DEFAULT false;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS courts_button_text VARCHAR(255) DEFAULT 'Reservar Cancha';
  `).catch(() => {});

  // Payment integration columns for store_settings, appointments and court_bookings
  await query(`
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS accept_sinpe_tilopay BOOLEAN DEFAULT false;

    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tilopay_transaction_id VARCHAR(100);
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tilopay_auth_code VARCHAR(100);

    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_transaction_id_a VARCHAR(100);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_auth_code_a VARCHAR(100);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_transaction_id_b VARCHAR(100);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_auth_code_b VARCHAR(100);
  `).catch((err) => {
    console.warn('[Migrations] Payment columns warning:', err?.message || err);
  });

  console.log('Migrations completed successfully.');
}
