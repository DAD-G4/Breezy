import { Response } from 'express';
import { PostModel as Post, NotificationModel as Notification, success, error, AuthRequest } from '@breezy/shared';

export async function toggleLike(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id).select('user_id');
    if (!post) {
      error(res, 'Post not found', 404);
      return;
    }

    const hasLiked = post.likes?.includes(userId) ?? false;

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      hasLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } },
      { new: true },
    );

    if (!hasLiked && userId !== post.user_id) {
      const alreadyNotified = await Notification.findOne({
        recipient_id: post.user_id,
        sender_id: userId,
        type: 'like',
        post_id: post._id,
      });

      if (!alreadyNotified) {
        await Notification.create({
          recipient_id: post.user_id,
          sender_id: userId,
          type: 'like',
          post_id: post._id,
          is_read: false,
        });
      }
    }

    success(res, {
      liked: !hasLiked,
      likesCount: updatedPost!.likes.length,
    });
  } catch (err) {
    console.error('[ToggleLike]', err);
    error(res, 'Internal server error', 500);
  }
}
