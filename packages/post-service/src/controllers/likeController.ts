import { Response } from 'express';
import { PostModel as Post, NotificationModel as Notification, success, error, AuthRequest } from '@breezy/shared';

export async function toggleLike(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;
  const userId = req.user.id;

  // Atomic toggle: single findOneAndUpdate with $cond aggregation
  const updatedPost = await Post.findOneAndUpdate(
    { _id: id },
    [{
      $set: {
        likes: {
          $cond: {
            if: { $in: [userId, '$likes'] },
            then: { $setDifference: ['$likes', [userId]] },
            else: { $setUnion: ['$likes', [userId]] },
          },
        },
      },
    }],
    { new: true },
  );

  if (!updatedPost) {
    error(res, 'Post not found', 404);
    return;
  }

  const liked = updatedPost.likes.includes(userId);

  // Atomic notification dedup: upsert prevents duplicates without TOCTOU
  if (liked && userId !== updatedPost.user_id) {
    await Notification.findOneAndUpdate(
      {
        recipient_id: updatedPost.user_id,
        sender_id: userId,
        type: 'like',
        post_id: updatedPost._id,
      },
      {
        $setOnInsert: {
          recipient_id: updatedPost.user_id,
          sender_id: userId,
          type: 'like',
          post_id: updatedPost._id,
          is_read: false,
        },
      },
      { upsert: true },
    );
  }

  success(res, {
    liked,
    likesCount: updatedPost.likes.length,
  });
}
