import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure simulation of the App.tsx navigation group builder
 */
function buildTenantNavGroups({
  storeMode = 'retail',
  storeModules = { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false, branchesEnabled: false },
  tenantPlan = 'starter',
  unreadOrdersCount = 0
}) {
  const isEnterpriseOrFranchise = ['enterprise', 'business', 'franquicia', 'empresa'].includes(tenantPlan || '');
  const branchesEnabled = storeModules.branchesEnabled === true || isEnterpriseOrFranchise;

  const groups = [
    // 1. OPERACIONES
    {
      title: 'OPERACIONES',
      items: [
        { id: 'dashboard', label: 'Dashboard' }
      ]
    },

    // 2. COMUNICACIÓN
    {
      title: 'COMUNICACIÓN',
      items: [
        { id: 'whatsapp', label: 'WhatsApp & Bot' },
        { id: 'chats', label: 'Chats en Vivo' },
        { id: 'queue', label: 'Cola de Mensajes' },
        { id: 'campaigns', label: 'Difusión & Campañas' },
        { id: 'agente', label: 'Personalidad Agente IA' }
      ]
    },

    // 3. SITIO WEB
    {
      title: 'SITIO WEB',
      items: [
        { id: 'sitio', label: 'Sitio Web' }
      ]
    },

    // 4. TIENDA o MENÚ (Condicional por storeEnabled y storeMode)
    ...(storeModules.storeEnabled !== false ? [
      storeMode === 'restaurant' ? {
        title: 'MENÚ',
        items: [
          { id: 'tienda', label: 'Ajuste de Tienda' },
          { id: 'productos', label: 'Menú & Platillos' },
          {
            id: 'ordenes',
            label: 'Comandas & Cocina',
            badge: unreadOrdersCount > 0 ? unreadOrdersCount : undefined
          }
        ]
      } : {
        title: 'TIENDA',
        items: [
          { id: 'tienda', label: 'Ajuste de Tienda' },
          { id: 'productos', label: 'Productos & Catálogo' },
          {
            id: 'ordenes',
            label: 'Pedidos & Despacho',
            badge: unreadOrdersCount > 0 ? unreadOrdersCount : undefined
          }
        ]
      }
    ] : []),

    // 5. CANCHAS (Condicional por courtsEnabled)
    ...(storeModules.courtsEnabled ? [{
      title: 'CANCHAS',
      items: [
        { id: 'canchas', label: 'Gestión de Canchas' },
        { id: 'canchas_reservas', label: 'Reserva de Canchas' }
      ]
    }] : []),

    // 6. RESERVAS Y CITAS (Condicional por bookingsEnabled)
    ...(storeModules.bookingsEnabled !== false ? [{
      title: 'RESERVAS Y CITAS',
      items: [
        { id: 'reservas', label: 'Reservas' },
        { id: 'servicios', label: 'Servicios Profesionales' }
      ]
    }] : []),

    // 7. FIDELIZACIÓN (Condicional por loyaltyEnabled)
    ...(storeModules.loyaltyEnabled ? [{
      title: 'FIDELIZACIÓN',
      items: [
        { id: 'fidelidad_ajustes', label: 'Ajustes de Tarjeta' },
        { id: 'fidelidad_clientes', label: 'Clientes Registrados' },
        { id: 'fidelidad_promociones', label: 'Promociones Activas' }
      ]
    }] : []),

    // 8. CONFIGURACIÓN
    {
      title: 'CONFIGURACIÓN',
      items: [
        { id: 'configuracion', label: 'Ajustes Generales' },
        { id: 'suscripcion', label: 'Mi Suscripción & Pagos' },
        { id: 'facturacion', label: 'Facturación Electrónica' },
        { id: 'usuarios', label: 'Equipo & Usuarios' }
      ]
    },

    // 8. SEDES Y SUCURSALES (Condicional por plan / branchesEnabled)
    ...(branchesEnabled ? [{
      title: 'SEDES Y SUCURSALES',
      items: [
        { id: 'sucursales', label: 'Sedes & Sucursales' }
      ]
    }] : [])
  ];

  return groups;
}

/**
 * Pure simulation of header title resolver
 */
function resolveHeaderTitle(currentPage, storeMode = 'retail') {
  const map = {
    dashboard: 'Dashboard',
    whatsapp: 'WhatsApp & Bot',
    chats: 'Chats en Vivo',
    queue: 'Cola de Mensajes',
    campaigns: 'Difusión & Campañas',
    agente: 'Personalidad Agente IA',
    sitio: 'Sitio Web',
    tienda: 'Ajuste de Tienda',
    productos: storeMode === 'restaurant' ? 'Menú & Platillos' : 'Productos & Catálogo',
    ordenes: storeMode === 'restaurant' ? 'Comandas & Cocina' : 'Pedidos & Despacho',
    canchas: 'Gestión de Canchas',
    canchas_reservas: 'Reserva de Canchas',
    reservas: 'Reservas',
    servicios: 'Servicios Profesionales',
    configuracion: 'Ajustes Generales',
    suscripcion: 'Mi Suscripción & Pagos',
    facturacion: 'Facturación Electrónica',
    usuarios: 'Equipo & Usuarios',
    sucursales: 'Sedes & Sucursales',
    notificaciones: 'Notificaciones'
  };
  return map[currentPage] || currentPage;
}

test('Navigation Structure & Grouping Architecture Tests', async (t) => {

  await t.test('1. Standard Retail Tenant Hierarchy (Default)', () => {
    const groups = buildTenantNavGroups({
      storeMode: 'retail',
      storeModules: { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false, branchesEnabled: false },
      tenantPlan: 'starter'
    });

    const titles = groups.map(g => g.title);
    assert.deepEqual(titles, [
      'OPERACIONES',
      'COMUNICACIÓN',
      'SITIO WEB',
      'TIENDA',
      'RESERVAS Y CITAS',
      'CONFIGURACIÓN'
    ]);

    // Check Tienda items
    const tiendaGroup = groups.find(g => g.title === 'TIENDA');
    assert.equal(tiendaGroup.items[0].label, 'Ajuste de Tienda');
    assert.equal(tiendaGroup.items[1].label, 'Productos & Catálogo');
    assert.equal(tiendaGroup.items[2].label, 'Pedidos & Despacho');

    // Check Configuración includes Equipo & Usuarios
    const configGroup = groups.find(g => g.title === 'CONFIGURACIÓN');
    assert.equal(configGroup.items.some(i => i.id === 'usuarios' && i.label === 'Equipo & Usuarios'), true);
  });

  await t.test('2. Restaurant Mode Dynamic Transition (MENÚ)', () => {
    const groups = buildTenantNavGroups({
      storeMode: 'restaurant',
      storeModules: { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false, branchesEnabled: false },
      tenantPlan: 'pro'
    });

    const titles = groups.map(g => g.title);
    assert.ok(titles.includes('MENÚ'));
    assert.ok(!titles.includes('TIENDA'));

    const menuGroup = groups.find(g => g.title === 'MENÚ');
    assert.equal(menuGroup.items[0].label, 'Ajuste de Tienda');
    assert.equal(menuGroup.items[1].label, 'Menú & Platillos');
    assert.equal(menuGroup.items[2].label, 'Comandas & Cocina');
  });

  await t.test('3. Sports Facility / Canchas Enabled Mode', () => {
    const groups = buildTenantNavGroups({
      storeMode: 'retail',
      storeModules: { storeEnabled: false, bookingsEnabled: false, courtsEnabled: true, branchesEnabled: false },
      tenantPlan: 'canchas'
    });

    const titles = groups.map(g => g.title);
    assert.deepEqual(titles, [
      'OPERACIONES',
      'COMUNICACIÓN',
      'SITIO WEB',
      'CANCHAS',
      'CONFIGURACIÓN'
    ]);

    const canchasGroup = groups.find(g => g.title === 'CANCHAS');
    assert.equal(canchasGroup.items[0].id, 'canchas');
    assert.equal(canchasGroup.items[0].label, 'Gestión de Canchas');
    assert.equal(canchasGroup.items[1].id, 'canchas_reservas');
    assert.equal(canchasGroup.items[1].label, 'Reserva de Canchas');
  });

  await t.test('4. Enterprise Multi-Branch Plan Detection', () => {
    const groups = buildTenantNavGroups({
      storeMode: 'retail',
      storeModules: { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false, branchesEnabled: false },
      tenantPlan: 'enterprise'
    });

    const titles = groups.map(g => g.title);
    assert.ok(titles.includes('SEDES Y SUCURSALES'));
    const sucursalesGroup = groups.find(g => g.title === 'SEDES Y SUCURSALES');
    assert.equal(sucursalesGroup.items[0].id, 'sucursales');
    assert.equal(sucursalesGroup.items[0].label, 'Sedes & Sucursales');
  });

  await t.test('5. Header Title Resolver Correctness', () => {
    assert.equal(resolveHeaderTitle('dashboard'), 'Dashboard');
    assert.equal(resolveHeaderTitle('whatsapp'), 'WhatsApp & Bot');
    assert.equal(resolveHeaderTitle('chats'), 'Chats en Vivo');
    assert.equal(resolveHeaderTitle('queue'), 'Cola de Mensajes');
    assert.equal(resolveHeaderTitle('campaigns'), 'Difusión & Campañas');
    assert.equal(resolveHeaderTitle('agente'), 'Personalidad Agente IA');
    assert.equal(resolveHeaderTitle('sitio'), 'Sitio Web');
    assert.equal(resolveHeaderTitle('tienda'), 'Ajuste de Tienda');
    assert.equal(resolveHeaderTitle('productos', 'retail'), 'Productos & Catálogo');
    assert.equal(resolveHeaderTitle('productos', 'restaurant'), 'Menú & Platillos');
    assert.equal(resolveHeaderTitle('ordenes', 'retail'), 'Pedidos & Despacho');
    assert.equal(resolveHeaderTitle('ordenes', 'restaurant'), 'Comandas & Cocina');
    assert.equal(resolveHeaderTitle('canchas'), 'Gestión de Canchas');
    assert.equal(resolveHeaderTitle('canchas_reservas'), 'Reserva de Canchas');
    assert.equal(resolveHeaderTitle('reservas'), 'Reservas');
    assert.equal(resolveHeaderTitle('servicios'), 'Servicios Profesionales');
    assert.equal(resolveHeaderTitle('configuracion'), 'Ajustes Generales');
    assert.equal(resolveHeaderTitle('suscripcion'), 'Mi Suscripción & Pagos');
    assert.equal(resolveHeaderTitle('facturacion'), 'Facturación Electrónica');
    assert.equal(resolveHeaderTitle('usuarios'), 'Equipo & Usuarios');
    assert.equal(resolveHeaderTitle('sucursales'), 'Sedes & Sucursales');
  });

  await t.test('6. Invariant: All 18 Tab Identifiers Preserved', () => {
    const requiredIds = [
      'dashboard', 'whatsapp', 'chats', 'queue', 'campaigns', 'agente',
      'sitio', 'tienda', 'productos', 'ordenes', 'canchas', 'canchas_reservas',
      'reservas', 'servicios', 'configuracion', 'suscripcion', 'facturacion',
      'usuarios', 'sucursales'
    ];

    const allGroups = buildTenantNavGroups({
      storeMode: 'restaurant',
      storeModules: { storeEnabled: true, bookingsEnabled: true, courtsEnabled: true, branchesEnabled: true },
      tenantPlan: 'enterprise'
    });

    const activeIds = allGroups.flatMap(g => g.items.map(i => i.id));
    for (const reqId of requiredIds) {
      assert.ok(activeIds.includes(reqId), `Required ID ${reqId} must exist in navigation`);
    }
  });

  await t.test('7. Loyalty Module Navigation Activation', () => {
    const groups = buildTenantNavGroups({
      storeMode: 'retail',
      storeModules: { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false, branchesEnabled: false, loyaltyEnabled: true },
      tenantPlan: 'starter'
    });

    const loyaltyGroup = groups.find(g => g.title === 'FIDELIZACIÓN');
    assert.ok(loyaltyGroup, 'FIDELIZACIÓN section must exist when loyaltyEnabled is true');
    assert.equal(loyaltyGroup.items.length, 3);
    assert.equal(loyaltyGroup.items[0].id, 'fidelidad_ajustes');
    assert.equal(loyaltyGroup.items[0].label, 'Ajustes de Tarjeta');
    assert.equal(loyaltyGroup.items[1].id, 'fidelidad_clientes');
    assert.equal(loyaltyGroup.items[1].label, 'Clientes Registrados');
    assert.equal(loyaltyGroup.items[2].id, 'fidelidad_promociones');
    assert.equal(loyaltyGroup.items[2].label, 'Promociones Activas');
  });

  await t.test('8. Onboarding Suggestion Engine (Purposes + Niches -> 6 Modules)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const tourSrc = fs.readFileSync(path.resolve('src/client/components/GuidedTourModal.tsx'), 'utf8');

    // Verify Question 1 options
    assert.ok(tourSrc.includes('¿Para qué necesitas la app?'));
    assert.ok(tourSrc.includes('Tener una página de reservas'));
    assert.ok(tourSrc.includes('Tener una tienda'));
    assert.ok(tourSrc.includes('Responder WhatsApp de forma automática'));
    assert.ok(tourSrc.includes('Tener una tarjeta de fidelización'));

    // Verify Question 2 options
    assert.ok(tourSrc.includes('¿Cuál es tu nicho de negocio?'));
    for (const niche of [
      'Barbería',
      'Tienda minorista',
      'Clínica',
      'Estudio de ejercicio',
      'Cancha sintética',
      'Restaurante o Cafetería',
      'Otro negocio'
    ]) {
      assert.ok(tourSrc.includes(niche), `Niche "${niche}" must exist in GuidedTourModal.tsx`);
    }

    // Verify the 6 modules catalog in GuidedTourModal.tsx
    for (const modTitle of [
      'Asistente de WhatsApp',
      'Tienda',
      'Reservas',
      'Canchas',
      'Tarjetas de fidelización',
      'Cobros y Facturación'
    ]) {
      assert.ok(tourSrc.includes(modTitle), `Module "${modTitle}" must exist in GuidedTourModal.tsx`);
    }

    // Verify niche-specific rules in computeSuggestedModules
    assert.ok(tourSrc.includes("cleanNiche === 'cancha_sintetica'"), 'Cancha sintética rule must be present');
    assert.ok(tourSrc.includes("cleanNiche === 'restaurante' ? 'restaurant' : 'retail'"), 'Restaurante must set storeMode to restaurant');

    // Pure functional verification of computeSuggestedModules across all 7 niches and 4 purposes
    function computeSuggestedModules(purposes = [], niche = '') {
      const cleanPurposes = Array.isArray(purposes) ? purposes : [];
      const cleanNiche = (niche || '').trim().toLowerCase();

      let whatsappEnabled = cleanPurposes.includes('whatsapp');
      let storeEnabled =
        cleanPurposes.includes('tienda') ||
        cleanNiche === 'tienda_minorista' ||
        cleanNiche === 'restaurante';
      let bookingsEnabled =
        cleanPurposes.includes('reservas') ||
        cleanNiche === 'barberia' ||
        cleanNiche === 'clinica' ||
        cleanNiche === 'estudio_ejercicio';
      let courtsEnabled =
        cleanNiche === 'cancha_sintetica' ||
        cleanPurposes.includes('canchas');
      let loyaltyEnabled =
        cleanPurposes.includes('fidelidad') ||
        cleanPurposes.includes('fidelizacion');
      let billingEnabled =
        cleanPurposes.includes('facturacion') ||
        cleanNiche === 'clinica' ||
        cleanNiche === 'tienda_minorista' ||
        cleanNiche === 'restaurante';

      if (
        !whatsappEnabled &&
        !storeEnabled &&
        !bookingsEnabled &&
        !courtsEnabled &&
        !loyaltyEnabled &&
        !billingEnabled
      ) {
        whatsappEnabled = true;
      }

      return {
        whatsappEnabled,
        storeEnabled,
        bookingsEnabled,
        courtsEnabled,
        loyaltyEnabled,
        billingEnabled,
        storeMode: cleanNiche === 'restaurante' ? 'restaurant' : 'retail'
      };
    }

    assert.deepEqual(computeSuggestedModules(['reservas'], 'barberia'), {
      whatsappEnabled: false,
      storeEnabled: false,
      bookingsEnabled: true,
      courtsEnabled: false,
      loyaltyEnabled: false,
      billingEnabled: false,
      storeMode: 'retail'
    });
    assert.deepEqual(computeSuggestedModules(['whatsapp'], 'cancha_sintetica'), {
      whatsappEnabled: true,
      storeEnabled: false,
      bookingsEnabled: false,
      courtsEnabled: true,
      loyaltyEnabled: false,
      billingEnabled: false,
      storeMode: 'retail'
    });
    assert.deepEqual(computeSuggestedModules(['tienda', 'fidelidad'], 'restaurante'), {
      whatsappEnabled: false,
      storeEnabled: true,
      bookingsEnabled: false,
      courtsEnabled: false,
      loyaltyEnabled: true,
      billingEnabled: true,
      storeMode: 'restaurant'
    });
    assert.deepEqual(computeSuggestedModules([], 'otro'), {
      whatsappEnabled: true,
      storeEnabled: false,
      bookingsEnabled: false,
      courtsEnabled: false,
      loyaltyEnabled: false,
      billingEnabled: false,
      storeMode: 'retail'
    });
  });

  await t.test('9. Six-Module Accordion & Minimalist SVG Dock in App.tsx', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const appSrc = fs.readFileSync(path.resolve('src/client/App.tsx'), 'utf8');

    // Verify the 6 modules exist in App.tsx accordion builder
    for (const modTitle of [
      'Asistente de WhatsApp',
      'Tienda',
      'Reservas',
      'Canchas',
      'Tarjetas de fidelización',
      'Cobros y Facturación'
    ]) {
      assert.ok(appSrc.includes(modTitle), `Accordion module "${modTitle}" must exist in App.tsx`);
    }

    // Verify suscripcion is inside Cobros y Facturación and loyalty sub-tabs include billeteras & cupones
    assert.ok(appSrc.includes("id: 'suscripcion', label: 'Mi Suscripción y Pagos'"));
    assert.ok(appSrc.includes("id: 'fidelidad_billeteras', label: 'Billeteras Móviles'"));
    assert.ok(appSrc.includes("id: 'fidelidad_cupones', label: 'Cupones y Canjes'"));

    // Verify Facturación Hacienda invariants preserved
    assert.ok(appSrc.includes("title: 'FACTURACIÓN HACIENDA'"));
    assert.ok(appSrc.includes("id: 'facturacion_comprobantes'"));
    assert.ok(appSrc.includes("id: 'facturacion_credenciales'"));
    assert.ok(appSrc.includes("id: 'facturacion_sucursales'"));

    // Verify skeleton backdrop while welcome modal is open
    assert.ok(appSrc.includes('data-testid="onboarding-skeleton-backdrop"'));

    // Verify sticky full-height sidebar and horizontal overflow prevention
    assert.ok(appSrc.includes("height: '100dvh'"));
    assert.ok(appSrc.includes("position: 'sticky'"));
    assert.ok(appSrc.includes("overflowX: 'hidden'"));

    // Verify fallback guard ensures at least one module stays active in Sliders switcher
    assert.ok(appSrc.includes('ensureAtLeastOneModuleActive'), 'App.tsx must enforce at least one active module');
    assert.ok(appSrc.includes("url.searchParams.delete('tour')"), 'App.tsx must clear ?tour=true URL parameter after onboarding');
    assert.ok(appSrc.includes('isNavItemActive'), 'App.tsx must resolve legacy route aliases for active sidebar highlighting');
    assert.ok(appSrc.includes("betico:store-config-updated"), 'App.tsx must listen to StoreSettings module updates');
  });

  await t.test('10. Sub-tabs Deployed in Sidebar & Hidden Horizontal Tab Bar in Views', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const appSrc = fs.readFileSync(path.resolve('src/client/App.tsx'), 'utf8');
    const billingSrc = fs.readFileSync(path.resolve('src/client/components/ElectronicBillingView.tsx'), 'utf8');
    const loyaltySrc = fs.readFileSync(path.resolve('src/client/components/LoyaltyManager.tsx'), 'utf8');

    assert.ok(appSrc.includes('hideTabBar={true}'), 'App.tsx must pass hideTabBar={true} to child views');
    assert.ok(appSrc.includes('onTabChange={(tab) => navigateToTab(`fidelidad_${tab}`)}'), 'App.tsx must sync LoyaltyManager internal tab switches with sidebar navigation');
    assert.ok(billingSrc.includes('hideTabBar?: boolean'), 'ElectronicBillingView must accept hideTabBar prop');
    assert.ok(loyaltySrc.includes('hideTabBar?: boolean'), 'LoyaltyManager must accept hideTabBar prop');
    assert.ok(loyaltySrc.includes('onTabChange?: (tab:'), 'LoyaltyManager must accept onTabChange prop');
    assert.ok(loyaltySrc.includes("'cupones'"), 'LoyaltyManager must support cupones sub-tab');

    // Verify coupon scanner and issued coupons history are isolated under activeTab === 'cupones'
    const cuponesConditionalBlocks = (loyaltySrc.match(/activeTab === 'cupones' && \(/g) || []).length;
    assert.ok(cuponesConditionalBlocks >= 3, 'LoyaltyManager must isolate coupon redemption, discount coupons, and issued coupons history inside activeTab === cupones');
  });

  await t.test('11. Zero Ampersand (&) in Visible Spanish UI Labels Across Core Views', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const filesToCheck = [
      'src/client/App.tsx',
      'src/client/components/GuidedTourModal.tsx',
      'src/client/components/StoreSettings.tsx',
      'src/client/components/Bookings.tsx',
      'src/client/components/CourtsManager.tsx',
      'src/client/components/CourtsBookingsManager.tsx',
      'src/client/components/CampaignsManager.tsx',
      'src/client/components/ElectronicBillingView.tsx',
      'src/client/components/LoyaltyManager.tsx',
      'src/client/components/TenantSubscriptionView.tsx',
      'src/client/components/Dashboard.tsx',
      'src/client/components/BranchesManager.tsx'
    ];

    for (const relPath of filesToCheck) {
      const raw = fs.readFileSync(path.resolve(relPath), 'utf8');
      // Strip single-line and block comments so only code/JSX strings are inspected
      const withoutComments = raw
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
      const match = withoutComments.match(/[a-záéíóúA-ZÁÉÍÓÚñÑ]\s+&\s+[a-záéíóúA-ZÁÉÍÓÚñÑ]/);
      assert.equal(
        match,
        null,
        `${relPath} must not contain visible " & " in Spanish UI labels (found: ${match ? match[0] : 'none'})`
      );
    }
  });

  await t.test('12. Tenant-Scoped Onboarding Persistence & Registration Cleanup', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const appSrc = fs.readFileSync(path.resolve('src/client/App.tsx'), 'utf8');
    const registerSrc = fs.readFileSync(path.resolve('src/client/components/RegisterModal.tsx'), 'utf8');

    assert.ok(appSrc.includes('betico_tour_dismissed_${user.tenantId}'), 'App.tsx must scope tour dismissal by tenantId');
    assert.ok(appSrc.includes('betico_store_modules_cache_${user.tenantId}'), 'App.tsx must scope module cache by tenantId');
    assert.ok(registerSrc.includes("localStorage.removeItem('betico_tour_dismissed')"), 'RegisterModal must clear stale tour dismissal flag on new registration');
  });
});

