import { query } from './pool.js';
import { Service } from '../../shared/types.js';

export async function getServicesByTenant(tenantId: string): Promise<Service[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, notes, active, created_at as "createdAt"
    FROM services 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);
  return result.rows;
}

export async function getServiceById(id: string, tenantId: string): Promise<Service | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, notes, active, created_at as "createdAt"
    FROM services 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}

export async function createService(tenantId: string, data: Partial<Service>): Promise<Service> {
  const result = await query(`
    INSERT INTO services (
      tenant_id, name, description, price, price_display, duration, estimated_minutes, category, notes, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, notes, active, created_at as "createdAt"
  `, [
    tenantId, data.name, data.description, data.price, data.priceDisplay, data.duration, 
    data.estimatedMinutes, data.category, data.notes, data.active !== false
  ]);
  return result.rows[0];
}

export async function updateService(id: string, tenantId: string, data: Partial<Service>): Promise<Service | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  const fields = ['name', 'description', 'price', 'priceDisplay', 'duration', 'estimatedMinutes', 'category', 'notes', 'active'];
  for (const field of fields) {
    if ((data as any)[field] !== undefined) {
      const dbField = field.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);
      updates.push(\`\${dbField} = $\${paramIdx++}\`);
      params.push((data as any)[field]);
    }
  }

  if (updates.length === 0) return getServiceById(id, tenantId);

  const result = await query(`
    UPDATE services SET ${updates.join(', ')}
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, notes, active, created_at as "createdAt"
  `, params);

  return result.rows[0] || null;
}

export async function deleteService(id: string, tenantId: string): Promise<boolean> {
  const result = await query('DELETE FROM services WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (result.rowCount || 0) > 0;
}
