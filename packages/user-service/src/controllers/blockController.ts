import { Response } from 'express';
import { BlockedUser, success, error, AuthRequest } from '@breezy/shared';

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
