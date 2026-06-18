import { Response } from 'express';
import { PostModel, success, error, AuthRequest } from '@breezy/shared';

/**
 * Extract hashtags from post content.
 * Returns unique lowercase tags without the # prefix.
 */
const extractTags = (content: string): string[] => {
  const matches = content.match(/#(\w+)/g);
  return matches ? [...new Set(matches.map(t => t.slice(1).toLowerCase()))] : [];
};

/**
 * POST /api/posts
 * Create a new post. Validates 280 char max, extracts #hashtags from content.
 */
export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { content, media } = req.body;

    if (!content || typeof content !== 'string') {
      error(res, 'Content is required', 400);
      return;
    }

    if (content.length > 280) {
      error(res, 'Content cannot exceed 280 characters', 400);
      return;
    }

    const tags = extractTags(content);

    const post = await PostModel.create({
      user_id: req.user.id,
      content,
      tags,
      media: media || null,
    });

    success(res, post, 'Post created successfully', 201);
  } catch (err) {
    console.error('[CreatePost]', err);
    error(res, 'Internal server error', 500);
  }
}

/**
 * GET /api/posts/user/:id
 * Get all posts by user_id, paginated, reverse chronological.
 * Query params: ?page=1&limit=20
 */
export async function getUserPosts(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const posts = await PostModel.find({ user_id: parseInt(id, 10) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PostModel.countDocuments({ user_id: parseInt(id, 10) });

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
    console.error('[GetUserPosts]', err);
    error(res, 'Internal server error', 500);
  }
}

/**
 * DELETE /api/posts/:id
 * Delete own post only. 403 if not owner, 404 if not found.
 */
export async function deletePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const post = await PostModel.findById(id);

    if (!post) {
      error(res, 'Post not found', 404);
      return;
    }

    if (req.user.id !== post.user_id) {
      error(res, 'Forbidden: you can only delete your own posts', 403);
      return;
    }

    await PostModel.findByIdAndDelete(id);

    success(res, { deleted: true }, 'Post deleted successfully');
  } catch (err) {
    console.error('[DeletePost]', err);
    error(res, 'Internal server error', 500);
  }
}
