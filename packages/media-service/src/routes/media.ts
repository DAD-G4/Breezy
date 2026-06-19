import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { authenticateToken, checkBan, Ban } from '@breezy/shared';
import { uploadMedia } from '../controllers/mediaController';

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const banChecker = async (userId: number) => {
  const ban = await Ban.findOne({ where: { user_id: userId } });
  if (!ban) return null;
  return { user_id: ban.user_id, expires_at: ban.expires_at };
};

const router = Router();
router.use(authenticateToken);
router.use(checkBan(banChecker));
router.post('/upload', upload.single('file'), uploadMedia);

export default router;
