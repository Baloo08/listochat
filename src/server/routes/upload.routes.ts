import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();
router.use(authenticateToken);

const uploadDir = env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif, svg)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió archivo' });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
});

router.post('/multiple', upload.array('files', 10), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No se recibieron archivos' });
    return;
  }
  const urls = files.map(f => ({
    url: `/uploads/${f.filename}`,
    filename: f.filename,
    originalName: f.originalname,
    size: f.size
  }));
  res.json(urls);
});

export default router;
