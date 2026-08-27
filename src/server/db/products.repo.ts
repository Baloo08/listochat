import { query } from './pool.js';
import { Product, ProductImage, ProductVariant } from '../../shared/types.js';

export async function getProductsByTenant(tenantId: string): Promise<Product[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, slug, description, price, compare_at_price as "compareAtPrice",
           currency, category, tags, stock, track_stock as "trackStock", sku, featured, active,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM products 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);
  
  // A full implementation would batch-fetch images and variants here and attach them.
  // For simplicity, we return empty arrays, but you should map them properly in production.
  return result.rows.map(row => ({ ...row, images: [], variants: [] }));
}

export async function getProductById(id: string, tenantId: string): Promise<Product | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, slug, description, price, compare_at_price as "compareAtPrice",
           currency, category, tags, stock, track_stock as "trackStock", sku, featured, active,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM products 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  
  if (result.rows.length === 0) return null;
  const product = result.rows[0];

  const imgRes = await query(`
    SELECT id, url, alt_text as "altText", sort_order as "sortOrder", is_primary as "isPrimary"
    FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC
  `, [id]);
  
  const varRes = await query(`
    SELECT id, name, sku, price_override as "priceOverride", stock, attributes, active
    FROM product_variants WHERE product_id = $1
  `, [id]);

  product.images = imgRes.rows;
  product.variants = varRes.rows;
  return product;
}

export async function createProduct(tenantId: string, data: Partial<Product>): Promise<Product> {
  const result = await query(`
    INSERT INTO products (
      tenant_id, name, slug, description, price, compare_at_price, currency, 
      category, tags, stock, track_stock, sku, featured, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id, tenant_id as "tenantId", name, slug, description, price, compare_at_price as "compareAtPrice",
           currency, category, tags, stock, track_stock as "trackStock", sku, featured, active,
           created_at as "createdAt", updated_at as "updatedAt"
  `, [
    tenantId, data.name, data.slug, data.description, data.price, data.compareAtPrice, data.currency || 'CRC',
    data.category, data.tags, data.stock || 0, data.trackStock !== false, data.sku, data.featured || false, data.active !== false
  ]);
  
  const product = result.rows[0];
  product.images = [];
  product.variants = [];
  return product;
}

export async function updateProduct(id: string, tenantId: string, data: Partial<Product>): Promise<Product | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  const fields = ['name', 'slug', 'description', 'price', 'compareAtPrice', 'currency', 'category', 'tags', 'stock', 'trackStock', 'sku', 'featured', 'active'];
  for (const field of fields) {
    if ((data as any)[field] !== undefined) {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updates.push(`${dbField} = $${paramIdx++}`);
      params.push((data as any)[field]);
    }
  }

  if (updates.length > 0) {
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    await query(`UPDATE products SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2`, params);
  }
  return getProductById(id, tenantId);
}

export async function deleteProduct(id: string, tenantId: string): Promise<boolean> {
  const result = await query('DELETE FROM products WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (result.rowCount || 0) > 0;
}
