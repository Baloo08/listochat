import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getProductsByTenant, getProductById, createProduct, updateProduct, deleteProduct } from '../db/products.repo.js';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', async (req, res) => {
  try {
    const { category, search, active } = req.query as any;
    let sql = `
      SELECT p.id, p.tenant_id as "tenantId", p.name, p.slug, p.description, p.price, 
             p.compare_at_price as "compareAtPrice", p.currency, p.category, p.tags, 
             p.stock, p.track_stock as "trackStock", p.sku, p.featured, p.active,
             p.created_at as "createdAt", p.updated_at as "updatedAt",
             COALESCE(
               (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary))
                FROM product_images pi WHERE pi.product_id = p.id), '[]'::json
             ) as images,
             COALESCE(
               (SELECT json_agg(json_build_object('id', pv.id, 'name', pv.name, 'priceOverride', pv.price_override, 'stock', pv.stock))
                FROM product_variants pv WHERE pv.product_id = p.id), '[]'::json
             ) as variants
      FROM products p
      WHERE p.tenant_id = $1
    `;
    const params: any[] = [req.tenantId!];
    let paramIdx = 2;

    if (category) {
      sql += ` AND p.category ILIKE $${paramIdx++}`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (active !== undefined && active !== '') {
      sql += ` AND p.active = $${paramIdx++}`;
      params.push(active === 'true' || active === true);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/template', (req, res) => {
  try {
    const templateData = [
      {
        Nombre: 'Hamburguesa Especial Betico',
        Descripcion: 'Deliciosa carne artesanal 100% res con queso cheddar, tocineta crocante y salsa de la casa.',
        Precio: 4500,
        PrecioComparacion: 5500,
        Categoria: 'Comidas',
        SKU: 'HAMB-001',
        Stock: 50,
        Activo: 'SI'
      },
      {
        Nombre: 'Refresco Natural Cas 500ml',
        Descripcion: 'Bebida natural refrescante preparada con fruta fresca de temporada.',
        Precio: 1500,
        PrecioComparacion: '',
        Categoria: 'Bebidas',
        SKU: 'BEB-002',
        Stock: 100,
        Activo: 'SI'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_productos_betico.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla:', error);
    res.status(500).json({ error: 'Error al generar plantilla Excel' });
  }
});

router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Archivo Excel requerido' });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      res.status(400).json({ error: 'La plantilla no contiene filas de productos' });
      return;
    }

    let createdCount = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['Nombre'] || row['nombre'] || row['Name'];
      const price = parseFloat(row['Precio'] || row['precio'] || row['Price'] || 0);

      if (!name || isNaN(price) || price < 0) {
        errors.push({ row: i + 2, error: `Fila ${i + 2}: Nombre y Precio válido requeridos` });
        continue;
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
      const compareAtPrice = row['PrecioComparacion'] || row['precioComparacion'] ? parseFloat(row['PrecioComparacion'] || row['precioComparacion']) : null;
      const category = row['Categoria'] || row['categoria'] || 'General';
      const description = row['Descripcion'] || row['descripcion'] || '';
      const sku = row['SKU'] || row['sku'] || null;
      const stock = parseInt(row['Stock'] || row['stock'] || '0', 10) || 0;
      const activeStr = String(row['Activo'] || row['activo'] || 'SI').toUpperCase();
      const active = activeStr === 'SI' || activeStr === 'TRUE' || activeStr === '1' || activeStr === 'S';

      try {
        await createProduct(req.tenantId!, {
          name,
          slug,
          description,
          price,
          compareAtPrice: compareAtPrice || undefined,
          category,
          sku: sku || undefined,
          stock,
          active,
          currency: 'CRC'
        });
        createdCount++;
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message || 'Error al guardar en base de datos' });
      }
    }

    res.json({
      success: true,
      createdCount,
      totalRows: rows.length,
      errors
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Error procesando archivo Excel' });
  }
});

router.post('/generate-description', async (req, res) => {
  try {
    const { name, category, keywords } = req.body;
    if (!name) {
      res.status(400).json({ error: 'El nombre del producto es requerido' });
      return;
    }

    const apiKey = env.GEMINI_API_KEY;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];
    let aiText = '';

    for (const modelName of modelsToTry) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        const model = google(modelName);
        const prompt = `Eres un redactor profesional de e-commerce y marketing digital en Costa Rica y Latinoamérica.
Genera una descripción atractiva, persuasiva y profesional para el siguiente producto:

- Nombre del producto: ${name}
- Categoría: ${category || 'General'}
${keywords ? `- Palabras clave o características: ${keywords}` : ''}

Requisitos:
1. Longitud: 2 a 3 oraciones concisas y llamativas.
2. Tono: Cercano, comercial y de alta conversión.
3. Incluye 2 o 3 viñetas breves con los puntos clave destacados (ej: • Calidad garantizada).
4. Devuelve únicamente el texto de la descripción listo para publicar.`;

        const { text } = await generateText({
          model,
          prompt,
          temperature: 0.7,
        });

        if (text && text.trim().length > 10) {
          aiText = text.trim();
          break;
        }
      } catch (err) {
        // try next model
      }
    }

    if (aiText) {
      res.json({ description: aiText });
      return;
    }

    // Rich local fallback generator if external AI API is quota-limited or offline
    const categoryLower = (category || '').toLowerCase();
    let richDesc = '';

    if (categoryLower.includes('comida') || categoryLower.includes('hamburguesa') || categoryLower.includes('pizza') || categoryLower.includes('restaurante')) {
      richDesc = `¡Delicioso ${name} preparado al momento con los ingredientes más frescos y selectos! La combinación perfecta de sabor y calidad para consentir tu paladar.\n\n• Preparación 100% artesanal con ingredientes frescos de primera calidad.\n• Sabor inigualable y porción ideal para disfrutar.\n• Empaque térmico especial para que llegue caliente y fresco a tu mesa.`;
    } else if (categoryLower.includes('bebida') || categoryLower.includes('cafe') || categoryLower.includes('refresco')) {
      richDesc = `Disfruta de ${name}, la opción perfecta y refrescante para acompañar tus momentos especiales.\n\n• Sabor auténtico y refrescante en cada sorbo.\n• Ingredientes seleccionados con los más altos estándares.\n• Ideal para compartir en cualquier momento del día.`;
    } else if (categoryLower.includes('ropa') || categoryLower.includes('moda') || categoryLower.includes('calzado')) {
      richDesc = `Descubre ${name}, diseñado con materiales de primera calidad que garantizan máxima comodidad, durabilidad y un estilo moderno que destaca.\n\n• Material premium resistente, fresco y de tacto suave.\n• Ajuste ergonómico y acabados de alta costura.\n• Disponible para entrega inmediata con garantía de satisfacción.`;
    } else {
      richDesc = `Presentamos ${name}, una excelente elección pensada para brindarte el mejor rendimiento, comodidad y satisfacción total.\n\n• Calidad garantizada con acabados y materiales de primer nivel.\n• ${keywords ? `Diseñado especialmente para destacar: ${keywords}.` : 'Versátil, práctico y perfecto para el uso diario.'}\n• Disponible para envío express inmediato directo a tu puerta.`;
    }

    res.json({ description: richDesc });
  } catch (error: any) {
    console.error('Error generando descripción:', error);
    const fallbackDesc = `${req.body.name} de excelente calidad y rendimiento garantizado. Disponible para entrega inmediata.`;
    res.json({ description: fallbackDesc });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id, req.tenantId!);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, price, images, ...rest } = req.body;
    if (!name || price === undefined) {
      res.status(400).json({ error: 'Nombre y precio son requeridos' });
      return;
    }

    const slug = req.body.slug || (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4));
    const product = await createProduct(req.tenantId!, {
      ...rest,
      name,
      slug,
      price: parseFloat(price)
    });

    // Save images if provided
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imgUrl = typeof images[i] === 'string' ? images[i] : images[i].url;
        if (imgUrl) {
          await query(
            `INSERT INTO product_images (product_id, tenant_id, url, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)`,
            [product.id, req.tenantId!, imgUrl, i, i === 0]
          );
        }
      }
    }

    const fullProduct = await getProductById(product.id, req.tenantId!);
    res.status(201).json(fullProduct || product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { images, ...data } = req.body;
    const updated = await updateProduct(req.params.id, req.tenantId!, data);

    if (Array.isArray(images)) {
      await query(`DELETE FROM product_images WHERE product_id = $1 AND tenant_id = $2`, [req.params.id, req.tenantId!]);
      for (let i = 0; i < images.length; i++) {
        const imgUrl = typeof images[i] === 'string' ? images[i] : images[i].url;
        if (imgUrl) {
          await query(
            `INSERT INTO product_images (product_id, tenant_id, url, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)`,
            [req.params.id, req.tenantId!, imgUrl, i, i === 0]
          );
        }
      }
    }

    const full = await getProductById(req.params.id, req.tenantId!);
    res.json(full || updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteProduct(req.params.id, req.tenantId!);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
