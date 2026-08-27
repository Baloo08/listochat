import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getUsersByTenant, createUser, updateUser, deleteUser } from '../db/users.repo.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const users = await getUsersByTenant(req.tenantId!);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      return;
    }
    const user = await createUser({
      tenantId: req.tenantId!,
      name,
      email,
      password,
      role: role || 'staff'
    });
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/:id', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.tenantId!, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/:id', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    if (req.params.id === req.user!.userId) {
      res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
      return;
    }
    const deleted = await deleteUser(req.params.id, req.tenantId!);
    if (!deleted) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
