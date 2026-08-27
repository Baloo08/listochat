import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { tenantId } = req;
    // Create product logic
    res.status(201).json({ message: 'Producto creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
