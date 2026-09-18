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

    // 7. CONFIGURACIÓN
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
});
