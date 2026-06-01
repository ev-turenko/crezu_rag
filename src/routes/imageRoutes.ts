import { Router } from 'express';
import multer from 'multer';
import { analyzeImage } from '../controllers/imageController.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post('/analyze', upload.single('image'), analyzeImage);

export default router;
