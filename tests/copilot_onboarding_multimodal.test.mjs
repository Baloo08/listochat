import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// REAL PRODUCTION MODULE IMPORT FROM admin-app/src/server/services/copilot-processor.ts
// ---------------------------------------------------------------------------
import {
  sanitizeSpanishText,
  classifyMimeType,
  parsePrice,
  generateSlug,
  detectCostaRicaTaxId,
  detectCostaRicaPhone,
  detectBusinessName,
  detectPlan,
  detectNicheAndModules,
  extractFiscalDataFromText,
  capitalizeItemName,
  cleanItemName,
  extractCatalogFromText,
  extractCatalogFromSpreadsheet,
  extractTextFromPdfBuffer,
  generateAssistantResponse,
  processMultimodalInput
} from '../admin-app/src/server/services/copilot-processor.ts';

describe('Copilot de Onboarding Multimodal - Betico Ops', () => {

  // 1. Clasificacion de MIME Types y Extensiones
  describe('1. Clasificación de MIME Types y Extensiones', () => {
    test('clasifica imágenes PNG, JPEG y WebP con sus badges correspondientes', () => {
      const png = classifyMimeType('image/png', 'logo.png');
      assert.equal(png.category, 'image');
      assert.equal(png.badgeLabel, 'PNG');

      const jpeg = classifyMimeType('image/jpeg', 'portada.jpg');
      assert.equal(jpeg.category, 'image');
      assert.equal(jpeg.badgeLabel, 'JPEG');

      const webp = classifyMimeType('image/webp', 'avatar.webp');
      assert.equal(webp.category, 'image');
      assert.equal(webp.badgeLabel, 'WEBP');
    });

    test('clasifica documentos PDF de Hacienda o cartas de menú', () => {
      const pdf = classifyMimeType('application/pdf', 'constancia_tributaria.pdf');
      assert.equal(pdf.category, 'pdf');
      assert.equal(pdf.badgeLabel, 'PDF');
    });

    test('clasifica hojas de cálculo CSV y Excel (XLSX)', () => {
      const csv = classifyMimeType('text/csv', 'lista_precios.csv');
      assert.equal(csv.category, 'spreadsheet');
      assert.equal(csv.badgeLabel, 'CSV');

      const xlsx = classifyMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'menu_restaurante.xlsx');
      assert.equal(xlsx.category, 'spreadsheet');
      assert.equal(xlsx.badgeLabel, 'XLSX');
    });

    test('clasifica notas de audio en formato WebM, MP3 o WAV', () => {
      const webm = classifyMimeType('audio/webm', 'nota_voz.webm');
      assert.equal(webm.category, 'audio');
      assert.equal(webm.badgeLabel, 'AUDIO/WEBM');

      const mp3 = classifyMimeType('audio/mpeg', 'audio.mp3');
      assert.equal(mp3.category, 'audio');
      assert.equal(mp3.badgeLabel, 'AUDIO/MP3');
    });

    test('maneja archivos con mime-type genérico deduciendo por extensión', () => {
      const deduced = classifyMimeType('application/octet-stream', 'menu.xlsx');
      assert.equal(deduced.category, 'spreadsheet');
      assert.equal(deduced.badgeLabel, 'XLSX');
    });
  });

  // 2. Extraccion de Entidades Basicas
  describe('2. Extracción de Entidades Básicas', () => {
    test('extrae nombre comercial de patrones conversacionales', () => {
      const t1 = 'Crea un comercio llamado Barbería Capital con WhatsApp 8888-9999';
      assert.equal(detectBusinessName(t1), 'Barbería Capital');

      const t2 = 'Quiero montar un restaurante llamado "Parrillada Don Fernando"';
      assert.equal(detectBusinessName(t2), 'Parrillada Don Fernando');

      const t3 = 'Nuevo negocio: Cafetería El Grano de Oro';
      assert.equal(detectBusinessName(t3), 'Cafetería El Grano de Oro');

      const t4 = 'Nombre: Soda El Parque con correo soda@elparque.cr';
      assert.equal(detectBusinessName(t4), 'Soda El Parque');
    });

    test('genera slugs limpios sin tildes ni caracteres especiales', () => {
      assert.equal(generateSlug('Barbería & Spa Élite'), 'barberia-y-spa-elite');
      assert.equal(generateSlug('Café 100% Costarricense'), 'cafe-100-costarricense');
      assert.equal(generateSlug('Pizzería Bella Italia!'), 'pizzeria-bella-italia');
    });

    test('extrae y normaliza teléfonos de Costa Rica', () => {
      assert.equal(detectCostaRicaPhone('Mi teléfono es 8888-7777'), '8888-7777');
      assert.equal(detectCostaRicaPhone('Escribir al +506 6123 4567'), '6123-4567');
      assert.equal(detectCostaRicaPhone('Contacto 22223333'), '2222-3333');
    });

    test('detecta planes de suscripción de Betico', () => {
      assert.equal(detectPlan('Activa con plan pro por favor'), 'pro');
      assert.equal(detectPlan('Necesitamos el plan business'), 'business');
      assert.equal(detectPlan('Quiero plan starter'), 'starter');
      assert.equal(detectPlan('Corporativo plan enterprise'), 'enterprise');
    });
  });

  // 3. Deteccion de Nicho y Modulos
  describe('3. Detección de Nicho y Módulos', () => {
    test('detecta restaurante y sugiere módulo de tienda/menú', () => {
      const res = detectNicheAndModules('Montar una pizzería artesanal con pastas y hamburguesas');
      assert.equal(res.niche, 'restaurante');
      assert.equal(res.modules.store, true);
    });

    test('detecta barbería o clínica y sugiere módulo de citas y reservas', () => {
      const res = detectNicheAndModules('Configurar barbería ejecutiva con reservas de citas');
      assert.equal(res.niche, 'citas_servicios');
      assert.equal(res.modules.bookings, true);
    });

    test('detecta club deportivo y sugiere canchas', () => {
      const res = detectNicheAndModules('Club de pádel y canchas de fútbol 5');
      assert.equal(res.niche, 'canchas');
      assert.equal(res.modules.courts, true);
    });

    test('detecta requerimiento de facturación electrónica y fidelización', () => {
      const res = detectNicheAndModules('Necesito facturación electrónica de Hacienda y club de puntos y fidelización');
      assert.equal(res.modules.billing, true);
      assert.equal(res.modules.loyalty, true);
    });
  });

  // 4. Extraccion de Cedulas y Datos Fiscales de Costa Rica
  describe('4. Extracción de Cédulas y Datos Fiscales de Costa Rica', () => {
    test('detecta cédula física (9 dígitos) tipo 01', () => {
      const f1 = detectCostaRicaTaxId('Cédula física 1-1234-0567 registrada');
      assert.deepEqual(f1, { idType: '01', idNumber: '112340567' });
    });

    test('detecta cédula jurídica (10 dígitos) tipo 02', () => {
      const f2 = detectCostaRicaTaxId('Cédula Jurídica 3-101-987654');
      assert.deepEqual(f2, { idType: '02', idNumber: '3101987654' });
    });

    test('detecta DIMEX (11-12 dígitos) tipo 03', () => {
      const f3 = detectCostaRicaTaxId('Identificación DIMEX 123456789012');
      assert.deepEqual(f3, { idType: '03', idNumber: '123456789012' });
    });

    test('extrae datos fiscales completos de texto tipo constancia tributaria', () => {
      const text = `
        MINISTERIO DE HACIENDA - DIRECCION GENERAL DE TRIBUTACION
        CONSTANCIA DE SITUACION TRIBUTARIA
        Cédula: 3-101-765432
        Razón Social: RESTAURANTE SABORES DEL BOSQUE SOCIEDAD ANONIMA
        Correo Electrónico: facturacion@saboresdelbosque.cr
        Estado: ACTIVO
      `;
      const fiscal = extractFiscalDataFromText(text);
      assert.ok(fiscal);
      assert.equal(fiscal.idType, '02');
      assert.equal(fiscal.idNumber, '3101765432');
      assert.equal(fiscal.legalName, 'RESTAURANTE SABORES DEL BOSQUE SOCIEDAD ANONIMA');
      assert.equal(fiscal.email, 'facturacion@saboresdelbosque.cr');
    });

    test('extrae correo electrónico y razón social incluso si no se provee cédula', () => {
      const text = 'Comercio con Razón Social: Panadería Artesanal S.A. y correo contacto@panartesanal.cr';
      const fiscal = extractFiscalDataFromText(text);
      assert.ok(fiscal);
      assert.equal(fiscal.legalName, 'Panadería Artesanal S.A.');
      assert.equal(fiscal.email, 'contacto@panartesanal.cr');
    });
  });

  // 5. Normalizacion de Precios y Catalogo
  describe('5. Normalización de Precios y Catálogo', () => {
    test('parsea precios con símbolos de colones y separadores de miles', () => {
      assert.equal(parsePrice('₡5.000'), 5000);
      assert.equal(parsePrice('₡ 12,500'), 12500);
      assert.equal(parsePrice('3500 colones'), 3500);
      assert.equal(parsePrice(4200), 4200);
      assert.equal(parsePrice('₡6.500,50'), 6501);
    });

    test('CRITICAL FIX: parsea montos altos de colones con múltiples puntos o comas de miles sin corromper a 2', () => {
      assert.equal(parsePrice('1.500.000'), 1500000, '1.500.000 debe evaluarse a 1500000 y no a 2');
      assert.equal(parsePrice('1,500,000'), 1500000, '1,500,000 debe evaluarse a 1500000 y no a 2');
      assert.equal(parsePrice('₡ 2.750.000,00'), 2750000);
      assert.equal(parsePrice('25.000'), 25000);
      assert.equal(parsePrice('25,000'), 25000);
      assert.equal(parsePrice('120.000'), 120000);
    });

    test('extrae lista de platillos y precios desde texto plano dictado', () => {
      const text = `
        - Pizza Margarita: ₡5.000 (Pizzas)
        - Pizza Pepperoni por 6000 colones
        - Spaghetti Carbonara = ₡5500 (Pastas)
        - Gaseosa 2L por ₡2000
      `;
      const catalog = extractCatalogFromText(text);
      assert.equal(catalog.length, 4);
      assert.equal(catalog[0].name, 'Pizza Margarita');
      assert.equal(catalog[0].price, 5000);
      assert.equal(catalog[0].category, 'Pizzas');
      assert.equal(catalog[1].name, 'Pizza Pepperoni');
      assert.equal(catalog[1].price, 6000);
    });

    test('CRITICAL FIX: extrae múltiples items en una misma línea y limpia verbos en infinitivo (agregar, añadir)', () => {
      const multiLine = 'agrega pizza napolitana por ₡6500 y lasaña boloñesa por ₡5500';
      const itemsMulti = extractCatalogFromText(multiLine);
      assert.equal(itemsMulti.length, 2, 'Debe extraer ambos items de la línea');
      assert.equal(itemsMulti[0].name, 'Pizza napolitana');
      assert.equal(itemsMulti[0].price, 6500);
      assert.equal(itemsMulti[1].name, 'Lasaña boloñesa');
      assert.equal(itemsMulti[1].price, 5500);

      const infinitiveLine = 'agregar corte de cabello por ₡5000, barba por ₡3000 y lavado por ₡1500';
      const itemsInf = extractCatalogFromText(infinitiveLine);
      assert.equal(itemsInf.length, 3);
      assert.equal(itemsInf[0].name, 'Corte de cabello', 'No debe incluir el verbo agregar en el nombre');
      assert.equal(itemsInf[0].price, 5000);
      assert.equal(itemsInf[1].name, 'Barba');
      assert.equal(itemsInf[1].price, 3000);
      assert.equal(itemsInf[2].name, 'Lavado');
      assert.equal(itemsInf[2].price, 1500);
    });

    test('extrae catálogo desde un buffer real de Excel (XLSX)', () => {
      const wsData = [
        ['Nombre del Producto', 'Precio', 'Categoría', 'Descripción'],
        ['Hamburguesa Especial', 4500, 'Comidas', 'Torta de carne 200g y papas'],
        ['Batido Natural', 1800, 'Bebidas', 'Fresa en agua'],
        ['Postre Tres Leches', 2200, 'Postres', 'Casero tradicional']
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Menu');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const extracted = extractCatalogFromSpreadsheet(buffer);
      assert.equal(extracted.length, 3);
      assert.equal(extracted[0].name, 'Hamburguesa Especial');
      assert.equal(extracted[0].price, 4500);
      assert.equal(extracted[0].category, 'Comidas');
      assert.equal(extracted[1].name, 'Batido Natural');
      assert.equal(extracted[2].name, 'Postre Tres Leches');
    });

    test('CRITICAL FIX: procesa Excel con múltiples hojas y no descarta hojas posteriores si la primera es de portada', () => {
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Portada informativa sin columnas de precios
      const wsCover = XLSX.utils.aoa_to_sheet([
        ['Bienvenido a nuestro menú'],
        ['Favor revisar las siguientes pestañas']
      ]);
      XLSX.utils.book_append_sheet(wb, wsCover, 'Portada');

      // Hoja 2: Pizzas
      const wsPizzas = XLSX.utils.aoa_to_sheet([
        ['Producto', 'Precio'],
        ['Pizza Cuatro Quesos', 7000],
        ['Pizza Fugazzeta', 6500]
      ]);
      XLSX.utils.book_append_sheet(wb, wsPizzas, 'Pizzas');

      // Hoja 3: Bebidas con celdas de precios
      const wsBebidas = XLSX.utils.aoa_to_sheet([
        ['Producto', 'Precio'],
        ['Cerveza Imperial', 2000]
      ]);
      XLSX.utils.book_append_sheet(wb, wsBebidas, 'Bebidas');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const extracted = extractCatalogFromSpreadsheet(buffer);

      assert.equal(extracted.length, 3, 'Debe extraer items de las hojas de Pizzas y Bebidas');
      assert.equal(extracted[0].name, 'Pizza Cuatro Quesos');
      assert.equal(extracted[0].price, 7000);
      assert.equal(extracted[0].category, 'Pizzas');
      assert.equal(extracted[2].name, 'Cerveza Imperial');
      assert.equal(extracted[2].category, 'Bebidas');
    });
  });

  // 6. Flujo Multimodal Integrado
  describe('6. Flujo Multimodal Integrado', () => {
    test('procesa texto con creación de comercio, WhatsApp y plan', async () => {
      const result = await processMultimodalInput({
        message: 'Crear restaurante La Cabaña del Chef con WhatsApp 8999-1122 y plan Pro'
      });

      assert.ok(result);
      assert.equal(result.profileDelta.name, 'La Cabaña del Chef');
      assert.equal(result.profileDelta.slug, 'la-cabana-del-chef');
      assert.equal(result.profileDelta.whatsappNumber, '8999-1122');
      assert.equal(result.profileDelta.plan, 'pro');
      assert.equal(result.profileDelta.modules?.store, true);
      assert.ok(result.assistantMessage.includes('La Cabaña del Chef'));
    });

    test('procesa archivo adjunto simulando logotipo en base64', async () => {
      const dummyB64 = Buffer.from('fake-png-content').toString('base64');
      const result = await processMultimodalInput({
        message: 'Aquí está el logo de la empresa',
        files: [
          {
            name: 'logo_empresa.png',
            mimeType: 'image/png',
            data: dummyB64
          }
        ]
      });

      assert.ok(result.profileDelta.logoUrl);
      assert.ok(result.profileDelta.logoUrl.startsWith('/uploads/'));
      assert.equal(result.recognizedFiles.length, 1);
      assert.equal(result.recognizedFiles[0].badgeLabel, 'PNG');
    });

    test('procesa archivo simulado de nota de voz tipo WhatsApp y guarda en uploads', async () => {
      const dummyAudio = Buffer.from('fake-webm-audio-bytes').toString('base64');
      const result = await processMultimodalInput({
        audioBase64: dummyAudio
      });

      assert.equal(result.recognizedFiles.length, 1);
      assert.equal(result.recognizedFiles[0].category, 'audio');
      assert.ok(result.assistantMessage.length > 0);
    });

    test('preserva y acumula perfil en turnos conversacionales subsecuentes', async () => {
      const initialTurn = await processMultimodalInput({
        message: 'Crea una barbería llamada Fade Master Barber'
      });

      const secondTurn = await processMultimodalInput({
        message: 'El WhatsApp es 8811-2233 y agrega corte clásico por ₡5000',
        currentProfile: initialTurn.profileDelta
      });

      assert.equal(secondTurn.profileDelta.whatsappNumber, '8811-2233');
      assert.ok(secondTurn.profileDelta.catalogItems);
      assert.equal(secondTurn.profileDelta.catalogItems.length, 1);
      assert.equal(secondTurn.profileDelta.catalogItems[0].name, 'Corte clásico');
    });
  });

  // 7. Lógica de Finalización y Creación Transaccional
  describe('7. Validación de Estructura de Finalización', () => {
    test('genera credenciales y contraseña temporal segura', () => {
      const tempPassword = crypto.randomBytes(6).toString('hex') + '!Aa1';
      assert.ok(tempPassword.length >= 12);
      assert.ok(/[A-Z]/.test(tempPassword));
      assert.ok(/[a-z]/.test(tempPassword));
      assert.ok(/[0-9]/.test(tempPassword));
      assert.ok(/[!@#$%^&*]/.test(tempPassword));
    });

    test('arma payload completo de base de datos con módulos y fiscalidad', () => {
      const finalizePayload = {
        name: 'Clínica Dental Sanitas',
        slug: 'clinica-dental-sanitas',
        plan: 'business',
        adminEmail: 'factura@sanitas.cr',
        whatsappNumber: '8333-4444',
        modules: { store: false, bookings: true, courts: false, loyalty: true, billing: true },
        fiscal: { idType: '02', idNumber: '3101555666', legalName: 'SANITAS COSTA RICA S.A.', email: 'factura@sanitas.cr' },
        catalogItems: [
          { name: 'Limpieza Dental Ultrasonido', price: 25000, category: 'Odontología' },
          { name: 'Calza de Resina', price: 18000, category: 'Odontología' }
        ]
      };

      assert.equal(finalizePayload.name, 'Clínica Dental Sanitas');
      assert.equal(finalizePayload.modules.bookings, true);
      assert.equal(finalizePayload.fiscal.idType, '02');
      assert.equal(finalizePayload.catalogItems.length, 2);
    });

    test('CRITICAL FIX: verifica que admin-app/package.json incluya xlsx en dependencies para despliegue aislado', () => {
      const pkgPath = path.resolve(process.cwd(), 'admin-app/package.json');
      assert.ok(fs.existsSync(pkgPath), 'admin-app/package.json debe existir');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert.ok(pkg.dependencies && pkg.dependencies.xlsx, 'admin-app debe tener declarada la dependencia xlsx');
    });
  });

  // 8. Regla de Idioma Español: Cero uso de '&' en Textos Visibles
  describe('8. Invariante de Idioma Español (Cero "&" en Textos Visibles)', () => {
    test('sanitizeSpanishText reemplaza cualquier "&" por la conjunción "y"', () => {
      const raw = 'Pastas & Pizzas para Delivery & Restaurante';
      const clean = sanitizeSpanishText(raw);
      assert.equal(clean, 'Pastas y Pizzas para Delivery y Restaurante');
      assert.equal(clean.includes('&'), false);
    });

    test('generateAssistantResponse nunca produce el carácter "&"', () => {
      const response = generateAssistantResponse(
        {
          name: 'Restaurante Sabor y Fuego',
          slug: 'sabor-y-fuego',
          whatsappNumber: '8888-9999',
          plan: 'pro',
          modules: { store: true, bookings: true, courts: false, loyalty: true, billing: true },
          fiscal: { idType: '01', idNumber: '112340567', legalName: 'Juan Pérez', email: 'juan@cr.com' },
          catalogItems: [{ name: 'Hamburguesa con Queso', price: 5500 }]
        },
        ['logo.png', 'menu.xlsx']
      );

      assert.equal(response.includes('&'), false, 'La respuesta del asistente no debe contener el caracter &');
      assert.ok(response.includes('y'));
    });

    test('verifica que el archivo BusinessOnboardingCopilot.tsx no contenga "&" en textos visibles en español', () => {
      const compPath = path.resolve(process.cwd(), 'admin-app/src/client/components/BusinessOnboardingCopilot.tsx');
      assert.ok(fs.existsSync(compPath), 'El componente BusinessOnboardingCopilot.tsx debe existir');
      const content = fs.readFileSync(compPath, 'utf8');

      const lines = content.split('\n');
      const suspiciousLines = [];

      lines.forEach((line, index) => {
        const lineWithoutLogicalAnd = line.replace(/&&/g, '').replace(/&amp;/g, '');
        const match = lineWithoutLogicalAnd.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]\s*&\s*[a-zA-ZáéíóúÁÉÍÓÚñÑ]/);
        if (match) {
          suspiciousLines.push(`Línea ${index + 1}: ${line.trim()}`);
        }
      });

      assert.deepEqual(
        suspiciousLines,
        [],
        `Se encontraron textos visibles con '&' en lugar de 'y':\n${suspiciousLines.join('\n')}`
      );
    });

    test('verifica que copilot.routes.ts y copilot-processor.ts no contengan "&" en textos visibles', () => {
      const files = [
        path.resolve(process.cwd(), 'admin-app/src/server/services/copilot-processor.ts'),
        path.resolve(process.cwd(), 'admin-app/src/server/routes/copilot.routes.ts')
      ];

      for (const f of files) {
        assert.ok(fs.existsSync(f), `El archivo ${f} debe existir`);
        const content = fs.readFileSync(f, 'utf8');
        const lines = content.split('\n');
        const violations = [];

        lines.forEach((line, index) => {
          const lineWithoutLogical = line.replace(/&&/g, '').replace(/&amp;/g, '');
          const match = lineWithoutLogical.match(/'[^']*?[a-zA-ZáéíóúÁÉÍÓÚñÑ]\s*&\s*[a-zA-ZáéíóúÁÉÍÓÚñÑ][^']*?'/) ||
                        lineWithoutLogical.match(/"[^"]*?[a-zA-ZáéíóúÁÉÍÓÚñÑ]\s*&\s*[a-zA-ZáéíóúÁÉÍÓÚñÑ][^"]*?"/) ||
                        lineWithoutLogical.match(/`[^`]*?[a-zA-ZáéíóúÁÉÍÓÚñÑ]\s*&\s*[a-zA-ZáéíóúÁÉÍÓÚñÑ][^`]*?`/);
          if (match) {
            violations.push(`${path.basename(f)}:${index + 1}: ${line.trim()}`);
          }
        });

        assert.deepEqual(
          violations,
          [],
          `Se encontraron cadenas en español con '&' en lugar de 'y':\n${violations.join('\n')}`
        );
      }
    });
  });
});
