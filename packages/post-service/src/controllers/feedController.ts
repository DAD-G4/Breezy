import { Response } from 'express';
import { PostModel as Post, Follower, success, error, AuthRequest } from '@breezy/shared';

/**
 * GET /api/posts/feed
 * Chronological feed of posts from followed users.
 * 1. Query Followers table for followed user_ids
 * 2. Query MongoDB posts where user_id IN followed_ids
 * 3. Sort by created_at descending, paginate with ?page=1&limit=20
 */
export async function getFeed(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const followedRows = await Follower.findAll({
      where: { follower_id: req.user.id },
      attributes: ['following_id'],
    });

    const followedIds = followedRows.map((row: any) => row.following_id as number);

    const allUserIds = [...new Set([req.user.id, ...followedIds])];

    const posts = await Post.find({ user_id: { $in: allUserIds } })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ user_id: { $in: allUserIds } });

    success(res, {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[GetFeed]', err);
    error(res, 'Internal server error', 500);
  }
}
