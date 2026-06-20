import { Response } from 'express';
import { PostModel, UserModel, NotificationModel as Notification, success, error, AuthRequest } from '@breezy/shared';

const extractTags = (content: string): string[] => {
  const matches = content.match(/#(\w+)/g);
  return matches ? [...new Set(matches.map(t => t.slice(1).toLowerCase()))] : [];
};

const extractMentions = (content: string): string[] => {
  const matches = content.match(/@(\w+)/g);
  return matches ? [...new Set(matches.map(m => m.slice(1).toLowerCase()))] : [];
};

/** POST /api/posts */
export async function createPost(req: AuthRequest, res: Response): Promise<void> {
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

  const mentions = extractMentions(content);
  for (const username of mentions) {
    try {
      const mentionedUser = await UserModel.findOne({ where: { username } });
      if (mentionedUser && mentionedUser.id !== req.user.id) {
        await Notification.create({
          recipient_id: mentionedUser.id,
          sender_id: req.user.id,
          type: 'mention',
          post_id: post._id,
          is_read: false,
        });
      }
    } catch (notifErr) {
      console.error('[CreatePost][Mention]', notifErr);
    }
  }

  success(res, post, 'Post created successfully', 201);
}

/** GET /api/posts/user/:id — query params: ?page=1&limit=20 */
export async function getUserPosts(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;
  const userId = parseInt(id, 10);
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const posts = await PostModel.find({ user_id: userId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PostModel.countDocuments({ user_id: userId });

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

/** DELETE /api/posts/:id — owner only */
export async function deletePost(req: AuthRequest, res: Response): Promise<void> {
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
}

/** PUT /api/posts/:id — owner only */
export async function updatePost(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    error(res, 'Content is required', 400);
    return;
  }

  if (content.length > 280) {
    error(res, 'Content cannot exceed 280 characters', 400);
    return;
  }

  const post = await PostModel.findById(id);

  if (!post) {
    error(res, 'Post not found', 404);
    return;
  }

  if (req.user.id !== post.user_id) {
    error(res, 'Forbidden: you can only update your own posts', 403);
    return;
  }

  const updateData: { content: string; tags?: string[] } = { content };

  if (content !== post.content) {
    updateData.tags = extractTags(content);
  }

  const updated = await PostModel.findByIdAndUpdate(id, updateData, { new: true });

  success(res, updated, 'Post updated successfully');
}
