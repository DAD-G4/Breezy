import { Response } from 'express';
import { BlockedUser, Follower, UserModel, ProfileModel, success, error, AuthRequest } from '@breezy/shared';

export async function blockUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;
  const blockedId = parseInt(id, 10);

  if (req.user.id === blockedId) {
    error(res, 'Cannot block yourself', 400);
    return;
  }

  try {
    const block = await BlockedUser.create({
      blocker_id: req.user.id,
      blocked_id: blockedId,
    });

    // Auto-unfollow when blocking
    await Follower.destroy({
      where: {
        follower_id: req.user.id,
        following_id: blockedId,
      },
    });

    success(res, block, 'Successfully blocked user');
  } catch (err: any) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      error(res, 'Already blocked', 409);
      return;
    }
    throw err;
  }
}

export async function unblockUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;
  const blockedId = parseInt(id, 10);

  const deleted = await BlockedUser.destroy({
    where: {
      blocker_id: req.user.id,
      blocked_id: blockedId,
    },
  });

  if (!deleted) {
    error(res, 'Not blocking this user', 404);
    return;
  }

  success(res, null, 'Successfully unblocked user');
}

export async function getBlockedUsers(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const blocks = await BlockedUser.findAll({
    where: { blocker_id: req.user.id },
    include: [{
      model: UserModel,
      as: 'blocked',
      attributes: ['id', 'username'],
      include: [{
        model: ProfileModel,
        as: 'profile',
        attributes: ['display_name', 'avatar_url'],
      }],
    }],
    order: [['created_at', 'DESC']],
  });

  const users = blocks.map((b: any) => {
    const u = b.get('blocked');
    if (!u) return null;
    return {
      id: u.get('id'),
      username: u.get('username'),
      display_name: u.get('profile')?.display_name || u.get('username'),
      avatar_url: u.get('profile')?.avatar_url || null,
    };
  }).filter(Boolean);

  success(res, { users });
}
