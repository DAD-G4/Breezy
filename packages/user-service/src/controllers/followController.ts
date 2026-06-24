import { Response } from 'express';
import { NotificationModel as Notification, Follower, UserModel, success, error, AuthRequest } from '@breezy/shared';

/**
 * Notifications de nouveau follower (Fx16) : réservées aux utilisateurs STANDARD.
 * La matrice exclut explicitement modérateurs et admins (User ✅, Mod ❌, Admin ❌).
 */
async function recipientIsStandardUser(userId: number): Promise<boolean> {
  const u = await UserModel.findByPk(userId, { attributes: ['role'] });
  return !!u && u.role === 'user';
}

export async function followUser(req: AuthRequest, res: Response): Promise<void> {
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

  try {
    const follow = await Follower.create({
      follower_id: req.user.id,
      following_id: followingId,
    });

    // Notif uniquement si le destinataire est un utilisateur standard (Fx16).
    if (await recipientIsStandardUser(followingId)) {
      await Notification.create({
        recipient_id: followingId,
        sender_id: req.user.id,
        type: 'follow',
        post_id: null,
        is_read: false,
      });
    }

    success(res, follow, 'Successfully followed user');
  } catch (err: any) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      error(res, 'Already following', 409);
      return;
    }
    throw err;
  }
}

export async function unfollowUser(req: AuthRequest, res: Response): Promise<void> {
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
}
