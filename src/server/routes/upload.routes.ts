import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authenticateToken);

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
      const base64Data = fileBuffer.toString('base64');
      await query(`
        INSERT INTO uploaded_files (filename, mime_type, data_base64, size)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (filename) DO UPDATE 
        SET mime_type = $2, data_base64 = $3, size = $4, created_at = CURRENT_TIMESTAMP
      `, [filename, mimetype, base64Data, size]);
    }
  } catch (err) {
    console.error('Error persisting upload to database:', err);
  }
}

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió archivo' });
    return;
  }

  // Persist to PostgreSQL database for zero-loss deployments
  await persistFileToDatabase(
    req.file.filename,
    req.file.mimetype || 'image/jpeg',
    req.file.path,
    req.file.size
  );

  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
});

router.post('/multiple', upload.array('files', 10), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No se recibieron archivos' });
    return;
  }

  // Persist each file to PostgreSQL
  for (const f of files) {
    await persistFileToDatabase(
      f.filename,
      f.mimetype || 'image/jpeg',
      f.path,
      f.size
    );
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
