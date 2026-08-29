import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getBranchesByTenant,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
} from '../db/branches.repo.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const branches = await getBranchesByTenant(tenantId);
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const branch = await getBranchById(req.params.id, tenantId);
    if (!branch) {
      res.status(404).json({ error: 'Sucursal no encontrada' });
      return;
    }
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sucursal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, code, address, phone, sinpePhone, sinpeName, latitude, longitude, isMain, active } = req.body;
    if (!name) {
      res.status(400).json({ error: 'El nombre de la sucursal es obligatorio' });
      return;
    }

    const branch = await createBranch(tenantId, {
      name,
      code,
      address,
      phone,
      sinpePhone,
      sinpeName,
      latitude,
      longitude,
      isMain,
      active
    });
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const branch = await updateBranch(req.params.id, tenantId, req.body);
    if (!branch) {
      res.status(404).json({ error: 'Sucursal no encontrada' });
      return;
    }
    res.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const success = await deleteBranch(req.params.id, tenantId);
    if (!success) {
      res.status(404).json({ error: 'Sucursal no encontrada' });
      return;
    }
    res.json({ success: true, message: 'Sucursal eliminada' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Error al eliminar sucursal' });
  }
});

export default router;
