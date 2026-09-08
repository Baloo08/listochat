import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getRecordsByTenant,
  getRecordById,
  getRecordByPhone,
  createRecord,
  updateRecord,
  deleteRecord,
  addRecordEntry,
  getRecordEntries,
  deleteRecordEntry,
  getAppointmentsForRecord
} from '../db/records.repo.js';

const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

// 1. List records with search & filters
router.get('/', async (req: any, res) => {
  try {
    const { search, type, limit, offset } = req.query;
    const result = await getRecordsByTenant(req.tenantId, {
      search: search ? String(search) : undefined,
      type: type ? String(type) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 50,
      offset: offset ? parseInt(String(offset), 10) : 0
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching customer records:', error);
    res.status(500).json({ error: 'Error al obtener expedientes' });
  }
});

// 2. Get record by phone (for auto-linking in appointments / chats)
router.get('/by-phone/:phone', async (req: any, res) => {
  try {
    const record = await getRecordByPhone(req.params.phone, req.tenantId);
    if (!record) {
      res.status(404).json({ error: 'Expediente no encontrado para este teléfono' });
      return;
    }
    res.json(record);
  } catch (error) {
    console.error('Error fetching record by phone:', error);
    res.status(500).json({ error: 'Error al buscar expediente' });
  }
});

// 3. Get record 360° details (Record + Appointments + Clinical Entries)
router.get('/:id', async (req: any, res) => {
  try {
    const record = await getRecordById(req.params.id, req.tenantId);
    if (!record) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    const [appointments, entries] = await Promise.all([
      getAppointmentsForRecord(req.params.id, req.tenantId),
      getRecordEntries(req.params.id, req.tenantId)
    ]);

    res.json({
      record,
      appointments,
      entries
    });
  } catch (error) {
    console.error('Error fetching record details:', error);
    res.status(500).json({ error: 'Error al obtener detalles del expediente' });
  }
});

// 4. Create new record (Cliente general o Paciente)
router.post('/', async (req: any, res) => {
  try {
    const { fullName, phone } = req.body;
    if (!fullName || !fullName.trim()) {
      res.status(400).json({ error: 'El nombre completo es requerido' });
      return;
    }

    const record = await createRecord(req.tenantId, req.body);
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating customer record:', error);
    res.status(500).json({ error: 'Error al crear expediente' });
  }
});

// 5. Update record
router.put('/:id', async (req: any, res) => {
  try {
    const updated = await updateRecord(req.params.id, req.tenantId, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating customer record:', error);
    res.status(500).json({ error: 'Error al actualizar expediente' });
  }
});

// 6. Delete record
router.delete('/:id', async (req: any, res) => {
  try {
    const success = await deleteRecord(req.params.id, req.tenantId);
    if (!success) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }
    res.json({ success: true, message: 'Expediente eliminado con éxito' });
  } catch (error) {
    console.error('Error deleting customer record:', error);
    res.status(500).json({ error: 'Error al eliminar expediente' });
  }
});

// 7. Get clinical / consultation entries for record
router.get('/:id/entries', async (req: any, res) => {
  try {
    const entries = await getRecordEntries(req.params.id, req.tenantId);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching record entries:', error);
    res.status(500).json({ error: 'Error al obtener historial clínico' });
  }
});

// 8. Add clinical / consultation entry
router.post('/:id/entries', async (req: any, res) => {
  try {
    const record = await getRecordById(req.params.id, req.tenantId);
    if (!record) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    const entry = await addRecordEntry(req.tenantId, req.params.id, {
      ...req.body,
      specialistId: req.body.specialistId || undefined
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error adding record entry:', error);
    res.status(500).json({ error: 'Error al registrar nota en el expediente' });
  }
});

// 9. Delete entry
router.delete('/:id/entries/:entryId', async (req: any, res) => {
  try {
    const success = await deleteRecordEntry(req.params.entryId, req.tenantId);
    if (!success) {
      res.status(404).json({ error: 'Nota no encontrada' });
      return;
    }
    res.json({ success: true, message: 'Nota eliminada' });
  } catch (error) {
    console.error('Error deleting record entry:', error);
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
});

export default router;
