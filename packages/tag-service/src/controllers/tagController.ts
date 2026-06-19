import { Request, Response } from 'express';
import { PostModel as Post, success, error } from '@breezy/shared';

/**
 * GET /api/tags/search?q=monTag&page=1&limit=20
 * Search posts by tag (case-insensitive), paginated, reverse chronological.
 * Public endpoint — no authentication required.
 */
export async function searchPostsByTag(req: Request, res: Response): Promise<void> {
  const q = req.query.q;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    error(res, 'Search query (q) is required', 400);
    return;
  }

  const searchTerm = q.trim().toLowerCase();
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const posts = await Post.find({ tags: searchTerm })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments({ tags: searchTerm });

  success(res, {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
