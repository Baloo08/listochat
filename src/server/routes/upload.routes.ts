import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';

const router = Router();

const uploadDir = env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

async function persistFileToDatabase(filename: string, mimetype: string, filePath: string, size: number) {
  try {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      await query(`
        INSERT INTO uploaded_assets (filename, mimetype, data, size_bytes)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (filename) DO UPDATE SET data = EXCLUDED.data, size_bytes = EXCLUDED.size_bytes
      `, [filename, mimetype, fileBuffer, size]);
    }
  } catch (err) {
    console.error('[Upload DB Sync] Failed to persist file to PostgreSQL:', err);
  }
}

// 1. Public upload endpoint for customer payment proof screenshots (NO JWT REQUIRED)
router.post('/public-proof', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió archivo de comprobante' });
    return;
  }

  await persistFileToDatabase(
    req.file.filename,
    req.file.mimetype || 'image/jpeg',
    req.file.path,
    req.file.size
  );

  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, size: req.file.size });
});

// 2. All subsequent upload endpoints require JWT authentication
router.use(authenticateToken);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se subió ningún archivo' });
      return;
    }

    await persistFileToDatabase(
      req.file.filename,
      req.file.mimetype,
      req.file.path,
      req.file.size
    );

    const url = `/uploads/${req.file.filename}`;
    res.json({
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
});

router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No se subieron archivos' });
      return;
    }

    for (const f of files) {
      await persistFileToDatabase(
        f.filename,
        f.mimetype,
        f.path,
        f.size
      );
    }

    const urls = files.map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      size: f.size
    }));

    res.json(urls);
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Error al subir los archivos' });
  }
});

export default router;
