import { Request, Response, NextFunction } from 'express';

const mockSuccess = jest.fn(
  (res: Response, data: unknown, message?: string, statusCode?: number) => {
    const code = statusCode || 200;
    const body: Record<string, unknown> = { data };
    if (message) body.message = message;
    return res.status(code).json(body);
  }
);

const mockError = jest.fn(
  (res: Response, errorMessage: string, statusCode?: number) => {
    return res
      .status(statusCode || 500)
      .json({ error: errorMessage, statusCode: statusCode || 500 });
  }
);

const mockFileRef: { current: Record<string, unknown> | null } = { current: null };

jest.mock('@breezy/shared', () => {
  const actual = jest.requireActual('@breezy/shared');
  return {
    ...actual,
    authenticateToken: jest.fn(
      (req: Request & { user?: Record<string, unknown> }, res: Response, next: NextFunction) => {
        if (req.headers.authorization) {
          req.user = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
          };
          next();
        } else {
          res.status(401).json({ error: 'Access denied. No token provided.' });
        }
      }
    ),
    checkBan: jest.fn((_banChecker: any) => (req: any, _res: any, next: any) => next()),
    Ban: { findOne: jest.fn().mockResolvedValue(null) },
    success: mockSuccess,
    error: mockError,
  };
});

jest.mock('multer', () => {
  const instance = {
    single: jest.fn(() => {
      return (
        req: Request & { file?: Record<string, unknown> },
        _res: Response,
        next: NextFunction
      ) => {
        if (mockFileRef.current) {
          (req as any).file = mockFileRef.current;
          mockFileRef.current = null;
        }
        next();
      };
    }),
    diskStorage: jest.fn(() => ({})),
  };
  return Object.assign(jest.fn(() => instance), instance);
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

import express from 'express';
import request from 'supertest';
import mediaRouter from '../src/routes/media';

describe('MediaService Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/media', mediaRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/media/upload', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).post('/api/media/upload');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Access denied. No token provided.');
    });

    it('should return 400 if no file is provided', async () => {
      mockFileRef.current = null;
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
    });

    it('should return 201 for a successful image upload', async () => {
      mockFileRef.current = {
        fieldname: 'file',
        originalname: 'photo.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        destination: './uploads',
        filename: 'test-uuid-1234.jpg',
      };

      await request(app)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });

      expect(mockSuccess).toHaveBeenCalledWith(
        expect.anything(),
        {
          url: '/uploads/test-uuid-1234.jpg',
          type: 'image',
          filename: 'test-uuid-1234.jpg',
          size: 1024 * 100,
        },
        'File uploaded successfully',
        201
      );
    });

    it('should return 201 for a successful video upload', async () => {
      mockFileRef.current = {
        fieldname: 'file',
        originalname: 'clip.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        size: 1024 * 1024 * 5,
        destination: './uploads',
        filename: 'test-uuid-1234.mp4',
      };

      await request(app)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'clip.mp4',
          contentType: 'video/mp4',
        });

      expect(mockSuccess).toHaveBeenCalledWith(
        expect.anything(),
        {
          url: '/uploads/test-uuid-1234.mp4',
          type: 'video',
          filename: 'test-uuid-1234.mp4',
          size: 1024 * 1024 * 5,
        },
        'File uploaded successfully',
        201
      );
    });

    it('should return 400 for unsupported file type', async () => {
      mockFileRef.current = {
        fieldname: 'file',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        destination: './uploads',
        filename: 'test-uuid-1234.pdf',
      };

      await request(app)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-pdf-data'), {
          filename: 'document.pdf',
          contentType: 'application/pdf',
        });

      expect(mockError).toHaveBeenCalledWith(
        expect.anything(),
        'Unsupported file type',
        400
      );
    });

    it('should return 400 when image exceeds 10MB limit', async () => {
      mockFileRef.current = {
        fieldname: 'file',
        originalname: 'huge-photo.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024 + 1,
        destination: './uploads',
        filename: 'test-uuid-1234.jpg',
      };

      await request(app)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-data'), {
          filename: 'huge-photo.jpg',
          contentType: 'image/jpeg',
        });

      expect(mockError).toHaveBeenCalledWith(
        expect.anything(),
        'Image exceeds 10MB limit',
        400
      );
    });

    it('should return 400 when video exceeds 50MB limit', async () => {
      mockFileRef.current = {
        fieldname: 'file',
        originalname: 'huge-video.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        size: 50 * 1024 * 1024 + 1,
        destination: './uploads',
        filename: 'test-uuid-1234.mp4',
      };

      await request(app)
        .post('/api/media/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-data'), {
          filename: 'huge-video.mp4',
          contentType: 'video/mp4',
        });

      expect(mockError).toHaveBeenCalledWith(
        expect.anything(),
        'Video exceeds 50MB limit',
        400
      );
    });
  });
});
