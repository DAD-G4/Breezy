import { Response } from 'express';
import { Follower, success, error, AuthRequest } from '@breezy/shared';

/**
 * POST /api/users/follow/:id
 * Follow a user. Prevents self-follow (400) and duplicate follow (409).
 */
export async function followUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const followingId = parseInt(id, 10);

    if (req.user.id === followingId) {
      error(res, 'Cannot follow yourself', 400);
      return;
    }

    const existingFollow = await Follower.findOne({
      where: {
        follower_id: req.user.id,
        following_id: followingId,
      },
    });

    if (existingFollow) {
      error(res, 'Already following', 409);
      return;
    }

    const follow = await Follower.create({
      follower_id: req.user.id,
      following_id: followingId,
    });

    success(res, follow, 'Successfully followed user');
  } catch (err: any) {
    // Sequelize UniqueConstraintError for race conditions
    if (err.name === 'SequelizeUniqueConstraintError') {
      error(res, 'Already following', 409);
      return;
    }
    console.error('[FollowUser]', err);
    error(res, 'Internal server error', 500);
  }
}

/**
 * DELETE /api/users/unfollow/:id
 * Unfollow a user. Returns 404 if not currently following.
 */
export async function unfollowUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const followingId = parseInt(id, 10);

    const deleted = await Follower.destroy({
      where: {
        follower_id: req.user.id,
        following_id: followingId,
      },
    });

    if (!deleted) {
      error(res, 'Not following this user', 404);
      return;
    }

    success(res, null, 'Successfully unfollowed user');
  } catch (err) {
    console.error('[UnfollowUser]', err);
    error(res, 'Internal server error', 500);
  }
}
