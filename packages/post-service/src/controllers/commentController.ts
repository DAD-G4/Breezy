import { Response } from 'express';
import mongoose from 'mongoose';
import { PostModel as Post, success, error, AuthRequest } from '@breezy/shared';

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;
  const { content } = req.body;

  const post = await Post.findById(id);

  if (!post) {
    error(res, 'Post not found', 404);
    return;
  }

  const newComment = {
    comment_id: new mongoose.Types.ObjectId(),
    user_id: req.user.id,
    content,
    created_at: new Date(),
    replies: [],
  };

  post.comments.push(newComment as any);
  await post.save();

  success(res, newComment, 'Comment added successfully', 201);
}

export async function replyToComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id, commentId } = req.params;
  const { content } = req.body;

  const post = await Post.findById(id);

  if (!post) {
    error(res, 'Post not found', 404);
    return;
  }

  const comment = post.comments.find(
    (c) => c.comment_id.toString() === commentId
  );

  if (!comment) {
    error(res, 'Comment not found', 404);
    return;
  }

  const newReply = {
    reply_id: new mongoose.Types.ObjectId(),
    user_id: req.user.id,
    content,
    created_at: new Date(),
  };

  comment.replies.push(newReply as any);
  await post.save();

  success(res, newReply, 'Reply added successfully', 201);
}
