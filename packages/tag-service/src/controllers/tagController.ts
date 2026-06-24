import { Request, Response } from 'express';
import { PostModel as Post, success, error } from '@breezy/shared';

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

  // Recherche partielle (insensible à la casse) : « bree » trouve « breezy ».
  // On échappe les caractères spéciaux regex pour éviter toute injection.
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagFilter = { tags: { $regex: escaped, $options: 'i' } };

  const posts = await Post.find(tagFilter)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(tagFilter);

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

export async function getTrending(_req: Request, res: Response): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingTags = await Post.aggregate([
    { $match: { created_at: { $gte: sevenDaysAgo } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, tag: '$_id', count: 1 } },
  ]);

  success(res, { tags: trendingTags });
}
