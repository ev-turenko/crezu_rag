import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const UPLOAD_PASSWORD = 'crezu_files_2026';
const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024;
const uploadsDir = path.resolve(process.cwd(), 'uploads');

export const FILES_SETTINGS = {
  uploadPassword: UPLOAD_PASSWORD,
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  uploadsDir,
};

const getPasswordFromRequest = (req: Request): string | undefined => {
  const headerPassword = req.headers['x-file-password'];
  const queryPassword = req.query.password;

  if (typeof headerPassword === 'string') {
    return headerPassword;
  }

  if (Array.isArray(headerPassword) && headerPassword.length > 0) {
    return headerPassword[0];
  }

  if (typeof queryPassword === 'string') {
    return queryPassword;
  }

  if (typeof req.body?.password === 'string') {
    return req.body.password;
  }

  return undefined;
};

const isValidFileName = (name: string): boolean => {
  if (!name || name.includes('/') || name.includes('\\')) {
    return false;
  }

  const normalized = path.basename(name);
  return normalized === name;
};

const ensureUploadsDir = async (): Promise<void> => {
  await fs.promises.mkdir(uploadsDir, { recursive: true });
};

export const filePasswordGuard = (req: Request, res: Response, next: () => void) => {
  const password = getPasswordFromRequest(req);

  if (password !== UPLOAD_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: wrong password',
    });
  }

  next();
};

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileName: req.file.filename,
      size: req.file.size,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: (error as Error).message,
    });
  }
};

export const listFiles = async (_req: Request, res: Response) => {
  try {
    await ensureUploadsDir();

    const dirEntries = await fs.promises.readdir(uploadsDir, { withFileTypes: true });
    const files = await Promise.all(
      dirEntries
        .filter(entry => entry.isFile())
        .map(async entry => {
          const fullPath = path.join(uploadsDir, entry.name);
          const stats = await fs.promises.stat(fullPath);
          return {
            name: entry.name,
            size: stats.size,
            updatedAt: stats.mtime.toISOString(),
          };
        })
    );

    return res.status(200).json({
      success: true,
      files,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to list files',
      error: (error as Error).message,
    });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  try {
    await ensureUploadsDir();

    const fileName = req.params.fileName;
    if (!isValidFileName(fileName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file name',
      });
    }

    const filePath = path.join(uploadsDir, fileName);

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    return res.download(filePath, fileName);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: (error as Error).message,
    });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    await ensureUploadsDir();

    const fileName = req.params.fileName;
    if (!isValidFileName(fileName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file name',
      });
    }

    const filePath = path.join(uploadsDir, fileName);

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'File not found',
        });
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: (error as Error).message,
    });
  }
};

export const fileHelpers = {
  ensureUploadsDir,
  isValidFileName,
};
