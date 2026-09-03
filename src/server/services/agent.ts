import { callAI, TenantAIConfig, getMasterAIConfig } from './ai-provider.js';
import { decrypt } from './encryption.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getScheduleSettings } from '../db/schedule.repo.js';
import { getTenantCurrentMonthUsage, incrementTenantUsage } from '../db/ai-usage.repo.js';
import { getSpecialistsByTenant } from '../db/specialists.repo.js';
import { getCourtsByTenant } from '../db/courts.repo.js';
import { query } from '../db/pool.js';

export interface AgentProcessResult {
  replyText: string;
  isBookingDetected: boolean;
  bookingData?: any;
  isCourtBookingDetected?: boolean;
  courtBookingData?: any;
  isOrderDetected: boolean;
  orderData?: any;
  isHandoffRequested: boolean;
  handoffReason?: string;
  isMediaDetected?: boolean;
  mediaData?: { mediaUrl: string; caption?: string };
  isCancelBookingDetected?: boolean;
  cancelBookingData?: any;
  isRescheduleBookingDetected?: boolean;
  rescheduleBookingData?: any;
  tokensUsed?: number;
}

export async function processWhatsAppMessageWithAI(
  tenantId: string,
  userMessage: string,
  senderPhone: string,
  senderName: string,
  chatHistory: { role: 'user' | 'assistant', content: string }[]
): Promise<AgentProcessResult> {
  const tenant = await getTenantById(tenantId);
  const agentConfig: any = await getAgentConfig(tenantId);
  const services: any[] = await getServicesByTenant(tenantId);
  const products: any[] = await getProductsByTenant(tenantId, true);
  const store = await getStoreSettings(tenantId);
  const schedule = await getScheduleSettings(tenantId);

  const now = new Date();
  const crTime = new Intl.DateTimeFormat('es-CR', {
    timeZone: 'America/Costa_Rica',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);

  const baseUrl = process.env.APP_URL || 'https://betico.tech';
  const storeUrl = tenant?.slug ? `${baseUrl}/tienda/${tenant.slug}` : '';
  const bookingUrl = tenant?.slug ? `${baseUrl}/reservas/${tenant.slug}` : '';

  // 1. SMART INTENT DETECTION & MULTI-TURN CONVERSATION CONTEXT
  const lowerMsg = userMessage.toLowerCase().trim();
  const recentHistoryText = (chatHistory || []).slice(-12).map(h => h.content).join(' ').toLowerCase();
  const conversationContext = `${recentHistoryText} ${lowerMsg}`;

  const isPureGreeting = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|alo|hi|saludos|pura vida|hola que tal|hola como estas)[s!.,?]*$/i.test(lowerMsg);
  const asksForServices = /servicio|cita|reserva|agenda|agendar|horario|hora|fecha|disponib|turno|atencion|lavado|pulido|mantenimiento/i.test(conversationContext);
  const asksForProducts = /precio|costo|cuanto|venden|catalogo|menu|producto|comprar|pedir|orden|foto|imagen|quiero|plato|comida|pizza|hamburguesa|cera|variante|talla|sabor|llevar|agregar|sumar|confirmo/i.test(conversationContext);
  const asksForPayments = /sinpe|transferencia|pago|pagar|cuenta|banco|efectivo|tarjeta|cuentas/i.test(conversationContext);
  const asksForLocation = /ubicacion|donde|direccion|llegar|local|tienda|sucursal|mapa/i.test(conversationContext);
  const asksForHuman = /humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente/i.test(lowerMsg);
  const asksForOrderStatus = /pedido|orden|paquete|comida|donde viene|estado del pedido|como va mi|cuando llega|mi orden|mi pedido/i.test(conversationContext);

  // 2. ENRICHED RAG BLOCKS (Concise, High Density)
  let paymentInfo = '';
  if (asksForPayments || asksForProducts || !isPureGreeting) {
    const methods: string[] = [];
    if (store?.acceptSinpe && store.sinpePhone) methods.push(`SINPE Móvil: ${store.sinpePhone} (${store.sinpeName || tenant?.name})`);
    if (store?.acceptTransfer && store.bankAccountInfo) methods.push(`Transferencia: ${store.bankAccountInfo}`);
    if (store?.acceptCashOnDelivery) methods.push('Efectivo contra entrega');
    if (store?.deliveryEnabled) methods.push(`Envío: ₡${Number(store.deliveryFee || 0).toLocaleString('es-CR')}`);
    if (methods.length > 0) paymentInfo = '💳 Pagos: ' + methods.join(' | ') + '\n';
  }

  let scheduleInfo = '';
  if (asksForServices || asksForLocation || !isPureGreeting) {
    if (schedule?.jornadaConfig) {
      const j = schedule.jornadaConfig;
      scheduleInfo = `⏰ Horario: ${j.startHour || '08:00'} a ${j.endHour || '17:00'} (${j.slotMinutes || 45}m por cita)\n`;
    }
    if (schedule?.vacationConfig?.enabled) {
      const v = schedule.vacationConfig;
      scheduleInfo += `⚠️ Cierre temporal: ${v.startDate} al ${v.endDate} (${v.message})\n`;
    }
  }

  // Smart Filtering for Services across context
  let relevantServicesText = '';
  if (!isPureGreeting && services.length > 0) {
    const contextWords = conversationContext.split(/\s+/).filter(w => w.length > 2);
    let matchedServices = services.filter(s => {
      const sName = s.name.toLowerCase();
      const sCat = (s.category || '').toLowerCase();
      return contextWords.some(w => sName.includes(w) || sCat.includes(w));
    });

    if (matchedServices.length === 0) {
      matchedServices = services.slice(0, 4); // Top 4 if generic query
    }

    if (matchedServices.length > 0) {
      relevantServicesText = '🚗 Servicios:\n' + matchedServices.map(s => 
        `• ${s.name}: ₡${Number(s.price || 0).toLocaleString('es-CR')} (${s.duration || `${s.estimatedMinutes || 45}m`})`
      ).join('\n') + '\n';
    }
  }

  // 1.5 Real-time Busy Appointment Slots & Specialists Injection
  let busySlotsText = '';
  let specialistsText = '';
  if (asksForServices || !isPureGreeting) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const busySlotsRes = await query(`
        SELECT date, time, service
        FROM appointments
        WHERE tenant_id = $1 AND date >= $2 AND status NOT IN ('cancelled', 'cancelado')
        ORDER BY date ASC, time ASC
        LIMIT 40
      `, [tenantId, todayStr]);

      if (busySlotsRes.rows.length > 0) {
        const grouped: Record<string, string[]> = {};
        busySlotsRes.rows.forEach((r: any) => {
          const d = r.date;
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(r.time);
        });
        const busySummary = Object.entries(grouped)
          .map(([d, times]) => `  • ${d}: ${times.join(', ')} (OCUPADOS)`)
          .join('\n');
        busySlotsText = `🚫 HORARIOS YA OCUPADOS (NO OFRECER NI AGENDAR ESTOS HORARIOS):\n${busySummary}\n`;
      }

      const specialists = await getSpecialistsByTenant(tenantId);
      if (specialists && specialists.length > 0) {
        const activeSpecs = specialists.filter(s => s.active);
        if (activeSpecs.length > 0) {
          specialistsText = '👥 Especialistas / Equipo:\n' + 
            activeSpecs.map(s => `• ${s.name}${s.specialty ? ` (${s.specialty})` : ''}`).join('\n') + '\n';
        }
      }
    } catch (slotErr) {
      console.error('[Agent] Error querying busy slots or specialists:', slotErr);
    }
  }

  // 1.6 Sports Courts Injection
  let courtsText = '';
  try {
    const courts = await getCourtsByTenant(tenantId);
    if (courts && courts.length > 0) {
      const activeCourts = courts.filter((c: any) => c.active !== false);
      if (activeCourts.length > 0) {
        courtsText = '⚽/🎾 CANCHAS DEPORTIVAS DISPONIBLES:\n' + activeCourts.map((c: any) => {
          let desc = `• *${c.name}* [${c.sportType || 'cancha'}${c.surface ? `, ${c.surface}` : ''}]: ₡${Number(c.basePrice || 0).toLocaleString('es-CR')}/hora`;
          if (c.hasLighting) desc += ' (iluminación incluida)';
          return desc;
        }).join('\n') + '\n';
      }
    }
  } catch (courtErr) {
    console.error('[Agent] Error fetching courts:', courtErr);
  }

  // Smart Filtering for Products with rich details (variants, descriptions, custom options)
  let relevantProductsText = '';
  if (!isPureGreeting && products.length > 0) {
    const contextWords = conversationContext.split(/\s+/).filter(w => w.length > 2);
    let matchedProducts = products.filter(p => {
      const pName = p.name.toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pTags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
      const pDesc = (p.description || '').toLowerCase();
      return contextWords.some(w => pName.includes(w) || pCat.includes(w) || pTags.includes(w) || pDesc.includes(w));
    });

    if (matchedProducts.length === 0) {
      matchedProducts = products.slice(0, 4); // Top 4 if generic query
    }

    if (matchedProducts.length > 0) {
      relevantProductsText = '🛍️ Catálogo de Productos Relevantes:\n' + matchedProducts.map(p => {
        let details = `• *${p.name}*`;
        if (p.category) details += ` [${p.category}]`;
        details += `: ₡${Number(p.price || 0).toLocaleString('es-CR')}`;
        if (p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)) {
          details += ` (Antes: ₡${Number(p.compareAtPrice).toLocaleString('es-CR')})`;
        }
        details += ` | Stock: ${p.stock ?? 'disponible'}`;

        // Descripción / beneficios
        if (p.description && p.description.trim()) {
          details += `\n  📝 Descripción: ${p.description.trim().replace(/\n+/g, ' ')}`;
        }

        // Variantes (tallas, sabores, presentaciones con precios)
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
          const varList = p.variants.map((v: any) => {
            let vStr = v.name;
            if (v.priceOverride && Number(v.priceOverride) > 0) vStr += ` (₡${Number(v.priceOverride).toLocaleString('es-CR')})`;
            if (v.stock !== undefined && v.stock !== null) vStr += ` [Stock: ${v.stock}]`;
            return vStr;
          }).join(', ');
          details += `\n  🔀 Variantes disponibles: ${varList}`;
        }

        // Características / Variables personalizables (extras, aderezos)
        if (p.customVariables && Array.isArray(p.customVariables) && p.customVariables.length > 0) {
          const varDetails = p.customVariables.map((cv: any) => {
            const opts = (cv.options || []).map((o: any) => {
              return o.price && Number(o.price) > 0 
                ? `${o.name} (+₡${Number(o.price).toLocaleString('es-CR')})` 
                : o.name;
            }).join(', ');
            return `${cv.name}: [${opts || 'opciones'}]`;
          }).join(' | ');
          details += `\n  ⚙️ Opciones/Extras: ${varDetails}`;
        }

        // Fotografía del producto
        if (p.images && p.images.length > 0) {
          const rawUrl = p.images[0].url;
          const photoUrl = rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`;
          details += `\n  📸 Foto: ${photoUrl}`;
        }

        return details;
      }).join('\n\n') + '\n';
    }
  }

  // 3. FETCH ACTIVE BOOKINGS FOR THIS CUSTOMER
  let activeCustomerBookingsText = '';
  try {
    const cleanPhone = senderPhone.replace(/\D/g, '');
    const activeAppts = await query(`
      SELECT service, date, time, status 
      FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
      ORDER BY date ASC, time ASC
      LIMIT 3
    `, [tenantId, cleanPhone.slice(-8)]);

    if (activeAppts.rows.length > 0) {
      activeCustomerBookingsText = '\nCITAS ACTIVAS DE ESTE CLIENTE:\n' + activeAppts.rows.map((a: any) => 
        `- ${a.service} para el ${a.date} a las ${a.time} (Estado: ${a.status === 'confirmed' ? 'Confirmada' : 'Programada'})`
      ).join('\n') + '\n';
    }
  } catch (e) {}

  // 4. FETCH ACTIVE ORDERS FOR THIS CUSTOMER
  let activeCustomerOrdersText = '';
  try {
    const cleanPhone = senderPhone.replace(/\D/g, '');
    const activeOrders = await query(`
      SELECT o.id, o.order_number as "orderNumber", o.status, o.total, o.currency,
             o.delivery_method as "deliveryMethod", o.created_at as "createdAt",
             COALESCE(
               (SELECT json_agg(json_build_object('productName', oi.product_name, 'variantName', oi.variant_name, 'quantity', oi.quantity))
                FROM order_items oi WHERE oi.order_id = o.id), '[]'::json
             ) as items
      FROM orders o
      WHERE o.tenant_id = $1 AND REPLACE(o.customer_phone, '+', '') LIKE '%' || $2 || '%'
        AND o.status NOT IN ('entregado', 'cancelled', 'cancelado', 'delivered')
      ORDER BY o.created_at DESC
      LIMIT 2
    `, [tenantId, cleanPhone.slice(-8)]);

    if (activeOrders.rows.length > 0) {
      const stages = store?.customStages || {
        fase_1: 'Pedido Recibido',
        fase_2: 'En Preparación / Cocina',
        fase_3: 'Listo para Entrega / Despacho',
        fase_4: 'En Camino (Delivery)',
        fase_5: 'Entregado'
      };

      const statusMap: Record<string, string> = {
        'pedido_recibido': stages.fase_1 || 'Recibido',
        'en_preparacion': stages.fase_2 || 'En Preparación',
        'listo_para_entrega': stages.fase_3 || 'Listo para entrega',
        'listo_entrega': stages.fase_3 || 'Listo para entrega',
        'en_camino': stages.fase_4 || 'En Camino (Delivery)',
        'pending': 'Pendiente de confirmación',
        'confirmed': 'Confirmado',
        'preparing': 'En Preparación',
        'shipped': 'En Camino'
      };

      activeCustomerOrdersText = '\nPEDIDOS ACTIVOS EN CURSO DE ESTE CLIENTE:\n' + activeOrders.rows.map((o: any) => {
        const itemsList = (o.items || []).map((it: any) => `${it.quantity}x ${it.productName}${it.variantName ? ` (${it.variantName})` : ''}`).join(', ');
        const st = statusMap[o.status] || o.status;
        return `• Pedido #ORD-${o.orderNumber}: [${itemsList || 'Productos'}] | Estado actual: *${st}* | Total: ₡${Number(o.total || 0).toLocaleString('es-CR')}`;
      }).join('\n') + '\n';
    }
  } catch (e) {}

  // 5. BUILD STRUCTURED SYSTEM PROMPT & CONVERSATION RULES
  const isConversationOngoing = (chatHistory && chatHistory.length > 0);
  const antiGreetingInstruction = isConversationOngoing
    ? `⚠️ CONVERSACIÓN EN CURSO: El cliente ya está interactuando contigo. PROHIBIDO SALUDAR DE NUEVO (no digas "Hola", "Buenas", "Buenos días", etc.). Ve directo al grano respondiendo con calidez y entusiasmo a lo que pide el cliente.\n`
    : `Saluda cordialmente al cliente presentándote como asistente de *${tenant?.name || 'nuestro negocio'}*.\n`;

  const systemPrompt = `Eres el asistente virtual y asesor experto de ventas de *${tenant?.name || 'nuestro negocio'}* en WhatsApp.
IDIOMA: Responde SIEMPRE en español de Costa Rica. NUNCA en otro idioma.
${antiGreetingInstruction}
${agentConfig?.systemPrompt || 'Atiende amablemente a los clientes.'}

Datos del negocio:
${crTime}
${(agentConfig?.showBookingLink !== false && bookingUrl) ? `Reservas online: ${bookingUrl}` : ''}${(agentConfig?.showStoreLink !== false && storeUrl) ? ` | Tienda online: ${storeUrl}` : ''}
${scheduleInfo}${paymentInfo}${relevantServicesText}${relevantProductsText}${courtsText}${specialistsText}${busySlotsText}${activeCustomerBookingsText}${activeCustomerOrdersText}
REGLAS OBLIGATORIAS:
1. Responde SOLO en español con un tono cálido, empático, educado y ágil adaptado al público de Costa Rica (*pura vida*, con mucho gusto, claro que sí).
2. Usa el nombre EXACTO del cliente (${senderName}) cuando sea oportuno. No lo modifiques.
3. Usa *negrita* para datos clave (precios, productos, horarios) y emojis moderados para dar calidez. Sé conciso y claro (1-2 párrafos máximo).
4. Solo menciona productos, servicios y precios que aparezcan arriba en los datos del negocio. Si algo no aparece, indica que consultarás con el equipo.
5. NUNCA inventes URLs, links, procesos ni precios que no estén en la información proporcionada.
6. POLÍTICA DE PRECIOS Y ANTIRREGATEO: Los precios, tarifas y promociones mostrados arriba son oficiales y fijos. Si el cliente insiste en pedir rebajas, regatea o solicita descuentos no oficiales, declina amablemente con simpatía explicando que nuestros precios son los establecidos y destaca la calidad y valor de lo que ofrecemos.

6. ASESORÍA DE PRODUCTOS Y VENTAS (SÉ UN VENDEDOR CONSULTIVO):
- Si el producto tiene variantes (tallas, sabores, modelos, presentaciones), preséntalas amablemente y pregunta cuál prefiere: *"¡Claro! Lo tenemos en presentación de [X] (₡...) y [Y] (₡...). ¿Cuál te gustaría?"*.
- Usa las descripciones para destacar beneficios o responder dudas sobre ingredientes o calidad.
- Si el producto tiene opciones/extras, ofrécelos para que el cliente personalice su orden a gusto.

7. CARRITO CONVERSACIONAL MULTI-PRODUCTO (SUMAR PEDIDOS PROGRESIVAMENTE):
- Cuando el cliente pida un producto y luego agregue otros ("también quiero...", "agrégale además...", "súmale..."), mantén el carrito acumulado con TODOS los productos pedidos a lo largo de la conversación.
- Antes de confirmar, resume amablemente la lista acumulada de productos con subtotales y el monto total general.
- Pregúntale si es para **Envío a Domicilio** (solicitando la dirección) o para **Retirar en el Local**.
- Pregúntale el método de pago preferido (SINPE Móvil, Transferencia o Efectivo).
- Cuando el cliente confirme la compra ("sí confirmo", "listo", "procedamos", "dale"), añade al final:
  <<<COMMAND_ORDER: {"items":[{"productName":"Nombre Exacto","variantName":"opcional","quantity":1}], "deliveryMethod":"delivery"|"pickup", "deliveryAddress":"dirección si aplica", "customerName":"${senderName}"}>>>
- Agradece la compra y brinda los datos de pago del negocio solicitando el comprobante para despacharlo.

8. RASTREO Y CONSULTAS DE ESTADO DE PEDIDOS:
- Si el cliente pregunta por su pedido ("¿Cómo va mi orden?", "¿Dónde viene?", "¿Ya salió?"), revisa la sección "PEDIDOS ACTIVOS EN CURSO DE ESTE CLIENTE" y respóndele de inmediato con el número de orden, los ítems y su estado real actual, dándole tranquilidad.

9. GESTIÓN DE CITAS:
- Para AGENDAR: Cuando el cliente elija servicio, fecha y hora (verificando que NO figure en HORARIOS YA OCUPADOS), y opcionalmente elija con quién atenderse, añade <<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${senderName}","specialistName":"opcional"}>>>.
- Para CANCELAR: Si el cliente pide cancelar una cita activa, SIEMPRE pregúntale primero para confirmar: "¿Estás seguro de que deseas cancelar tu cita de [Servicio] para el [Fecha] a las [Hora]?". SOLO si el cliente responde confirmando ("sí", "confirmo", "correcto", "cancélala"), añade <<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD", "service":"opcional", "reason":"solicitado por cliente"}>>>.
- Para REAGENDAR: Ofrécele los horarios libres disponibles y cuando confirme la nueva fecha y hora, añade <<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD", "newTime":"HH:MM"}>>>.

10. RESERVA DE CANCHAS DEPORTIVAS (FÚTBOL / PÁDEL):
- Si el cliente pregunta por canchas o partidos, ofrécele las canchas del catálogo con sus precios por hora. Pregúntale fecha, hora y modalidad ("full" para cancha completa o "seek_match" si busca rival / partido abierto).
- Cuando el cliente confirme la reserva de cancha, añade al final:
  <<<COMMAND_COURT_BOOKING: {"courtName":"nombre cancha", "date":"YYYY-MM-DD", "time":"HH:MM", "bookingMode":"full"|"seek_match", "teamAName":"${senderName}"}>>>

Acciones disponibles (añade al final SOLO cuando el cliente confirme explícitamente):
Cita: <<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${senderName}","specialistName":"opcional"}>>>
Cancha: <<<COMMAND_COURT_BOOKING: {"courtName":"nombre", "date":"YYYY-MM-DD", "time":"HH:MM", "bookingMode":"full"|"seek_match", "teamAName":"${senderName}"}>>>
Cancelar Cita: <<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD","service":"opcional","reason":"motivo"}>>>
Reagendar Cita: <<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD","newTime":"HH:MM"}>>>
Compra / Pedido: <<<COMMAND_ORDER: {"items":[{"productName":"nombre","variantName":"opcional","quantity":1}], "deliveryMethod":"delivery"|"pickup", "deliveryAddress":"dirección si aplica", "customerName":"${senderName}"}>>>
Foto: <<<COMMAND_SEND_MEDIA: {"mediaUrl":"URL","caption":"desc"}>>>
Humano: <<<COMMAND_HANDOFF: {"reason":"motivo"}>>>`;

  // Structured messages array for clean chat dialogue
  const structuredMessages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];
  if (chatHistory && chatHistory.length > 0) {
    for (const h of chatHistory.slice(-12)) {
      structuredMessages.push({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content
      });
    }
  }
  structuredMessages.push({
    role: 'user',
    content: `${userMessage}`
  });

  // Flat prompt fallback for models that prefer single string
  const flatPrompt = `${systemPrompt}\n\n${chatHistory.slice(-12).map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}\n\nCliente (${senderName}): ${userMessage}\nAsistente:`;

  let apiKey = '';
  let isMarcaBlanca = false;

  if (tenant?.aiApiKeyEncrypted) {
    try { apiKey = decrypt(tenant.aiApiKeyEncrypted); } catch (e) {}
  }

  let config: TenantAIConfig;

  if (apiKey) {
    config = {
      provider: (tenant?.aiProvider as any) || 'gemini',
      apiKey,
      model: tenant?.aiModel || agentConfig?.model || 'gemini-2.5-flash',
      temperature: agentConfig?.temperature || 0.7,
    };
  } else {
    isMarcaBlanca = true;
    const usage = await getTenantCurrentMonthUsage(tenantId);
    if (usage.isExceeded) {
      return {
        replyText: 'Hola, el asistente virtual de este negocio ha completado su cuota mensual de atención automática. Un asesor humano te responderá en breve.',
        isBookingDetected: false,
        isOrderDetected: false,
        isHandoffRequested: true,
        handoffReason: 'Límite de cuota mensual de IA alcanzado',
        tokensUsed: 0
      };
    }

    const masterConfig = await getMasterAIConfig();
    config = {
      ...masterConfig,
      temperature: agentConfig?.temperature || 0.7
    };
  }

  const aiResult = await callAI(config, {
    system: systemPrompt,
    messages: structuredMessages
  });
  let replyText = aiResult.text;

  // Track token usage for Marca Blanca tenants
  if (isMarcaBlanca && aiResult.tokensUsed > 0) {
    await incrementTenantUsage(tenantId, aiResult.tokensUsed);
  }

  let isBookingDetected = false;
  let bookingData;
  let isOrderDetected = false;
  let orderData;
  let isHandoffRequested = false;
  let handoffReason;
  let isMediaDetected = false;
  let mediaData;
  let isCancelBookingDetected = false;
  let cancelBookingData;
  let isRescheduleBookingDetected = false;
  let rescheduleBookingData;
  let isCourtBookingDetected = false;
  let courtBookingData;

  const bookingRegex = /<<<COMMAND_BOOKING:\s*({.*?})>>>/s;
  const courtBookingRegex = /<<<COMMAND_COURT_BOOKING:\s*({.*?})>>>/s;
  const orderRegex = /<<<COMMAND_ORDER:\s*({.*?})>>>/s;
  const handoffRegex = /<<<COMMAND_HANDOFF:\s*({.*?})>>>/s;
  const mediaRegex = /<<<COMMAND_SEND_MEDIA:\s*({.*?})>>>/s;
  const cancelRegex = /<<<COMMAND_CANCEL_BOOKING:\s*({.*?})>>>/s;
  const rescheduleRegex = /<<<COMMAND_RESCHEDULE_BOOKING:\s*({.*?})>>>/s;

function safeParseJSON(rawStr: string): any {
  if (!rawStr || typeof rawStr !== 'string') return null;
  let cleaned = rawStr.trim();
  // Normalize quotes and trailing commas
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    try {
      const relaxed = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(relaxed);
    } catch (e2) {
      return null;
    }
  }
}

  const bookingMatch = replyText.match(bookingRegex);
  if (bookingMatch && bookingMatch[1]) {
    const parsed = safeParseJSON(bookingMatch[1]);
    if (parsed && parsed.service && (parsed.date || parsed.time)) {
      isBookingDetected = true;
      bookingData = parsed;
    }
  }

  const courtMatch = replyText.match(courtBookingRegex);
  if (courtMatch && courtMatch[1]) {
    const parsed = safeParseJSON(courtMatch[1]);
    if (parsed && (parsed.courtName || parsed.courtId) && (parsed.date || parsed.time)) {
      isCourtBookingDetected = true;
      courtBookingData = parsed;
    }
  }

  const cancelMatch = replyText.match(cancelRegex);
  if (cancelMatch && cancelMatch[1]) {
    const parsed = safeParseJSON(cancelMatch[1]);
    if (parsed) {
      isCancelBookingDetected = true;
      cancelBookingData = parsed;
    }
  }

  const rescheduleMatch = replyText.match(rescheduleRegex);
  if (rescheduleMatch && rescheduleMatch[1]) {
    const parsed = safeParseJSON(rescheduleMatch[1]);
    if (parsed && (parsed.newDate || parsed.newTime)) {
      isRescheduleBookingDetected = true;
      rescheduleBookingData = parsed;
    }
  }

  const orderMatch = replyText.match(orderRegex);
  if (orderMatch && orderMatch[1]) {
    const parsed = safeParseJSON(orderMatch[1]);
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      const validItems = parsed.items.filter((it: any) => it.productName && it.productName.trim().length > 0);
      if (validItems.length > 0) {
        isOrderDetected = true;
        orderData = { ...parsed, items: validItems };
      }
    }
  }

  const handoffMatch = replyText.match(handoffRegex);
  if (handoffMatch && handoffMatch[1]) {
    isHandoffRequested = true;
    const parsed = safeParseJSON(handoffMatch[1]);
    if (parsed?.reason) handoffReason = parsed.reason;
  }

  const mediaMatch = replyText.match(mediaRegex);
  if (mediaMatch && mediaMatch[1]) {
    const parsed = safeParseJSON(mediaMatch[1]);
    if (parsed && (parsed.mediaUrl || parsed.url)) {
      isMediaDetected = true;
      mediaData = { mediaUrl: parsed.mediaUrl || parsed.url, caption: parsed.caption };
    }
  }

  replyText = replyText
    .replace(bookingRegex, '')
    .replace(courtBookingRegex, '')
    .replace(orderRegex, '')
    .replace(handoffRegex, '')
    .replace(mediaRegex, '')
    .replace(cancelRegex, '')
    .replace(rescheduleRegex, '')
    .replace(/\*\*/g, '*')
    .trim();

  return {
    replyText,
    isBookingDetected,
    bookingData,
    isCourtBookingDetected,
    courtBookingData,
    isOrderDetected,
    orderData,
    isHandoffRequested,
    handoffReason,
    isMediaDetected,
    mediaData,
    isCancelBookingDetected,
    cancelBookingData,
    isRescheduleBookingDetected,
    rescheduleBookingData,
    tokensUsed: aiResult.tokensUsed
  };
}
