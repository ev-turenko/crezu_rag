import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import {
  deleteFile,
  downloadFile,
  fileHelpers,
  filePasswordGuard,
  FILES_SETTINGS,
  listFiles,
  uploadFile,
} from '../controllers/filesController.js';

const router = Router();

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await fileHelpers.ensureUploadsDir();
      callback(null, FILES_SETTINGS.uploadsDir);
    } catch (error) {
      callback(error as Error, FILES_SETTINGS.uploadsDir);
    }
  },
  filename: (_req, file, callback) => {
    const safeOriginalName = path.basename(file.originalname);
    callback(null, `${Date.now()}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: FILES_SETTINGS.maxFileSizeBytes,
  },
});

router.get('/list', filePasswordGuard, listFiles);
router.get('/download/:fileName', filePasswordGuard, downloadFile);
router.delete('/:fileName', filePasswordGuard, deleteFile);

router.post(
  '/upload',
  filePasswordGuard,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, error => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: `File too large. Maximum size is ${Math.floor(FILES_SETTINGS.maxFileSizeBytes / (1024 * 1024))} MB`,
        });
      }

      return res.status(400).json({
        success: false,
        message: (error as Error).message || 'Upload failed',
      });
    });
  },
  uploadFile
);

export default router;
