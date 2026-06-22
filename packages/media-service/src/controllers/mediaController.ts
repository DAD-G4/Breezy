import { Response } from 'express';
import { success, error, AuthRequest } from '@breezy/shared';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export async function uploadMedia(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  if (!req.file) {
    error(res, 'No file provided', 400);
    return;
  }

  const { mimetype, size, filename } = req.file;

  let type: 'image' | 'video';
  if (IMAGE_TYPES.includes(mimetype)) {
    type = 'image';
    if (size > MAX_IMAGE_SIZE) {
      error(res, 'Image exceeds 10MB limit', 400);
      return;
    }
  } else if (VIDEO_TYPES.includes(mimetype)) {
    type = 'video';
    if (size > MAX_VIDEO_SIZE) {
      error(res, 'Video exceeds 50MB limit', 400);
      return;
    }
  } else {
    error(res, 'Unsupported file type', 400);
    return;
  }

  success(
    res,
    {
      url: `/uploads/${filename}`,
      type,
      filename,
      size,
    },
    'File uploaded successfully',
    201
  );
}
