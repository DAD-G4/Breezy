import { Response } from 'express';
import mongoose from 'mongoose';
import { PostModel as Post, NotificationModel as Notification, success, error, AuthRequest } from '@breezy/shared';

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;
  const { content } = req.body;

  const newComment = {
    comment_id: new mongoose.Types.ObjectId(),
    user_id: req.user.id,
    content,
    created_at: new Date(),
    replies: [],
  };

  const result = await Post.findByIdAndUpdate(
    id,
    { $push: { comments: newComment } },
    { new: true }
  );

  if (!result) {
    error(res, 'Post not found', 404);
    return;
  }

  // Notifie l'auteur du post (sauf s'il commente son propre post).
  if (result.user_id !== req.user.id) {
    try {
      await Notification.create({
        recipient_id: result.user_id,
        sender_id: req.user.id,
        type: 'comment',
        post_id: result._id,
        is_read: false,
      });
    } catch (notifErr) {
      console.error('[AddComment][Notif]', notifErr);
    }
  }

  success(res, newComment, 'Comment added successfully', 201);
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id, commentId } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    error(res, 'Post not found', 404);
    return;
  }

  const comment = (post.comments as any).find(
    (c: any) => c.comment_id.toString() === commentId
  );

  if (!comment) {
    error(res, 'Comment not found', 404);
    return;
  }

  if (comment.user_id !== req.user.id) {
    error(res, 'Unauthorized: you can only delete your own comments', 403);
    return;
  }

  await Post.findByIdAndUpdate(id, {
    $pull: { comments: { comment_id: new mongoose.Types.ObjectId(commentId) } },
  });

  success(res, null, 'Comment deleted successfully');
}

export async function replyToComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id, commentId } = req.params;
  const { content } = req.body;

  const newReply = {
    reply_id: new mongoose.Types.ObjectId(),
    user_id: req.user.id,
    content,
    created_at: new Date(),
  };

  const result = await Post.findOneAndUpdate(
    { _id: id, 'comments.comment_id': commentId },
    { $push: { 'comments.$.replies': newReply } },
    { new: true }
  );

  if (!result) {
    error(res, 'Post or comment not found', 404);
    return;
  }

  // Notifie l'auteur du commentaire parent (sauf s'il se répond à lui-même).
  const parentComment = (result.comments as any[]).find(
    (c) => c.comment_id.toString() === commentId
  );
  const commentAuthorId = parentComment?.user_id;
  if (commentAuthorId != null && commentAuthorId !== req.user.id) {
    try {
      await Notification.create({
        recipient_id: commentAuthorId,
        sender_id: req.user.id,
        type: 'comment',
        post_id: result._id,
        is_read: false,
      });
    } catch (notifErr) {
      console.error('[Reply][Notif]', notifErr);
    }
  }

  success(res, newReply, 'Reply added successfully', 201);
}
