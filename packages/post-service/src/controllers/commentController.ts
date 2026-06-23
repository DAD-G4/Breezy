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

  success(res, newComment, 'Comment added successfully', 201);
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

  success(res, newReply, 'Reply added successfully', 201);
}
